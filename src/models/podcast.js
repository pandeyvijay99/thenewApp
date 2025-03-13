//removed slug
const mongoose = require("mongoose");
const podcastSchema = new mongoose.Schema({
  podcastName: {
    type: String,
    require: true
  },
  mobileNumber: {
    type: String,
    ref: "mobileNumber",
    required: true
  },
  podcastUrl: {
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
  commentCount: { type: Number, default: 0 },
  commenting: {
    type: String,
    require: true,
    index: true
  },

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
  podcastReaction: [{
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
  podcastRating: [{
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
  podcast_user_id: {
    type: String
  },
  title: {
    type: String,
    //required: true
  },
  totalRating: {
    type: Number
  },
  thumbnailPodcastUrl: {
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
module.exports = mongoose.model("Podcast", podcastSchema);