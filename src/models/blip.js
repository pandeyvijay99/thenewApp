const mongoose = require("mongoose");
const blipSchema = new mongoose.Schema({
    videoName: {
        type: String,
        require: true
     },
     slug: {
     type: String,
   //   unique: true,
     require: true,
     trim: true,
     min: 3,
     max: 20,
  },
  blipUrl: {
     type: String,
     require: true,
     index:true
  },
  tags: {
    type : Array ,
    "default" : []
  },
  hashtag: {
    type : Array ,
    "default" : []
  },
  
  commenting: {
    type: String,
    require: true,
    index:true
 },
 
 allowedAge: {
    type: Boolean,
    require: true,
    index:true
 },
 Isblocked: {
    type: Boolean,
    require: true,
    index:true
 },
  description: {
   type: String,
   require: false,
   trim: true
}
},
{
     timestamps: true 
});
module.exports = mongoose.model("Blip", blipSchema);