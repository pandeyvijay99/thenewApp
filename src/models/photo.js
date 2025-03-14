//removed slug
const mongoose = require("mongoose");
const photoSchema = new mongoose.Schema({
  photoName: {
    type: String,
    require: true
  },
  mobileNumber: {
    type: String,
    ref: "mobileNumber",
    required: true
  },
  photoUrl: {
    type: Array,
    require: true,
    "default": []
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
  photoReaction: [{
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
  photoRating: [{
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
  photo_user_id: {
    type: String
  },
  totalRating: {
    type: Number
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
module.exports = mongoose.model("Photo", photoSchema);