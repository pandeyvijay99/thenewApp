const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({
    caller: {
        type: mongoose.Schema.Types.ObjectId,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
    },
    calltype: {
        type: String,
        enum: ['video', 'audio'],
        default: 'audio'
    },
    chatId: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    isAttended: {
        type: Boolean,
        default:true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("call", callSchema);

