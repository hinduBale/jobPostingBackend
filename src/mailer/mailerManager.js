const { EventEmitter } = require("events");
const Queue = require("./queue");
const { sendMail } = require("./mailer");
const mailerEventEmitter = new EventEmitter();
const mailerQueue = new Queue({
  name: "mailer-queue-1", //if used as micro service we can use worker threads on run many mailers in parallel depending on thread pool
  queueRecheckTime: 30 * 1000,
  mailerFunction: sendMail,
});

mailerEventEmitter.on("triggerEmail", (data) => {
  // console.log("Pending Queue: ", mailerQueue.returnQueue()); //only for testing purpose
  mailerQueue.push(data);
  mailerQueue.sendMail();
});

mailerQueue.init();

module.exports = { mailerEventEmitter };
