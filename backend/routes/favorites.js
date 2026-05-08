const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Movie = require("../models/Movie");

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    res.json(user.favorites);
  } catch (err) {
    console.log("Erro ao buscar favoritos:", err);

    res.status(500).json({
      message: "Erro ao buscar favoritos"
    });
  }
});

router.post("/:movieId", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Filme não encontrado"
      });
    }

    const user = await User.findById(req.user.id);

    if (user.favorites.includes(req.params.movieId)) {
      return res.status(400).json({
        message: "Filme já está nos favoritos"
      });
    }

    user.favorites.push(req.params.movieId);

    await user.save();

    res.json({
      message: "Filme adicionado aos favoritos"
    });
  } catch (err) {
    console.log("Erro ao favoritar:", err);

    res.status(500).json({
      message: "Erro ao favoritar filme"
    });
  }
});

router.delete("/:movieId", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.favorites = user.favorites.filter(
      (id) => id.toString() !== req.params.movieId
    );

    await user.save();

    res.json({
      message: "Filme removido dos favoritos"
    });
  } catch (err) {
    console.log("Erro ao remover favorito:", err);

    res.status(500).json({
      message: "Erro ao remover favorito"
    });
  }
});

module.exports = router;