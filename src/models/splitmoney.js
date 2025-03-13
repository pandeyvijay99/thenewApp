const mongoose = require("mongoose");

const SMMobileDataSchema = new mongoose.Schema({
    docId: {
        type: String,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    countryCode: {
        type: String,
    }
});

module.exports = mongoose.model("SPUser", SMMobileDataSchema);
