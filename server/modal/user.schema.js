const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  mobile: { // ✅ changed
    type: String,
    required: true,
  },

  age: {
    type: Number,
    min: 16, // ✅ validation
  },

  day: { // ✅ changed
    type: Number,
  },

  month: {
    type: Number,
  },

  year: {
    type: Number,
  },

  city: {
    type: String,
  },

  country: {
    type: String,
  },

  policy: {
    type: Boolean,
    required: true,
  },

  otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true
});

module.exports = mongoose.model("User_Account", userSchema);