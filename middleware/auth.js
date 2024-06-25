const User = require('../models/userModel');

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next();
        } else {
            res.redirect('/loginSignup');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect('/loginSignup');
        }
        next();
    } catch (error) {
        console.error('Error in isLogout middleware:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

const isadmin = async (req, res, next) => {
    try {
        const userData = await User.findById(req.session.user_id);
        if (userData && userData.is_admin === 1) {
            next();
        } else {
            res.redirect('/loginSignup');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const isuser = async (req, res, next) => {
    try {
        const userData = await User.findById(req.session.user_id);
        if (userData && userData.is_admin === 0) {
            next();
        } else {
            res.redirect('/loginSignup');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    isLogin,
    isLogout,
    isadmin,
    isuser
};
