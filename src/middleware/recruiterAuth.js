const jwt = require("jsonwebtoken");
const Recruiter = require("../models/recruiter");

const recruiterAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const recruiter = await Recruiter.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!recruiter) {
      throw new Error();
    }

    //set properties on request
    req.recruiter = recruiter;
    req.token = token;
    next();
    // console.log(token);
  } catch (err) {
    res.status(401).send({ error: "Not Authenticated" });
  }
};

module.exports = recruiterAuth;
