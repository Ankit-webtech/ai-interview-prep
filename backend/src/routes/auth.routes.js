const express = require('express');

const authRouter = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register',require('../controllers/auth.controller').registerUserController);



/**
 * @route POST /api/auth/login
 * @desc Login a user with email and password
 * @access Public
 */
authRouter.post('/login',require('../controllers/auth.controller').loginUserController);    
 
/**
 * @route GET /api/auth/logout
 * @desc Logout a user by blacklisting the token(clear token from user cookie and add the token in blacklist collection)
 * @access Private
 */
authRouter.get('/logout',require('../controllers/auth.controller').logoutUserController);


/**
 * @route GET /api/auth/get-me
 * @desc Get the details of the logged-in user using the token from the cookie.
 * @access Private
 */
authRouter.get('/get-me',authMiddleware.authUser, require('../controllers/auth.controller').getMeController);
 

module.exports = authRouter;