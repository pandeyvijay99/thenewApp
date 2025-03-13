//removed slug
const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  noteName: {
    type: String,
    require: true
  },
  mobileNumber: {
    type: String,
    ref: "mobileNumber",
    required: true
  },
  noteUrl: {
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
  noteReaction: [{
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
  noteRating: [{
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
  note_user_id: {
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
  thumbnailNoteUrl: {
    type: Array,  // ✅ Change from String to Array
    required: true,
    default: []
  },
},

  {
    timestamps: true
  }
);
module.exports = mongoose.model("note", noteSchema);