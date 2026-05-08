const mongoose = require("mongoose");

const EpisodeSchema = new mongoose.Schema({
  title: String,
  episodeNumber: Number,
  seasonNumber: Number,
  imdbId: String
}, {
  _id: false
});

const MovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  image: String,

  banner: String,

  imdbId: {
    type: String,
    required: true
  },

  tmdbId: Number,

  category: String,

  type: {
    type: String,
    enum: ["movie", "series", "anime"],
    default: "movie"
  },

  featured: {
    type: Boolean,
    default: false
  },

  playerUrl: {
    type: String,
    default: ""
  },

  episodes: [EpisodeSchema]
}, {
  timestamps: true
});

module.exports =
  mongoose.models.Movie ||
  mongoose.model("Movie", MovieSchema);