const userModel = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookies = require('cookie-parser');
const blacklistModel = require('../models/blacklist.model.js');
/**
 * @name registerUserController
 * @desc Register a new user with the provided name, email, and password.
 * @route POST /api/auth/register
 * @access Public   
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" });
        }
        
        //// Check if the email is already registered
        const isUserAlreadyExists = await userModel.findOne({ 
            $or: [{ email: email }, { username: username }]
         });
        if (isUserAlreadyExists) {
            return res.status(400).json({ message: "Username or email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });


       /**  res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        */
       res.cookie("token", token);
        res.status(201).json({ message: 'User registered successfully',
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
            }
         });


    } catch (error) {
        console.error("Error in registerUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}



//////                                          login user controller will be added here
/**
 * @name loginUserController
 * @desc Login a user with the provided email and password.
 * @route POST /api/auth/login
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        /**  res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
         */
        res.cookie("token", token);
        res.status(200).json({ message: 'User logged in successfully',
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
            }
         });

    } catch (error) {
        console.error("Error in loginUserController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}




/////////// logout user controller will be added here

/**
 * @name logoutUserController
 * @desc Logout a user by clearing the token cookie.
 * @route GET /api/auth/logout
 */

async function logoutUserController(req, res) {
   const token = req.cookies.token;

    if (!token) {
        return res.status(400).json({ message: "No token provided" });
    }

    // Add the token to the blacklist
    await blacklistModel.create({ token });

    // Clear the token cookie
    res.clearCookie('token');

    res.status(200).json({ message: "User logged out successfully" });
}



/**
 * @route GET /api/auth/get-me
 * @desc Get the details of the logged-in user using the token from the cookie.
 * @access Private
 */
async function getMeController(req, res) {
    try {
        // 1. Use the correct property name (userId) from your JWT payload
        // 2. req.user comes from your auth middleware
        const user = await userModel.findById(req.user.userId);

        // 3. Always check if the user exists before accessing properties
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Error in getMeController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}




/////////                              Export the controllers
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,

}