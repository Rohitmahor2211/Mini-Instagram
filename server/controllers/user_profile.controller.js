const { z } = require("zod")
// const path = require("path")
const fs = require('fs')
const fileSchema = require('../modal/fileSchema.zod')
const cloudinary = require('../config/cloudinary')
const bcrypt = require('bcrypt')
const userSchema = require('../modal/user.schema')
const streamifier = require("streamifier");

const user_profile = async (req, res) => {
    const userId = req.user.userId;
    // 1. Text fields are now available here    
    const { profileName, password } = req.body;
    // 2. File info is available here
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const existing_profile = await userSchema.findById(userId);

        if (!existing_profile) {
            return res.status(404).json({ message: "User account not found" });
        }

        // 🛡️ Check if name is taken by SOMEONE ELSE
        const nameTaken = await userSchema.findOne({ profileName, _id: { $ne: userId } });
        if (nameTaken) {
            return res.status(400).json({ message: "This profile name is already taken..!" });
        }

        // 🛡️ Validate file if present
        if (file) {
            const validateFile = fileSchema.parse(file)
            if (!validateFile) {
                return res.status(400).json({ message: "File is not in valid format..!" })
            }
        }

        let cloudinary_url = existing_profile.profilePic;
        if (file) {
            const uploadFromBuffer = () => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "chat-application" },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(file.buffer).pipe(stream);
                });
            };

            const result = await uploadFromBuffer();
            cloudinary_url = result.secure_url;
        }

        const hashPassword = password ? await bcrypt.hash(password, 10) : existing_profile.password;

        existing_profile.profileName = profileName || existing_profile.profileName;
        existing_profile.password = hashPassword;
        existing_profile.profilePic = cloudinary_url;

        await existing_profile.save();

        return res.status(200).json({
            message: "User profile updated successfully..! 🚀",
            user: existing_profile.profileName,
            imageUrl: existing_profile.profilePic
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors, message: "Validation failed" });
        }
        res.status(500).json({ message: "Something went wrong" });
    }

};

module.exports = { user_profile };