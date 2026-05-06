const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  isPremium: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);