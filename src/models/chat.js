const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const chatSchema = new mongoose.Schema({
 messageSender: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "sender_user_id"
     },
  messageReceiver: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "receiver_user_id"
  },
  message: [{
    message:{
     type: String,
     require: true
  },
  messageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sender_user_id"
  },
  messageType: {
    type: String
  },
  readStatus: {
    type: Boolean
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}],
  
},{ timestamps: true });
module.exports = mongoose.model("Chat", chatSchema);