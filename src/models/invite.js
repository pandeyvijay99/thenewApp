const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    
    joinStatus: {
        type: Boolean,
    },
    contactNumber: {
        type: String,
        required: true
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("invite", inviteSchema);

