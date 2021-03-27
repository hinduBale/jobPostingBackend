const jwt = require("jsonwebtoken");
const Candidate = require("../models/candidate");

const candidateAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const candidate = await Candidate.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!candidate) {
      throw new Error();
    }

    req.candidate = candidate;
    req.token = token;
    next();
    // console.log(token);
  } catch (err) {
    res.status(401).send({ error: "Not Authenticated" });
  }
};

module.exports = candidateAuth;
