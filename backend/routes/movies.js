const router = require("express").Router();
const Movie = require("../models/Movie");

router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });

    res.json(movies);
  } catch (err) {
    console.log("Erro ao buscar filmes:", err);

    res.status(500).json({
      message: "Erro ao buscar filmes"
    });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const movies = await Movie.find({ featured: true }).sort({
      createdAt: -1
    });

    res.json(movies);
  } catch (err) {
    console.log("Erro ao buscar destaques:", err);

    res.status(500).json({
      message: "Erro ao buscar destaques"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Filme não encontrado"
      });
    }

    res.json(movie);
  } catch (err) {
    console.log("Erro ao buscar filme:", err);

    res.status(500).json({
      message: "Erro ao buscar filme"
    });
  }
});

module.exports = router;