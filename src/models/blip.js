//removed slug
const mongoose = require("mongoose");
const blipSchema = new mongoose.Schema({
    videoName: {
        type: String,
        require: true
     },
     mobileNumber: {
     type: String,
     ref: "mobileNumber",
      required: true
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
},
blipReaction:[{
   reaction:{
      type:String,
      require: true
   },
   reaction_user_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "reaction_user_id",
     required: true
   },

 }],
 blipRating:[{
   ratingno:{
      type:String,
      require: true
   },
   rating_user_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "rating_user_id",
     required: true
   },

 }]
},

{
     timestamps: true 
}
);
module.exports = mongoose.model("Blip", blipSchema);