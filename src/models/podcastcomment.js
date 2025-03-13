//removed slug
const mongoose = require("mongoose");
const podcastCommentSchema = new mongoose.Schema({
    podcast_id: {
        type: String,
        require: true,
        ref: "blip_id",
     },
     user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_id",
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
    
  }],
  subComment:[{
    comment_user_id:mongoose.Schema.Types.ObjectId,
    comment: {
        type: String,
        require: true,
        index:true
     },
     comment_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment_user_id",
      required: true
  },

  }]
},
{
     timestamps: true 
});
module.exports = mongoose.model("PodcastComment", podcastCommentSchema);