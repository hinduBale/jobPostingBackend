const express = require("express");
const router = express.Router();
const Job = require("../models/job");

router.get("/home", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "OPEN" }).select(
      "-candidatesApplied"
    );
    res.send(jobs);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
