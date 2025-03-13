const mongoose = require("mongoose");

const CallLogSchema = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "callerId seems to be missing"]
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "receiverId seems to be missing"]
    },
    callDuration: {
        type: Number,
        default: 0
    },
    receiverStatus: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0
    },
    //call status 0=missed, 1=unanswered, 2=received, 3=declined
    callerStatus: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0
    },
    //call status 0=missed, 1=unanswered, 2=received, 3=declined
    callType: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    //call type 0=audio, 1=video
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "chatId seems to be missing"]
    },
    callStartTime: {
        type: Date
    },
    callEndTime: {
        type: Date
    }
});


module.exports = mongoose.model("CallLog", CallLogSchema);