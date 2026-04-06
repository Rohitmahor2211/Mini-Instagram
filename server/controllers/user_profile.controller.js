const { z } = require("zod")
const path = require("path")
const fs = require('fs')
const fileSchema = require('../modal/fileSchema.zod')
const cloudinary = require('../config/cloudinary')
const bcrypt = require('bcrypt')
const userSchema = require('../modal/user.schema')


const user_profile = async (req, res) => {
    const userId = req.user.userId;
    // 1. Text fields are now available here    
    const { profileName, password } = req.body;
    // 2. File info is available here
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const exesting_profile = await userSchema.findById(userId);

        if (!exesting_profile) {
            return res.status(404).json({ message: "User not found" });
        }

        if (exesting_profile.profileName === profileName) {
            return res.status(400).json({
                message: "profile already exists..!"
            });

        } else {

            const validateFile = fileSchema.parse(file)
            console.log("File received and validated:", validateFile.originalname);
            if (!validateFile) {
                return res.status(404).json({
                    message: "file in not valide formet..!"
                })
            }

            const cloudinary_response = await cloudinary.uploader.upload(req.file.path, {
                folder: "instagram" // Folder name in Cloudinary
            })
            fs.unlinkSync(req.file.path)

            const hashPassword = await bcrypt.hash(password, 10);
            try {
                exesting_profile.profileName = profileName;
                exesting_profile.password = hashPassword;
                exesting_profile.profilePic = cloudinary_response.secure_url;

                await exesting_profile.save();

                console.log(exesting_profile);
                return res.status(200).json({
                    message: "user profile created successfully..! 🚀",
                    user: profileName,
                    imageUrl: cloudinary_response.secure_url
                });
            } catch (error) {
                return res.status(400).json({
                    message: "user profile not created..!",
                    error: error.message
                });
            }
        }
    }
    catch (error) {
        if (file && file.path) {
            fs.unlink(file.path, (err) => {
                if (err) console.error("Error deleting invalid file:", err);
                else console.log("Successfully deleted invalid upload:", file.path);
            });
        }

        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors, message: "zod schema not matched" });
        }
        res.status(500).json({ error: "Something went wrong" });
    }

};

module.exports = { user_profile };