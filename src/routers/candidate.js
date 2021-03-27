/*
candidate:
  - signup: done
  - login: done
  - list all applied jobs and their status: done
  - apply to jobs: done
  - delete job application: done
  - send mail to recruiter on applying: done
*/

const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate");
const auth = require("../middleware/candidateAuth");
const { mailerEventEmitter } = require("../mailer/mailerManager");

const Job = require("../models/job");

//related to candidate login/signup.
//login
router.post("/candidates/login", async (req, res) => {
  try {
    //method for instance of Candidate.
    const candidate = await Candidate.findByCredentials(
      req.body.email,
      req.body.password
    );

    //create jwt token
    const token = await candidate.generateAuthToken();
    res.send({ candidate, token });
  } catch (err) {
    res.status(400).send();
  }
});

//signup
router.post("/candidates", async (req, res) => {
  const candidate = new Candidate(req.body);

  try {
    //save to DB.
    await candidate.save();

    //welcome Email can be sent.
    //creating jwt token
    const token = await candidate.generateAuthToken();

    res.status(201).send({ candidate, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/candidates/logout", auth, async (req, res) => {
  try {
    req.candidate.tokens = req.candidate.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.candidate.save();
    res.send({
      result: "Logout Successfull",
    });
  } catch (err) {
    res.status(500).send();
  }
});

//logout of all sessions, like on netflix.
router.post("/candidates/logoutAll", auth, async (req, res) => {
  try {
    req.candidate.tokens = [];
    await req.candidate.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/candidates/me", auth, async (req, res) => {
  res.send(req.candidate);
});

router.patch("/candidates/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({
      error: "Invalid Updates",
    });
  }

  try {
    updates.forEach((update) => {
      //dynamic update
      req.candidate[update] = req.body[update];
    });

    await req.candidate.save();

    res.send(req.candidate);
  } catch (err) {
    res.status(404).send(err);
  }
});

//related to candidate job applications
// get all candidate job applications.
router.get("/candidates/applications", auth, async (req, res) => {
  try {
    await req.candidate
      .populate({
        path: "jobsAppliedTo.job",
        select: "-candidatesApplied", //don't send other user details
      })
      .execPopulate();
    res.send(req.candidate.jobsAppliedTo);
  } catch (err) {
    res.status(500).send();
  }
});

//Candidate applies for job.
router.post("/candidates/applications/:job_id", auth, async (req, res) => {
  const job_id = req.params.job_id;
  console.log(job_id);

  try {
    const job = await Job.findOne({ _id: job_id });

    if (!job) {
      return res.status(404).send({
        error: "Invalid Job ID",
      });
    }

    const index = req.candidate.jobsAppliedTo.findIndex(
      (obj) => obj.job == job_id
    );

    //check if already applied for the job.
    if (index !== -1) {
      return res.send({
        result: "Candidate has already applied for the job.",
      });
    }

    const jobApplied = {
      job: job_id,
      status: "PENDING",
    };
    const candidateApplied = {
      candidate: req.candidate._id,
      candidateStatus: "PENDING",
    };
    console.log(jobApplied, candidateApplied);

    //update in both job and candidate documents.
    req.candidate.jobsAppliedTo.push(jobApplied);
    job.candidatesApplied.push(candidateApplied);

    await req.candidate.save();
    await job.save();

    //SEND JOB APPLIED MAIL TO RECRUITER.
    await job.populate("recruiter").execPopulate();

    console.log(job.recruiter);

    mailerEventEmitter.emit("triggerEmail", {
      to: job.recruiter.email,
      name: job.recruiter.contactPerson,
      companyName: job.recruiter.companyName,
      candidateEmail: req.candidate.email,
      candidateName: req.candidate.name,
      subject: "A candidate applied for your job post!!",
      mailType: "recruiter",
    });

    res.send(req.candidate.jobsAppliedTo);
  } catch (err) {
    res.status(500).send(err);
  }
});

//delete job application
router.delete("/candidates/applications/:job_id", auth, async (req, res) => {
  //verify job id and then remove application from both documents.
  const job_id = req.params.job_id;

  try {
    const job = await Job.findOne({ _id: job_id });

    if (!job) {
      return res.status(404).send({
        error: "Invalid Job ID",
      });
    }

    //remove from candidate's document.
    req.candidate.jobsAppliedTo = req.candidate.jobsAppliedTo.filter((obj) => {
      return obj.job.toString() != job_id.toString();
    });

    console.log(req.candidate._id);

    //remove from job document, update vacancies and status.
    job.candidatesApplied = job.candidatesApplied.filter((obj) => {
      if (obj.candidate.toString() != req.candidate._id.toString()) {
        return true;
      } else {
        if (obj.candidateStatus === "ACCEPTED") {
          //user deleted application after getting accepted.
          //send mail to recruiter that this candidate has taken application back.
          job.jobDetails.vacancies += 1;
          job.status = "OPEN";
        }
      }
      return false;
    });

    await req.candidate.save();
    await job.save();

    res.send(req.candidate.jobsAppliedTo);
  } catch (err) {
    res.status(500).send();
  }
});

//drafts
//get all drafts
router.get("/candidates/drafts", auth, async (req, res) => {
  try {
    await req.candidate
      .populate({
        path: "drafts.job",
        select: "-candidatesApplied", //don't send other user details
      })
      .execPopulate();
    res.send(req.candidate.drafts);
  } catch (err) {
    res.status(500).send();
  }
});

//save as draft.
router.post("/candidates/drafts/:job_id", auth, async (req, res) => {
  const job_id = req.params.job_id;
  try {
    const job = await Job.findOne({ _id: job_id });

    if (!job) {
      return res.status(404).send({
        error: "Invalid Job ID",
      });
    }

    req.candidate.drafts.push({
      job: job_id,
      status: "DRAFT",
    });

    await req.candidate.save();
    res.send(req.candidate.drafts);
  } catch (err) {
    res.status(500).send();
  }
});

//DELETE draft or PUBLISH it.
router.post("/candidates/drafts/:job_id/:option", auth, async (req, res) => {
  const job_id = req.params.job_id;
  let option = req.params.option;
  option = option.toUpperCase().trim();
  try {
    const job = await Job.findOne({ _id: job_id });

    if (!job) {
      return res.status(404).send({
        error: "Invalid Job ID",
      });
    }

    //check if invalid option provided.
    if (!["DELETE", "PUBLISH"].includes(option)) {
      return res.status(404).send({
        error: `Invalid option: ${option}`,
      });
    }
    console.log("here");

    //if option is published then push to job.candidatesApplied otherwise delete draft.
    req.candidate.drafts = req.candidate.drafts.filter((obj) => {
      if (obj.job == job_id) {
        if (option == "PUBLISH") {
          job.candidatesApplied.push({
            candidate: req.candidate._id,
            status: "PENDING",
          });
        }
      }
      return obj.job != job_id;
    });

    console.log(req.candidate.drafts);

    await job.save();
    await req.candidate.save();

    res.send(req.candidate.drafts);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
