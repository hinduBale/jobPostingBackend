const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Job = require("./job");

const recruiterSchema = new mongoose.Schema(
  {
    companyName: {
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
    socialHandles: {
      website: {
        type: String,
        required: true,
        trim: true,
      },
      linkedIn: {
        type: String,
        required: true,
        trim: true,
      },
    },
    officeLocation: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      prefix: Number,
      localNumber: Number,
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

//recruiter may or may not post jobs hence we make it as virtual property and later populate.
recruiterSchema.virtual("jobsPosted", {
  ref: "Job",
  localField: "_id",
  foreignField: "recruiter",
});

recruiterSchema.methods.generateAuthToken = async function () {
  const recruiter = this;
  const token = jwt.sign(
    { _id: recruiter._id.toString() },
    process.env.JWT_SECRET
  );

  //on login requrest, token will be generated and
  //saved in the database.
  recruiter.tokens = recruiter.tokens.concat({ token });
  await recruiter.save();
  return token;
};

//automatically called.
recruiterSchema.methods.toJSON = function () {
  const recruiter = this;
  const recruiterObject = recruiter.toObject();

  //not included in final json received on client.
  delete recruiterObject.password;
  delete recruiterObject.tokens;
  delete recruiterObject.avatar;
  return recruiterObject;
};

recruiterSchema.statics.findByCredentials = async (email, password) => {
  const recruiter = await Recruiter.findOne({ email });
  if (!recruiter) {
    throw new Error("Unable to login..");
  }

  const isMatch = await bcrypt.compare(password, recruiter.password);

  if (!isMatch) {
    throw new Error("Unable to login..");
  }

  return recruiter;
};

recruiterSchema.pre("save", async function (next) {
  const recruiter = this;

  if (recruiter.isModified("password")) {
    recruiter.password = await bcrypt.hash(recruiter.password, 8);
  }
  next();
});

//Not needed in problem statement. Delete Recruiter Job Posts when recruiter is removed.
recruiterSchema.pre("remove", async function (next) {
  const recruiter = this;

  await Job.deleteMany({ recruiter: recruiter._id });
  next();
});

const Recruiter = mongoose.model("Recruiter", recruiterSchema);

module.exports = Recruiter;
