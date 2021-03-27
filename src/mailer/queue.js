class Queue {
  data = [];

  constructor({ name, queueRecheckTime, mailerFunction }) {
    this.name = name;
    this.queueRecheckTime = queueRecheckTime;
    this.mailerFunction = mailerFunction;
  }

  init() {
    setInterval(() => {
      this.sendMail();
    }, this.queueRecheckTime);
  }

  async sendMail() {
    while (!this.isEmpty()) {
      const mailData = this.pop();
      console.log("Sending mail ------", mailData);
      const mailerResponse = await this.mailerFunction(mailData);
      if (mailerResponse.success) {
        console.log("Mail sent successfully for ", mailData);
      } else {
        console.log("there is some issue with smtp , check it");
        this.push(mailData);
      }
    }
  }

  push(data) {
    this.data.push(data);
  }

  pop() {
    return this.data.shift();
  }

  isEmpty() {
    if (this.data.length == 0) {
      return true;
    }
    return false;
  }

  returnQueue() {
    return this.data.map((x, i) => {
      return `At index ${i}: ${JSON.stringify(x)}`;
    });
  }
}

module.exports = Queue;
