const mongoose = require("mongoose");

const watchListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "userId seems to be missing"]
    },
    type: {
        type: String,
        enum: ['blip', 'video', 'photo', 'article', 'thought', 'note', 'music', 'podcast'],
        default: 'video'
    },
    contentID: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "contentID seems to be missing"]
    }
});
//contentID means video ID, blip ID or photo ID

// Create a compound index to ensure unique combination of userId, type, and contentID
//if any changes make sure to clear the indexs
watchListSchema.index({ userId: 1, type: 1, contentID: 1 }, { unique: true });

module.exports = mongoose.model("watchList", watchListSchema);