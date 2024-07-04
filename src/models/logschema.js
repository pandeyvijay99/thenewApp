const mongoose = require("mongoose");
// Define the log schema
const logSchema = new mongoose.Schema({
    method: String,
    url: String,
    requestHeaders: Object,
    requestBody: Object,
    responseHeaders: Object,
    responseBody: Object,
    statusCode: Number,
    duration: Number,
    timestamp: { type: Date, default: Date.now }
});

// Create the log model
const Log = mongoose.model('Log', logSchema);
