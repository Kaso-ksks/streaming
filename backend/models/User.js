const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
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

}, {
  timestamps: true
});

module.exports =
  mongoose.model("User", UserSchema);