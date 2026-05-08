const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Movie = require("../models/Movie");

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    res.json(user.favorites || []);
  } catch (err) {
    console.log("Erro ao buscar favoritos:", err);

    res.status(500).json({
      message: "Erro ao buscar favoritos"
    });
  }
});

router.post("/:movieId", auth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Conteúdo não encontrado"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    const alreadyFavorite = user.favorites.some(
      (fav) => fav.toString() === movie._id.toString()
    );

    if (alreadyFavorite) {
      user.favorites = user.favorites.filter(
        (fav) => fav.toString() !== movie._id.toString()
      );

      await user.save();

      return res.json({
        message: "Removido dos favoritos",
        favorited: false
      });
    }

    user.favorites.push(movie._id);

    await user.save();

    res.json({
      message: "Adicionado aos favoritos",
      favorited: true
    });
  } catch (err) {
    console.log("Erro ao atualizar favorito:", err);

    res.status(500).json({
      message: "Erro ao atualizar favorito"
    });
  }
});

module.exports = router;