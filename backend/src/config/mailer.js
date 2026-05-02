const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

async function sendEmail(to, subject, text) {
    console.log("in");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Missing");
    await transporter.sendMail({
        from: `<${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
}

module.exports = sendEmail;
