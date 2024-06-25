const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    default: "Update fatherName"
  },
  guardianName: {
    type: String,
    default: "Update guardianName"
  },
  gender: {
    type: String,
    default: 'choose',
    enum: ['choose','Male', 'Female', 'Other']
  },
  aadhar: {
    type: String,
    unique: true,
    default: "Update aadharNo"
  },
  image: {
    type: String,
    default: "Update Image"
  },
  payImage: {
    type: String,
    default: "Update payImage"
  },
  sign: {
    type: String,
    default: "Update sign"
  },
  guardianMobile: {
    type: String,
    default: "Update guardianMobile"
  },
  whatsapp: {
    type: String,
    default: "Update whatsapp"
  },
  aim: {
    type: String,
    default: "Update aim"
  },
  qualification: {
    type: String,
    default: "Update qualification"
  },
  dob: {
    type: Date,
    default: Date.now
  },
  religion: {
    type: String,
    default: "Update religion"
  },
  shifts: [{
    type: Number,
    enum: [0,1, 2, 3, 4, 5],
    default:0
  }],
  month: {
    type: String,
    enum: [
      'choose',
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    default: 'choose'
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  address: {
    type: String,
    default: "Update address"
  },
  is_admin: {
    type: Number,
    default: 0
  },
  is_verified: {
    type: Number,
    default: 0
  }
}, { timestamps: true });



// Adding indexes for efficient queries
studentSchema.index({ year: 1 });
studentSchema.index({ year: 1, month: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ mobile: 1 });
studentSchema.index({ is_admin: 1 });
studentSchema.index({ is_verified: 1 });

const User = mongoose.model('Student', studentSchema);

module.exports = User;
