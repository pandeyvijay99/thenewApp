const mongoose = require("mongoose");
const webnameSchema = new mongoose.Schema({
    webName: {
     type: String,
    //  unique: true,
     require: true,
     trim: true,
     min: 3,
     max: 20,
     },
    mobileNumber: {
     type: String,
    //  unique: true,
     require: true,
     trim: true
    }
},
{
     timestamps: true 
});
module.exports = mongoose.model("Webname", webnameSchema);