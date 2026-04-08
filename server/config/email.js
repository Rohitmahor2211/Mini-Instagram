const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.Email_user_account,
        pass: process.env.Email_APP_KEY,
    },
})

module.exports = transporter;