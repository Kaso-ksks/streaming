const router = require("express").Router();
const admin = require("../middleware/admin");
const Movie = require("../models/Movie");

router.use(admin);

router.post("/movies", async (req, res) => {
  res.json(await Movie.create(req.body));
});

module.exports = router;