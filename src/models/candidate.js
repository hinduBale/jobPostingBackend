const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Job = require("./job");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minlength: 6,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Choose a strong password");
        }
      },
    },
    jobsAppliedTo: [
      {
        job: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Job",
        },
        status: {
          type: String,
          enum: ["ACCEPTED", "REJECTED", "PENDING"],
          default: "PENDING",
        },
      },
    ],
    drafts: [
      {
        job: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Job",
        },
        status: {
          type: String,
          enum: ["PUBLISH", "DRAFT", "REJECT"],
          default: "DRAFT",
        },
      },
    ],
    //storing array of tokens, allowing multiple connections.
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

candidateSchema.methods.generateAuthToken = async function () {
  const candidate = this;
  const token = jwt.sign(
    { _id: candidate._id.toString() },
    process.env.JWT_SECRET
  );
  candidate.tokens = candidate.tokens.concat({ token });
  await candidate.save();
  return token;
};

candidateSchema.methods.toJSON = function () {
  const candidate = this;
  const candidateObject = candidate.toObject();

  //not included in final json received on client.
  delete candidateObject.password;
  delete candidateObject.tokens;
  delete candidateObject.avatar;
  return candidateObject;
};

candidateSchema.statics.findByCredentials = async (email, password) => {
  const candidate = await Candidate.findOne({ email });
  if (!candidate) {
    throw new Error("Unable to login..");
  }

  const isMatch = await bcrypt.compare(password, candidate.password);

  if (!isMatch) {
    throw new Error("Unable to login..");
  }

  return candidate;
};

//HASHING
//middleware which runs before save().
candidateSchema.pre("save", async function (next) {
  const candidate = this;

  if (candidate.isModified("password")) {
    candidate.password = await bcrypt.hash(candidate.password, 8);
  }
  next();
});

const Candidate = mongoose.model("Candidate", candidateSchema);

module.exports = Candidate;
