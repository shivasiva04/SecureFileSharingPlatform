const mongoose = require('mongoose');
const { Schema } = mongoose;

const sharedFileSchema = new Schema({
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
  originalOwner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sharedAt: { type: Date, default: Date.now }
});

const SharedFiles = mongoose.model('SharedFiles', sharedFileSchema);

module.exports = SharedFiles;