const User = require("../models/userModel");
require('dotenv').config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const config = require("../config/config");

const excelJs=require("exceljs") ;

const xlsx = require('xlsx');


// Function to hash the password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// function to sendEmail to users
const sendEmail = async (name, email, topic, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.emailUser,
        pass: process.env.password,
      },
    });
    const mailOptions = {
      from: process.env.emailUser,
      to: email,
      subject:topic,
      html: `<p>${text}.</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent :- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Function to render registration page
// Done
const loadRegister = async (req, res) => {
  try {
    res.render("loginSignup");
  } catch (error) {
    console.log(error.message);
  }
};

// Function to insert a new user
//Done
const insertUser = async (req, res) => {
  try {
    const { name, email, mno, password } = req.body;
    const image = req.file.filename;

    // Check if email or mobile number already exists
    const existingUser = await User.findOne({
      $or: [{ email: email }, { mobile: mno }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.render("loginSignup", {
          message: "This email already has an account",
        });
      } else if (existingUser.mobile === mno) {
        return res.render("loginSignup", {
          message: "This mobile number already has an account",
        });
      }
    }

   const sPassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      mobile: req.body.mno,
      image: req.file.filename,
      password: sPassword,
    });

    const userData = await user.save();

    if (userData) {
      res.render("loginSignup", { message: "Registration successful" });
    } else {
      res.render("loginSignup", { message: "Registration failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Done
const loadLoginSignup = async (req, res) => {
  try {
    res.render("loginSignup");
  } catch (error) {
    console.log(error.message);
  }
};



// Function to verify user login
// Done
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
       const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        req.session.user_id = userData._id;
        if (userData.is_admin === 1) {
          res.redirect("/adminDashboard");
        } else {
          res.redirect("/studentDashboard");
        }
      } else {
        res.render("loginSignup", { message: "Wrong password" });
      }
    } else {
      res.render("loginSignup", { message: "Email does not exist" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Function to render Student Dashboard
// Not Done
const studentDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("studentDashboard", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// Function to render admin Dashboard
// Done
const adminDashboard = async (req, res) => {
  try {
      const userData = await User.findById(req.session.user_id);

      const page = parseInt(req.query.page) || 1;
      const limit = 40;

      const { year, month, shift } = req.query;

      // Initial match condition
      let matchConditions = {};

      if (year) {
          matchConditions['admissions.year'] = parseInt(year);
      }

      if (month) {
          matchConditions['admissions.months.month'] = month;
      }

      if (shift) {
          matchConditions['admissions.months.shifts.shift'] = parseInt(shift);
      }

      // Aggregation pipeline to filter the data
      const pipeline = [];

      // Apply the match stage if there are conditions
      if (Object.keys(matchConditions).length > 0) {
          pipeline.push({ $match: matchConditions });
      }

      pipeline.push(
          { $unwind: '$admissions' },
          { $unwind: '$admissions.months' },
          { $unwind: '$admissions.months.shifts' },
          { $sort: { 'admissions.months.shifts.seatNo': 1 } }
      );

      if (Object.keys(matchConditions).length > 0) {
          pipeline.push({ $match: matchConditions });
      }

      pipeline.push(
          {
              $group: {
                  _id: '$_id',
                  name: { $first: '$name' },
                  email: { $first: '$email' },
                  mobile: { $first: '$mobile' },
                  image: { $first: '$image' },
                  admissions: {
                      $push: {
                          year: '$admissions.year',
                          month: '$admissions.months.month',
                          shift: '$admissions.months.shifts.shift',
                          seatNo: '$admissions.months.shifts.seatNo',
                          paymentStatus: '$admissions.months.shifts.paymentStatus'
                      }
                  }
              }
          },
          {
              $skip: (page - 1) * limit
          },
          {
              $limit: limit
          }
      );

      // Counting the total number of admissions records after applying filters
      const countPipeline = [
          ...pipeline,
          {
              $group: {
                  _id: null,
                  totalCount: { $sum: { $size: '$admissions' } }
              }
          }
      ];

      const [users, countResult] = await Promise.all([
          User.aggregate(pipeline),
          User.aggregate(countPipeline)
      ]);

      const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;
      // console.log(totalCount) ;
      // console.log(limit) ;
      // console.log(Math.ceil(totalCount / limit)) ;
      res.render('adminDashboard', {
          user: userData,
          users: users,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          filters: { year, month, shift }
      });
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
  }
};


// Done
const userLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to destroy session' });
      }

      // Check if the request is an AJAX request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(200).json({ message: 'Logout successful' });
      } else {
        res.redirect("/loginSignup");
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// forget password code start

const forgetLoad = async (req, res) => {
  try {
    res.render("forget-password");
  } catch (error) {
    console.log(error.message);
  }
};


function generateRandomNumericPassword(length) {
  let password = '';
  const digits = '0123456789';

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      password += digits[randomIndex];
  }

  return password;
} ;


// send password to student on mail

const passwordSend = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    const randomPassword = generateRandomNumericPassword(6);
    
   
    if (userData) {
      // Hash the random password
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Update user's password in the database
      userData.password = hashedPassword;
      await userData.save();

      // Send email with the new password
      
      const text = `Your ID is: ${email} and Password: ${randomPassword}`;
      const topic="New Password"
      sendEmail(userData.name,userData.email,topic,text);

      // Render success message
      res.render("loginSignup", { message: "Password has been sent to your mail" });
    } else {
      // Render error message for incorrect email
      res.render("forget-password", { message: "User email is incorrect" });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

// user profile edit & update

const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      console.log(userData.name);
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Done
const updateProfile = async (req, res) => {
  try {
      const {
          userId, isAdmin, name, fatherName, guardianName, gender, mobile, email,
          aadhar, guardianMobile, whatsapp, aim, qualification, dob, religion,
           address
      } = req.body;

      const profileImage = req.file ? req.file.filename : null;

      const updatedData = {
          name,
          fatherName,
          guardianName,
          gender,
          mobile,
          email,
          aadhar,
          guardianMobile,
          whatsapp,
          aim,
          qualification,
          dob: new Date(dob),
          religion,
          address
      };

      await User.findByIdAndUpdate(userId, updatedData);

      if (profileImage) {
          const student = await User.findById(userId);
          student.image = profileImage;
          await student.save(); // Ensure the image is saved
      }

      if (isAdmin == 1) {
          res.redirect('/adminDashboard');
      } else {
          res.redirect('/studentDashboard');
      }
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Server Error');
  }
};


// take admission 
// Done
const offlineAdmission = async (req, res) => {
  try {
    const {
      name, fatherName, guardianName, gender, mobile, email, aadhar, guardianMobile, whatsapp, aim,
      qualification, dob, year, month, shifts, address, userId
    } = req.body;

    const signature = req.file ? req.file.filename : null;

    // Convert numeric month to string month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ];
    
    const monthName = monthNames[parseInt(month)];
    // console.log("Anand"+" "+monthName) ;
    

    // Process shifts
    let parsedShifts = [];
    for (let i = 1; i < shifts.length; i += 2) {
      parsedShifts.push({
        shift: Number(shifts[i]),
        seatNo: 0, // Set seatNo to 0 initially
        paymentStatus: "Pending"
      });
    }

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user already has an admission for the given year
    const existingAdmission = user.admissions.find(admission => admission.year === Number(year));

    if (existingAdmission) {
      // Check if the month already exists in the admission
      const existingMonth = existingAdmission.months.find(m => m.month === monthName);

      if (existingMonth) {
        // Filter out new shifts that are already existing
        const newShifts = parsedShifts.filter(newShift => !existingMonth.shifts.some(existingShift => existingShift.shift === newShift.shift));

        // Append only new shifts to the existing month
        if (newShifts.length > 0) {
          existingMonth.shifts.push(...newShifts);
          // Append a single new payment screenshot
          existingMonth.paymentScreenshots.push('offline.jpg');
        }
      } else {
        // Add new month with shifts
        existingAdmission.months.push({
          month: monthName,
          shifts: parsedShifts,
          paymentScreenshots: ['offline.jpg'] // One screenshot for the set of shifts
        });
      }
    } else {
      // Add new admission with year and month
      user.admissions.push({
        year: Number(year),
        months: [{
          month: monthName,
          shifts: parsedShifts,
          paymentScreenshots: ['offline.jpg'] // One screenshot for the set of shifts
        }]
      });
    }

    // Update user information
    user.name = name;
    user.fatherName = fatherName;
    user.guardianName = guardianName;
    user.gender = gender;
    user.mobile = mobile;
    user.email = email;
    user.aadhar = aadhar;
    user.guardianMobile = guardianMobile;
    user.whatsapp = whatsapp;
    user.aim = aim;
    user.qualification = qualification;
    user.dob = new Date(dob);
    user.address = address;

    // Save the signature
    if (signature) {
      user.sign = signature;
    }

    // Save the updated user
    const updatedUser = await user.save();

    console.log(`User data updated for year: ${year}, month: ${monthName}`);
    res.status(200).json('User information updated successfully');

  } catch (error) {
    console.error(error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};













const onlineAdmission = async (req, res) => {
  try {
    const { userId, paymentMethod, year, month, shifts } = req.body;

    const paymentScreenshot = req.files['paymentScreenshot'] ? req.files['paymentScreenshot'][0] : null;
    const signature = req.files['signature'] ? req.files['signature'][0] : null;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month)];

    // Fetch the student by userId
    const student = await User.findById(userId);

    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create the admission for the specified year
    let admission = student.admissions.find(admission => admission.year === parseInt(year));

    if (!admission) {
      admission = {
        year: parseInt(year),
        months: []
      };
      student.admissions.push(admission);
    }

    // Find the specified month within the admission
    let monthObj = admission.months.find(m => m.month === monthName);

    if (!monthObj) {
      // Create the month object if it doesn't exist
      monthObj = {
        month: monthName,
        shifts: [],
        paymentScreenshots: []
      };
      admission.months.push(monthObj);
    }

    // Process the shifts data
    let newShifts = [];
    for (let i = 1; i < shifts.length; i += 2) {
      newShifts.push({
        shift: Number(shifts[i]),
        seatNo: null, // Set seatNo to null initially
        paymentStatus: "Pending"
      });
    }

    // Ensure shifts are unique and append new shifts
    newShifts.forEach(newShift => {
      const existingShift = monthObj.shifts.find(s => s.shift === newShift.shift);
      if (existingShift) {
        // Update existing shift information without resetting seatNo and paymentStatus if they already exist
        if (existingShift.seatNo === undefined || existingShift.seatNo === null) {
          existingShift.seatNo = newShift.seatNo;
        }
        if (existingShift.paymentStatus === undefined || existingShift.paymentStatus === null) {
          existingShift.paymentStatus = newShift.paymentStatus;
        }
      } else {
        // Add new shift
        monthObj.shifts.push(newShift);
      }
    });

    // Always append the new payment screenshot URL
    if (paymentScreenshot) {
      monthObj.paymentScreenshots.push(paymentScreenshot.filename);
    }

    // Save the signature if provided
    if (signature) {
      student.sign = signature.filename;
    }

    // Save the student with the updated admission information
    await student.save();

    res.status(200).json({ message: 'Online payment processed successfully and data saved.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing the online payment.' });
  }
};
















// addStudent

const addStudentLoad=async(req,res)=>{
    try {
      res.render('addStudent') ;
    } catch (error) {
      console.log(error.message) ;
    }
}

// module.exports = { takeAdmission };


// edit-user
const editUserLoad=async(req,res)=>{
 try {
  const id=req.query.id ;
  const userData= await User.findById({_id:id}) ;
   res.render("edit-user",{user:userData}) ;
 } catch (error) {
  console.log(error.message) ;
 }
}



const updateUserShift = async (req, res) => {
  try {
    const {
      _id,
      name,
      fatherName,
      guardianName,
      gender,
      mobile,
      email,
      aadhar,
      guardianMobile,
      whatsapp,
      aim,
      qualification,
      dob,
      address,
      isAdmin,
      adminComment,
      shiftRequests = []
    } = req.body;

    // Ensure shiftRequests array is defined and properly structured
    const updatedShiftRequests = shiftRequests.map(admission => ({
      ...admission,
      months: (admission.months || []).map(month => ({
        ...month,
        paymentScreenshots: (month.paymentScreenshots || []).length > 0 ? month.paymentScreenshots : ["offline.jpg"]
      }))
    }));

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        name,
        fatherName,
        guardianName,
        gender,
        mobile,
        email,
        aadhar,
        guardianMobile,
        whatsapp,
        aim,
        qualification,
        dob,
        address,
        is_admin: isAdmin,
        admissions: updatedShiftRequests
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    // Send admin comment via email if provided
    if (adminComment) {
      const topic="अति आवश्यक सूचना" ;
      sendEmail(name,email,topic,adminComment);
    }

    res.redirect('/adminDashboard'); // Redirect to dashboard after successful update
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Server Error');
  }
};




// Adding student by Admin
const addStudentPost = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      guardianName,
      gender,
      mobile,
      email,
      aadhar,
      guardianMobile,
      whatsapp,
      aim,
      qualification,
      dob,
      year,
      month,
      shifts
    } = req.body;

    // Ensure all required fields are present
    if (!name || !mobile || !email || !dob || !year || !month || !shifts) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      } else {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }

    // Parse shifts
    const parsedShifts = Array.isArray(shifts) ? shifts.map(shift => ({
      shift: Number(shift),
      seatNo: 0,
      paymentStatus: 'Pending',
    })) : [{
      shift: Number(shifts),
      seatNo: 0,
      paymentStatus: 'Pending',
    }];

    // Convert numeric month to string month name
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month)];

    // Prepare admissions
    const admissions = [{
      year: Number(year),
      months: [{
        month: monthName,
        shifts: parsedShifts,
        paymentScreenshots: ['offline.jpg'] // Default payment screenshot for the month
      }]
    }];

    // Create new student
    let sPassword =generateRandomNumericPassword(process.env.length) ;
    const img="user-icon.png"
    sPassword=await securePassword(sPassword) ;
    const newUser = new User({
      name,
      fatherName: fatherName || "Update fatherName",
      guardianName: guardianName || "Update guardianName",
      gender: gender || 'Choose',
      mobile,
      email: email.toLowerCase(),
      aadhar: aadhar || "update your aadhar no",
      guardianMobile: guardianMobile || "Update guardianMobile",
      whatsapp: whatsapp || "Update whatsapp",
      aim: aim || "Update aim",
      qualification: qualification || "Update qualification",
      dob: new Date(dob),
      password:sPassword,
      image:img,
      admissions
    });

    await newUser.save();

    // Send email with login information
    const password = generateRandomNumericPassword(process.env.length);
    await securePassword(password); // Assuming this is a function to securely hash passwords
    const text = `Your ID is: ${email} and Password: ${password}`;
    const topic="Your  Account Details" ;
    sendEmail(name, email,topic, text);

    res.status(200).json({ message: 'User added successfully', student: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Delete student shift 
const deleteShift = async (req, res) => {
  const studentId = req.params.studentId;
  const { year, month, shift } = req.body; // Assuming you're sending year, month, and shift data in the request body

  try {
      // Find the student by ID
      const student = await User.findById(studentId);
      if (!student) {
          return res.status(404).json({ error: 'Student not found' });
      }

      // Find the admission record matching the year
      const admission = student.admissions.find(adm => adm.year === parseInt(year));
      if (!admission) {
          return res.status(404).json({ error: 'Admission record not found for the given year' });
      }

      // Ensure admission.months is an array and not null/undefined
      if (!Array.isArray(admission.months)) {
          return res.status(404).json({ error: 'No months found for the admission record' });
      }

      // Find the month within the admission record
      const targetMonth = admission.months.find(mth => mth.month === month);
      if (!targetMonth) {
          return res.status(404).json({ error: 'Month record not found for the given month' });
      }

      // Ensure targetMonth.shifts is an array and not null/undefined
      if (!Array.isArray(targetMonth.shifts)) {
          return res.status(404).json({ error: 'No shifts found for the month record' });
      }

      // Find the specific shift within the month
      const shiftIndex = targetMonth.shifts.findIndex(sh => sh.shift === parseInt(shift));
      if (shiftIndex === -1) {
          return res.status(404).json({ error: 'Shift record not found for the given shift' });
      }

      // Delete the shift from the shifts array
      targetMonth.shifts.splice(shiftIndex, 1);
      if (targetMonth.shifts.length === 0) {
        // Remove all payment screenshots if there are no shifts left
        targetMonth.paymentScreenshots = [];
      }
    

      // Save the updated student document
      await student.save();

      res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error) {
      console.error('Error deleting shift:', error.message);
      res.status(500).json({ error: 'Server error' });
  }
} ;

// download excel data
const downloadExcel = async (req, res) => {
  try {
      const students = await User.find().lean();

      const data = students.map(student => {
          return student.admissions.flatMap(admission => {
              return admission.months.flatMap(month => {
                  return month.shifts.map(shift => ({
                      Name: student.name,
                      Email: student.email,
                      Gender: student.gender,
                      DateOfBirth: student.dob ? new Date(student.dob).toLocaleDateString() : '',
                      Mobile: student.mobile,
                      Whatsapp: student.whatsapp,
                      Aadhar: student.aadhar,
                      Religion: student.religion,
                      Qualification: student.qualification,
                      FathersName: student.fatherName,
                      GuardianName: student.guardianName,
                      Guardian_Mobile: student.guardianMobile,
                      Address: student.address,
                      Year: admission.year,
                      Month: month.month,
                      Shift: shift.shift,
                      SeatNo: shift.seatNo,
                      PaymentStatus: shift.paymentStatus,
                      Admission_Date: student.createdAt ? new Date(student.createdAt).toLocaleDateString() : ''
                  }));
              });
          });
      }).flat();

      const ws = xlsx.utils.json_to_sheet(data);

      // Set the width of the columns
      const columnWidths = [
          { wch: 20 }, // Name
          { wch: 30 }, // Email
          { wch: 10 }, // Gender
          { wch: 15 }, // DateOfBirth
          { wch: 15 }, // Mobile
          { wch: 15 }, // Whatsapp
          { wch: 15 }, // Aadhar
          { wch: 15 }, // Religion
          { wch: 20 }, // Qualification
          { wch: 20 }, // FathersName
          { wch: 20 }, // GuardianName
          { wch: 20 }, // Guardian_Mobile
          { wch: 30 }, // Address
          { wch: 10 }, // Year
          { wch: 10 }, // Month
          { wch: 10 }, // Shift
          { wch: 10 }, // SeatNo
          { wch: 20 }, // PaymentStatus
          { wch: 20 }, // Admission_Date
      ];

      ws['!cols'] = columnWidths;

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Students');

      const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
  } catch (error) {
      console.error('Error generating Excel file:', error.message);
      res.status(500).json({ error: 'Server error' });
  }
};


// change password 
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.query.id;

  try {
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Check if current password matches
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch) {
          return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Check if new password matches confirmation
      if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: 'New password and confirmation do not match' });
      }

      // Update user's password (make sure securePassword hashes the password)
      user.password = await securePassword(newPassword);
      await user.save();

      // Send success message
      return res.status(200).json({ success: 'Password changed successfully' });
  } catch (error) {
      console.error('Error in changing password:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// payment Load
const paymentLoad=async(req,res)=>{
  try {
     const userData=await User.findById(req.query.id) ;
     res.render("payment",{user:userData}) ;
  } catch (error) {
    console.log(error.message) ;
  }
}

// online payment Load
const onlinePaymentLoad=async(req,res)=>{
  try {
    res.render("onlinePayment") ;
  } catch (error) {
    console.log(error.message) ;
  }
} ;



module.exports = {
  loadLoginSignup,
   insertUser,
   verifyLogin,
   studentDashboard,
    adminDashboard,
    updateProfile,
    userLogout,
    offlineAdmission,
    onlineAdmission,
    editUserLoad,
    updateUserShift,
    addStudentLoad,
    addStudentPost,
    deleteShift,
    downloadExcel,
  // loadRegister,
  // verifyMail,
  // loginLoad,
  forgetLoad,
  passwordSend,
  changePassword,
  paymentLoad,
  onlinePaymentLoad
  // editLoad,
};
