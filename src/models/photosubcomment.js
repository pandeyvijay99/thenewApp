//removed slug
const mongoose = require("mongoose");
const photosubcommentSchema = new mongoose.Schema({
   parent_comment_id: {
        type: String,
        require: true,
        ref: "comment_id",
     },
     comment_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment_user_id",
      required: true
  },
  comment: {
     type: String,
     require: true,
     index:true
  },
  commentReaction:[{
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
    
  }]
},
{
     timestamps: true 
});
module.exports = mongoose.model("PhotoSubComment", photosubcommentSchema);