const mongoose = require("mongoose");

const inboxSchema = new mongoose.Schema({
    to: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "userId seems to be missing"]
    },
    type: {
        type: String,
        enum: ['videoComment', 'common', 'videoRating', 'videoReaction', 'blipReaction', 'blipRating', 'blipComment', 'receivedBlessing','photoReaction', 'photoRating', 'photoComment'],
        default: 'common'
    },
    notifications: {
        type: Array,
        required: [true, "Please add valid body"]
    },
    isReaded: {
        type: Boolean,
        default: false
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("inbox", inboxSchema);

