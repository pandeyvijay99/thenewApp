const mongoose = require("mongoose");

const beliveSchema = new mongoose.Schema({
    //person who is beliving
    beliver: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Id seems to be missing"]
    },
    //person whom user will be beliving
    beliving: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Id seems to be missing"]
    }
});
beliveSchema.index({ beliver: 1, beliving: 1 }, { unique: true });
module.exports = mongoose.model("belives", beliveSchema);

