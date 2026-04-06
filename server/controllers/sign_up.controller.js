const transporter = require('../config/email');
const otp = require('./otp')
const userSchema = require('../modal/user.schema')
const jwt = require('jsonwebtoken')

const sign_up = async (req, res) => {
    const { name, email, mobile, age, day, month, year, city, country, policy } = req.body;
    const code = otp()

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
            console.log(error)
        }
    }
    await existing_user.save()

    const token = jwt.sign(
        { userId: existing_user._id },
        process.env.JWT_secret,
        { expiresIn: "1d" }
    )

    try {
        const info = await transporter.sendMail({
            from: `Example Team" <${process.env.Email_user_account}>`,
            to: `${email}`,
            subject: "Account Verification Email",
            text: "Email verification OTP",
            html: `<div style="font-weight:600; text-align:center; font-size:"25px";>${code}</div>`,
        });

        console.log("Message sent: %s", info.messageId);
    } catch (err) {
        console.error("Error while sending mail:", err);
    }

    res.status(201).json({
        message: "User Creataed..!",
        status: res.status,
        jwt_token: token
    })
}


const email_verification = async (req, res) => {
    try {
        const { code } = req.body;
        console.log(code)
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