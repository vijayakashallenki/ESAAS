const EmailMsg = require("../../model/EmailMsg/EmailMessaging.js");
const Filter = require("bad-words");
const nodemailer = require("nodemailer");

const sendEMailMsgCtrl = async (req, res) => {
  console.log("🚀sendEmailMsgCtrl");
  const { to, subject, message, recipientEmail } = req.body;
  const user = req?.user;
  //get the message
  const emailMessage = subject + " " + message;

  //prevent bad words
  const filter = new Filter();
  const isProfen = filter.isProfane(emailMessage);

  if (user?.isBlocked) {
    throw new Error("You are Blocked and can't send Messages");
  }

  try {
    const messageAndEmail = `New Message from :${recipientEmail} , Message;${message}`;

    if (isProfen) {
      throw new Error("Email failed to send can't use profen words!");
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "lazyyshoppers@gmail.com",
        pass: "nzed oqhb nzhc lycy",
      },
    });

    const mailOptions = {
      from: "lazyyshoppers@gmail.com",
      to: "lazyyshoppers@gmail.com",
      subject: subject,
      text: messageAndEmail,
    };
    await transporter.sendMail(mailOptions);

    const emailMsg = await EmailMsg.create({
      sendBy: user?._id,
      fromEmail: user?.email,
      toEmail: to,
      message: message,
      recipientEmail: recipientEmail,
      subject: subject,
    });

    res.status(201).json("Email sent successfully");
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

module.exports = sendEMailMsgCtrl;
