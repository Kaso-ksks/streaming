const mongoose = require("mongoose");

const ProfileProgressSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true
    },

    seasonNumber: {
      type: Number,
      default: null
    },

    episodeNumber: {
      type: Number,
      default: null
    },

    currentTime: {
      type: Number,
      default: 0
    },

    duration: {
      type: Number,
      default: 0
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const ProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Perfil"
    },

    avatarUrl: {
      type: String,
      default: ""
    },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie"
      }
    ],

    progress: [ProfileProgressSchema]
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    avatarUrl: {
      type: String,
      default: ""
    },

    premiumBannerUrl: {
      type: String,
      default: ""
    },

    profiles: [ProfileSchema],

    activeProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    isAdmin: {
      type: Boolean,
      default: false
    },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie"
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);