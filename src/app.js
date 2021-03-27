const express = require("express");
require("./db/mongoose");

const jobRouter = require("./routers/job");
const candidateRouter = require("./routers/candidate");
const recruiterRouter = require("./routers/recruiter");

const app = express();

app.use(express.json());
app.use(jobRouter);
app.use(candidateRouter);
app.use(recruiterRouter);

module.exports = app;
