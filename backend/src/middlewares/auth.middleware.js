const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model.js");


async function authUser(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }   

    const isBlacklisted =await blacklistModel.findOne({ token: token });
    if (isBlacklisted) {
        return res.status(401).json({ message: "Unauthorized: Token is invalid" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    } 
}

module.exports = {
    authUser,
};