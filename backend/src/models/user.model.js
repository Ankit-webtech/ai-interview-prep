const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique:[true, "Name must be unique"],
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Email must be unique"],   
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const UserModel = mongoose.model("Users", userSchema);
module.exports = UserModel;