const router = require("express").Router();
const Movie = require("../models/Movie");

router.get("/", async (req, res) => {
  res.json(await Movie.find());
});

module.exports = router;