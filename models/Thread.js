const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Reply schema inline within the Thread schema
const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

// Thread schema with embedded replies
const ThreadSchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [ReplySchema]
});

module.exports = mongoose.model('Thread', ThreadSchema);
