const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String
});

module.exports = mongoose.model("Movie", MovieSchema);