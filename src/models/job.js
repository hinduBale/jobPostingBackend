const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyWebsite: {
      type: String,
      required: true,
      trim: true,
    },
    jobDescription: {
      jobTitle: {
        type: String,
        required: true,
        trim: true,
      },
      jobSummary: {
        type: String,
        required: true,
        trim: true,
      },
      lookingFor: [String],
      preferredQualifications: [String],
      jobBenifits: [String],
      payRange: String, //can be unavailable
      jobLocation: {
        type: String,
        required: true,
        trim: true,
      },
    },
    jobDetails: {
      vacancies: {
        type: Number,
        required: true,
        trim: true,
      },
      employment: {
        type: String,
        enum: ["FULLTIME", "INTERNSHIP", "PARTTIME", "FREELANCE"],
        default: "FULLTIME",
      },
      industry: {
        type: String,
        required: true,
        trim: true,
      },
    },
    startDate: {
      type: Date,
      default: Date.now(),
    },
    applyBy: {
      type: Date,
    },
    companyImageUrl: String,
    //applications OPEN or CLOSED
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
    //recruiter that posted it, it's needed to be in schema.
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
    },
    candidatesApplied: [
      {
        candidate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Candidate",
        },
        candidateStatus: {
          type: String,
          enum: ["ACCEPTED", "REJECTED", "PENDING"],
          default: "PENDING",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
