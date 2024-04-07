//removed slug
const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema({
    blip_id: {
        type: String,
        require: true
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
module.exports = mongoose.model("Comment", commentSchema);