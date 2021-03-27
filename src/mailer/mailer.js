const { mailTransporter, renderMailTemplate } = require("./mailer_config");
const path = require("path");
const sendMail = (data) => {
  return new Promise((res, rej) => {
    const htmlRes = renderMailTemplate(
      data,
      path.join(__dirname, "mail_templates", data.mailType + ".ejs")
    );
    if (!htmlRes.success) {
      res({ success: false });
    }
    mailTransporter.sendMail(
      {
        from: "mailerserver528@gamil.com",
        to: data.to,
        subject: data.subject,
        html: htmlRes.template,
      },
      (err, info) => {
        if (err) {
          res({ success: false, message: err });
        }
        res({ success: true, message: info });
      }
    );
  });
};

module.exports = { sendMail };
