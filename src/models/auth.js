const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
 countryCode: {
        type: String,
        require: true,
        trim: true
     },
  mobileNumber: {
     type: String,
     require: true,
     trim: true,
     min: 3,
     max: 20,
  },
  webName: {
     type: String,
     require: true,
   //   unique: true,
     trim: true,
     index:true,
     min: 3,
     max: 20,
  },
  fullName: {
     type: String,
     require: true,
     trim: true
  },
  dob: {
   type: String,
   require: true,
   trim: true
},
  description: {
   type: String,
   require: false,
   trim: true
},
  role: {
     type: String,
     enum: ["user", "admin"],
     default: "user",
  },
   profilePicture: {
     type: String,
  },
},{ timestamps: true });
module.exports = mongoose.model("User", userSchema);