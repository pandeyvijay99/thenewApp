//removed slug
const mongoose = require("mongoose");
const auditSchema = new mongoose.Schema({
    activityType: {
        type: String,
        require: true
     },
     mobileNumber: {
     type: String,
     ref: "mobileNumber",
      required: true
  },
  Url: {
     type: String,
  },
  thumbnailUrl:{
    type: String
  },  
  userId:{
    type: String
  },
  description: {
   type: String,
},
photoUrl: {
  type: Array,
  "default":[]
},
documentId:{
  type: String,
},
},
{
     timestamps: true 
}
);
module.exports = mongoose.model("Audit", auditSchema);