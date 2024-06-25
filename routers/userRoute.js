const express = require("express");
const user_route = express();

const usercontroller = require("../controllers/userController");
const session = require("express-session");

const config = require("../config/config");
 
user_route.use(session({ 
    secret: process.env.sessionSecret, 
    resave: false, 
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const auth = require("../middleware/auth");

user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function(res, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });

user_route.get('/',  usercontroller.loadLoginSignup) ;
user_route.get('/loginSignup',usercontroller.loadLoginSignup) ;
user_route.get('/login', async (req, res) => {
    res.redirect('/loginSignup');
});


user_route.post('/register',auth.isLogout, upload.single('image'), usercontroller.insertUser);
user_route.post('/login', usercontroller.verifyLogin);

user_route.get('/studentDashboard', auth.isLogin,auth.isuser, usercontroller.studentDashboard);

user_route.get('/adminDashboard', auth.isLogin,auth.isadmin, usercontroller.adminDashboard);
// user_route.get('/adminDashboard', usercontroller.adminDashboard);

user_route.post('/logout', auth.isLogin, usercontroller.userLogout);

user_route.post('/update-profile',auth.isLogin,upload.single('profileImage'),usercontroller.updateProfile);




user_route.post('/offlineAdmission',auth.isLogin,auth.isuser,upload.single('signature'),usercontroller.offlineAdmission);

user_route.post('/onlineAdmission',auth.isLogin,auth.isuser, upload.fields([
    { name: 'paymentScreenshot', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), usercontroller.onlineAdmission);
  

user_route.get('/adminDashboard/edit-user',auth.isLogin,auth.isadmin,usercontroller.editUserLoad);

user_route.get('/adminDashboard/add-student',auth.isLogin,auth.isadmin,usercontroller.addStudentLoad);
user_route.post('/adminDashboard/add-student',auth.isLogin,auth.isadmin,upload.none(),usercontroller.addStudentPost);

user_route.post('/update-shift',auth.isLogin,auth.isadmin,usercontroller.updateUserShift);


user_route.get('/forget-password', auth.isLogout, usercontroller.forgetLoad);
user_route.post('/forget-password', usercontroller.passwordSend);

user_route.delete('/delete-shift/:studentId',auth.isLogin,auth.isadmin,usercontroller.deleteShift) ;

user_route.get('/adminDashboard/download-excel',auth.isLogin,auth.isadmin,usercontroller.downloadExcel) ;
user_route.post('/change-password',auth.isLogin,usercontroller.changePassword) ;

user_route.get('/studentDashboard/payment',auth.isLogin,usercontroller.paymentLoad) ;






module.exports = user_route;
