//removed slug
const mongoose = require("mongoose");
const videoSchema = new mongoose.Schema({
    videoName: {
        type: String,
        require: true
     },
     mobileNumber: {
     type: String,
     ref: "mobileNumber",
      required: true
  },
  videoUrl: {
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
videoReaction:[{
   reaction:{
      type:String,
      require: true
   },
   reaction_user_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "reaction_user_id",
     required: true
   },
   createdAt: { type: Date, default: Date.now },
   updatedAt: { type: Date, default: Date.now },
   reactionValue:{
      type:String
   },
   
 }],
 videoRating:[{
   ratingno:{
      type:String,
      require: true
   },
   rating_user_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "rating_user_id",
     required: true
   },
   createdAt: { type: Date, default: Date.now },
   updatedAt: { type: Date, default: Date.now }
 }],
 views: {
   type:Number,
   default:0
},
believer: {
   type : Array ,
   "default" : []
 },
 video_user_id:{
   type : String
 },
 title:{
   type:String,
   required: true
 }
},

{
     timestamps: true 
}
);
module.exports = mongoose.model("Video", videoSchema);