const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: String,
    data: String, // Store encrypted data as a string
    iv: String, // Initialization Vector
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);


// models/SharedFiles.js


