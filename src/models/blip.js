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
  blipReaction: [{
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
  commentCount: { type: Number, default: 0 },
  blipRating: [{
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
  blip_user_id: {
    type: String
  },
  totalRating: {
    type: Number
  },
  thumbnailBlipUrl: {
    type: String,
    require: true
  },
  blipHLSPath: {
    type: String,
    require: true
  },
  isTranscodingDone: {
    type: Boolean,
    default: false
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
module.exports = mongoose.model("Blip", blipSchema);