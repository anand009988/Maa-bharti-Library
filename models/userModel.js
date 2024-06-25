const mongoose = require('mongoose');

// Define the Shift schema
const shiftSchema = new mongoose.Schema({
  shift: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
  },
  seatNo: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending"
  }
}, { _id: false });

// Define the Month schema
const monthSchema = new mongoose.Schema({
  month: {
    type: String,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
  },
  shifts: {
    type: [shiftSchema],
    default: []
  },
  paymentScreenshots: {
    type: [String],
    default: ["offline.jpg"]
  }
}, { _id: false });

// Function to create an array of month objects
const initializeMonths = () => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.map(month => ({ month, shifts: [], paymentScreenshots: [] }));
};

// Define the Admission schema
const admissionSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  months: {
    type: [monthSchema],
    default: initializeMonths // Automatically initialize with all 12 months
  }
}, { _id: false });

// Define the Student schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  mobile: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    // default: "Update fatherName"
  },
  guardianName: {
    type: String,
    // default: "Update guardianName"
  },
  gender: {
    type: String,
    default: 'Choose',
    enum: ['Choose', 'Male', 'Female', 'Other']
  },
  aadhar: {
    type: String,
    default: "update your aadhar no",
    unique: false
  },
  image: {
    type: String,
    // default: "Update Image"
  },
  sign: {
    type: String,
    // default: "Update sign"
  },
  guardianMobile: {
    type: String,
    // default: "Update guardianMobile"
  },
  whatsapp: {
    type: String,
    // default: "Update whatsapp"
  },
  aim: {
    type: String,
    // default: "Update aim"
  },
  qualification: {
    type: String,
    // default: "Update qualification"
  },
  dob: {
    type: Date,
    default: Date.now
  },
  religion: {
    type: String,
    enum: ['Choose', 'Hindu', 'Muslim', 'Sikh', 'Parsi'],
    default: "Choose"
  },
  admissions: {
    type: [admissionSchema],
    default: []
  },
  address: {
    type: String,
    // default: "Update address"
  },
  is_admin: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Add the schema to the model
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
