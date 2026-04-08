// const nodemailer = require("nodemailer");

// // Create a transporter using SMTP
// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     family: 4, // 👈 force IPv4
//     auth: {
//         user: process.env.Email_user_account,
//         pass: process.env.Email_APP_KEY,
//     },
// })

// module.exports = transporter;



const formData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
});

module.exports = mg;
