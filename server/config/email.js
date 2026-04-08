const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4, // 👈 force IPv4
    auth: {
        user: process.env.Email_user_account,
        pass: process.env.Email_APP_KEY,
    },
})

module.exports = transporter;