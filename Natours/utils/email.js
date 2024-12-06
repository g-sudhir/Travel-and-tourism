const nodemailer = require('nodemailer');

const sendEmail = async options => {
 // Looking to send emails in production? Check out our Email API/SMTP product!
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b7b8ef29b6e4ba",
    pass: "162ed5890b5ceb"
  }
});

  const mailOptions = {
    from: 'Sudhir <sudhirg.21cse@kongu.edu>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transport.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
      return;
    }
  });
};


module.exports = sendEmail;

