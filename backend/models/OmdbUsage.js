const mongoose = require("mongoose");

const OmdbUsageSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },

  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("OmdbUsage", OmdbUsageSchema);