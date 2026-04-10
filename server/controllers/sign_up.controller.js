const transporter = require('../config/email');
const otp = require('./otp')
const userSchema = require('../modal/user.schema')
const jwt = require('jsonwebtoken')
// const mg = require('../config/email')

const sign_up = async (req, res) => {
    console.log("Full Request Body:", req.body); // 👈 Debugging log
    const { name, email, mobile, age, day, month, year, city, country, policy } = req.body;
    const code = otp()
    console.log("Processing Signup for:", email, "OTP:", code)

    let existing_user = await userSchema.findOne({ email })
    if (existing_user && existing_user.isVerified) {
        return res.status(409).json({
            message: "User already registered..!"
        })
    }

    if (existing_user) {
        existing_user.otp = code
        existing_user.otpExpiry = Date.now() + 5 * 60 * 1000
    }
    else {
        try {
            existing_user = new userSchema({
                name, email, mobile, age, day, month, year, city, country, otp: code, otpExpiry: Date.now() + 5 * 60 * 1000, policy
            })
        }
        catch (error) {
            console.error("Error creating user object:", error);
            return res.status(400).json({
                message: "Invalid user data provided.",
                error: error.message
            });
        }
    }

    if (!existing_user) {
        return res.status(500).json({ message: "Failed to initialize user data." });
    }
    await existing_user.save()

    const token = jwt.sign(
        { userId: existing_user._id },
        process.env.JWT_secret,
        { expiresIn: "1d" }
    )

    try {
        // await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        //     from: `Chat App <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        //     to: [email],
        //     subject: "Account Verification OTP",
        //     text: "Your OTP code",
        //     html: `<div style="font-size:25px;text-align:center;font-weight:600;">${code}</div>`,
        // });

        const info = await transporter.sendMail({
            from: `"Example Team" < ${process.env.Email_user_account} >`,
            to: `${email}`,
            subject: "Account Verification Email",
            text: "Email verification OTP",
            html: <div style="font - weight: 600; text- align: center; font - size: 25px; ">${code}</div>,
        });
        console.log("Message sent: % s", info.messageId);
        console.log("Email sent successfully");

        await existing_user.save(); // 👈 after email success

        return res.status(201).json({
            message: "User Created..! Verification email sent. 🚀",
            jwt_token: token
        });

    } catch (err) {
        console.error("Error while sending mail:", err);

        return res.status(500).json({
            message: "Email failed. User not created."
        });
    }
}


const email_verification = async (req, res) => {
    try {
        const { code } = req.body;
        // console.log(code)
        const userId = req.user.userId; // 🔥 from middleware

        const matched_user = await userSchema.findById(userId);

        if (!matched_user) {
            return res.status(404).json({
                message: "User Not found..!"
            });
        }

        if (matched_user.otp != code) {
            return res.status(400).json({
                message: "Invalid Otp..!"
            });
        }

        if (matched_user.otpExpiry < Date.now()) {
            return res.status(401).json({
                message: "Otp Expired..!"
            });
        }

        matched_user.isVerified = true;
        matched_user.otp = null;
        matched_user.otpExpiry = null;

        await matched_user.save();

        res.status(200).json({
            message: "User verified successfully..!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = { sign_up, email_verification }