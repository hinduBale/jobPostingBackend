const nodemailer = require("nodemailer");
const ejs = require("ejs");
const mailTransporter = nodemailer.createTransport({
  service: "google",
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.MAIL_ID, //add to env
    pass: process.env.MAIL_PASSWORD, //add to env
  },
});
// right now i have used simple smtp authentication which is not recommended,
// when we have a  proper mailing domain and account we can use Oauth token and set
// it same in google console for server side ocontent and authentication

const renderMailTemplate = (data, filePath) => {
  let res;
  ejs.renderFile(filePath, data, (err, template) => {
    if (err) {
      res = { success: false };
    } else {
      res = { template, success: true };
    }
  });
  return res;
};
module.exports = {
  mailTransporter,
  renderMailTemplate,
};
