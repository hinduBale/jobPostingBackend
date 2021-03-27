/*
Recruiter:
  - login: done
  - signup: done
  - logout: done
  - post job: done
  - update job details: done
  - update job status if vacancies filled: done
  - select/reject candidate: done
*/

const express = require("express");
const router = express.Router();
const Recruiter = require("../models/recruiter");
const Job = require("../models/job");
const auth = require("../middleware/recruiterAuth");
const Candidate = require("../models/candidate");
const { mailerEventEmitter } = require("../mailer/mailerManager");

//login/signup functionality

router.post("/recruiters/login", async (req, res) => {
  try {
    //method for instance of User.
    const recruiter = await Recruiter.findByCredentials(
      req.body.email,
      req.body.password
    );

    //create jwt token
    const token = await recruiter.generateAuthToken();
    res.send({ recruiter, token });
  } catch (err) {
    res.status(400).send();
  }
});

//sign up
router.post("/recruiters", async (req, res) => {
  const recruiter = new Recruiter(req.body);

  try {
    //save to DB.
    await recruiter.save();

    //creating jwt token
    const token = await recruiter.generateAuthToken();

    res.status(201).send({ recruiter, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

//logout of current session
router.post("/recruiters/logout", auth, async (req, res) => {
  try {
    //remove the token
    req.recruiter.tokens = req.recruiter.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.recruiter.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

//logout of all sessions
router.post("/recruiters/logoutAll", auth, async (req, res) => {
  try {
    req.recruiter.tokens = [];
    await req.recruiter.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

//get recruiter details
router.get("/recruiters/me", auth, async (req, res) => {
  res.send(req.user);
});

//patch recruiter details.
router.patch("/recruiters/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "companyName",
    "officeLocation",
    "contactPerson",
    "contactNumber",
    "socialHandles",
    "email",
    "password",
  ];
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
      if (update === "socialHandles") {
        req.recruiter[update] = {
          ...req.recruiter[update],
          ...req.body[update],
        };
      } else {
        req.recruiter[update] = req.body[update];
      }
    });

    await req.recruiter.save();

    res.send(req.recruiter);
  } catch (err) {
    res.status(404).send(err);
  }
});

//Not needed in problem statement.
router.delete("/recruiters/me", auth, async (req, res) => {
  try {
    await req.recruiter.remove();
    res.send(req.recruiter);
  } catch (err) {
    res.status(500).send(err);
  }
});

//for jobs.
//all jobs created by recruiter
router.get("/recruiters/jobs", auth, async (req, res) => {
  const match = {};

  //filter based on status: OPEN, CLOSED
  if (req.query.status) {
    //setting match.completed to a boolean.
    const status = req.query.status.toUpperCase();
    if (status === "OPEN" || status === "CLOSED") {
      match.status = status;
    } else {
      return res.status(400).send({
        error: `Invalid query parameter status: ${req.query.status}`,
      });
    }
  }

  //populate job posts.
  try {
    await req.recruiter
      .populate({
        path: "jobsPosted",
        match,
      })
      .execPopulate();
    res.send(req.recruiter.jobsPosted);
  } catch (err) {
    res.status(500).send(err);
  }
});

//get particular job details
router.get("/recruiters/jobs/:job_id", auth, async (req, res) => {
  const _id = req.params.job_id;

  try {
    const job = await Job.findOne({ _id, recruiter: req.recruiter._id });

    if (!job) {
      return res.status(404).send();
    }
    res.send(job);
  } catch (err) {
    res.status(500).send(err);
  }
});

//create a job.
//validation handled in models.
router.post("/recruiters/jobs", auth, async (req, res) => {
  const job = new Job({
    ...req.body,
    companyName: req.recruiter.companyName,
    companyWebsite: req.recruiter.socialHandles.website,
    recruiter: req.recruiter._id,
  });

  try {
    await job.save();
    res.status(201).send(job);
  } catch (err) {
    res.status(400).send(err);
  }
});

//update details of job
router.patch("/recruiters/jobs/:job_id", auth, async (req, res) => {
  const _id = req.params.job_id;

  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "jobDescription",
    "jobDetails",
    "startDate",
    "applyBy",
    "status",
  ];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidUpdate) {
    return res.status(400).send({
      error: "Job Post could not be updated!",
    });
  }

  try {
    const job = await Job.findOne({ _id, recruiter: req.recruiter._id });

    if (!job) {
      return res.status().send({
        error: "Job post does not exist.",
      });
    }

    updates.forEach((update) => {
      //check if object type, update accordingly.
      if (["jobDescription", "jobDetails"].includes(update)) {
        job[update] = { ...job[update], ...req.body[update] };
      } else {
        job[update] = req.body[update];
      }
    });

    await job.save();

    res.send(job);
  } catch (err) {
    res.status(404).send(err);
  }
});

//Not Needed in problem statement. We need to delete instances from candidates as well.
router.delete("/recruiters/jobs/:job_id", auth, async (req, res) => {
  console.log(req.params.job_id);
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.job_id,
      recruiter: req.recruiter._id,
    });

    if (!job) {
      return res.status(404).send();
    }

    res.send(job);
  } catch (err) {
    res.status(500).send(err);
  }
});

//select or reject a candidate, update vacancies
router.post(
  "/recruiters/jobs/:job_id/:candidate_id/:outcome",
  auth,
  async (req, res) => {
    const job_id = req.params.job_id;
    const candidate_id = req.params.candidate_id;
    const outcome = req.params.outcome.toUpperCase().trim();

    if (!["ACCEPTED", "REJECTED"].includes(outcome)) {
      return res.status(400).send({
        error: "Invalid candidate application outcome specified.",
      });
    }

    try {
      //check if candidate and job exists
      const job = await Job.findOne({
        _id: job_id,
        recruiter: req.recruiter._id,
      });
      const candidate = await Candidate.findOne({ _id: candidate_id });

      if (!job || !candidate) {
        return res.status(404).send();
      }

      //chaeck if vacancies left
      if (!job.jobDetails.vacancies) {
        //cannot reject all candidates for the job because vacancies might be increased later and candidate application should be preserved.
        return res.status(400).send({
          error: "No vacancies left!",
        });
      }

      //update in respective documents, we could have populated it using different schema if there were more use cases.
      const jIndex = job.candidatesApplied.findIndex((obj) => {
        console.log(obj.candidate, candidate_id);
        return obj.candidate.toString() == candidate_id;
      });

      const cIndex = candidate.jobsAppliedTo.findIndex((obj) => {
        console.log(obj.job, job_id);
        return obj.job.toString() == job_id;
      });

      //check if candidate has applied for job or not.
      if (cIndex === -1 || jIndex === -1) {
        return res.status(404).send({
          error: "Candidate has not applied for job",
        });
      }

      //check if candidate has already been evaluated.
      if (job.candidatesApplied[jIndex].candidateStatus === outcome) {
        return res.send({
          result: `Candidate already ${outcome}`,
        });
      }

      job.candidatesApplied[jIndex].candidateStatus = outcome;

      candidate.jobsAppliedTo[cIndex].status = outcome;

      //decreace vacancies if accepted.
      if (outcome === "ACCEPTED") {
        job.jobDetails.vacancies -= 1;

        //if no vacancies left mark it closed.
        if (job.jobDetails.vacancies === 0) {
          job.status = "CLOSED";
        }
      }

      await job.save();
      await candidate.save();

      let message; //sending message in mail.

      if (outcome === "ACCEPTED") {
        message = `we are glad to inform you that ${job.companyName} has accepted your job application.`;
      } else {
        message = `we are sorry to inform you that your application has not been considered this time. We would love to asses you next time, goodluck!`;
      }

      //send mail to candidate.
      mailerEventEmitter.emit("triggerEmail", {
        to: candidate.email,
        name: candidate.name,
        message,
        subject: `${job.companyName} has replied to your application.`,
        mailType: "candidate",
      });

      res.send({
        result: `Candidate ${outcome}`,
      });
    } catch (err) {
      res.status(500).send();
    }
  }
);

module.exports = router;
