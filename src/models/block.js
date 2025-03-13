const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema({
    //user id
    from: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "userId seems to be missing"]
    },
    type: {
        type: String,
        enum: ['blip', 'video', 'photo', 'user'],
        default: 'video'
    },
    //to, means user id or content
    to: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "contentID seems to be missing"]
    }
});
//contentID means video ID, blip ID or photo ID

// Create a compound index to ensure unique combination of userId, type, and contentID
//if any changes make sure to clear the indexs
BlockSchema.index({ from: 1, type: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("block", BlockSchema);