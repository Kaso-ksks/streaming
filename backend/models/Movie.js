const mongoose = require("mongoose");

const SubtitleSchema = new mongoose.Schema(
  {
    label: String,
    lang: String,
    url: String
  },
  { _id: false }
);

const SourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    url: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["hls", "mp4"],
      default: "mp4"
    },

    audio: {
      type: String,
      enum: ["dub", "leg", "original"],
      default: "dub"
    },

    quality: {
      type: String,
      default: "HD"
    },

    subtitles: [SubtitleSchema]
  },
  { _id: false }
);

const EpisodeSchema = new mongoose.Schema(
  {
    title: String,

    episodeNumber: Number,

    seasonNumber: Number,

    imdbId: String,

    sources: [SourceSchema]
  },
  { _id: false }
);

const MovieSchema = new mongoose.Schema(
  {
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

    featured: {
      type: Boolean,
      default: false
    },

    type: {
      type: String,
      enum: ["movie", "series", "anime"],
      default: "movie"
    },

    sources: [SourceSchema],

    episodes: [EpisodeSchema]
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Movie ||
  mongoose.model("Movie", MovieSchema);