const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gridSize: { type: Number, required: true },
    gridShape: { type: String, required: true },
    pattern: { type: [Number], required: true },  // Ensure it's an array of numbers
    hashedPassword: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, // ✅ Email verification status
    verificationToken: { type: String } // Add this
});

module.exports = mongoose.model("User", userSchema);
