const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter.sendMail({
    from: `E-Commerce Backend <${testAccount.user}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
