//removed slug
const mongoose = require("mongoose");
const musicSchema = new mongoose.Schema({
  musicName: {
    type: String,
    require: true
  },
  mobileNumber: {
    type: String,
    ref: "mobileNumber",
    required: true
  },
  musicUrl: {
    type: String,
    require: true,
    index: true
  },
  tags: {
    type: Array,
    "default": []
  },
  hashtag: {
    type: Array,
    "default": []
  },

  commenting: {
    type: String,
    require: true,
    index: true
  },
  commentCount: { type: Number, default: 0 },
  allowedAge: {
    type: Boolean,
    require: true,
    index: true
  },
  Isblocked: {
    type: Boolean,
    require: true,
    index: true
  },
  description: {
    type: String,
    require: false,
    trim: true
  },
  musicReaction: [{
    reaction: {
      type: String,
      require: true
    },
    reaction_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reaction_user_id",
      required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    reactionValue: {
      type: String
    },

  }],
  musicRating: [{
    ratingno: {
      type: Number,
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
    type: Number,
    default: 0
  },
  believer: {
    type: Array,
    "default": []
  },
  music_user_id: {
    type: String
  },
  title: {
    type: String,
    //required: true
  },
  totalRating: {
    type: Number
  },
  thumbnailMusicUrl: {
    type: String,
    require: true,
    // index:true
  },
  // Fields for soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },
},

  {
    timestamps: true
  }
);
module.exports = mongoose.model("Music", musicSchema);