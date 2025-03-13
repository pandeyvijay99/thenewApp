const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    reporter: {
        type: String,
    },
    
    contentId: {
        type: String,
        required:true,
    },
    contentType: {
        type: String,
        required: true
    },
    subContentType: {
        type: String,
        // required: true
    },
    subContentId: {
        type: String,
        // required: true
    },
    description: {
        type: String,
        // required: true
    },
    
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("report", reportSchema);

