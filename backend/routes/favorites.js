const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Movie = require("../models/Movie");

const FREE_FAVORITE_LIMIT = 50;

function ensureProfiles(user) {
  if (!user.profiles || user.profiles.length === 0) {
    user.profiles = [
      {
        name: "Principal",
        avatarUrl: user.avatarUrl || "",
        favorites: user.favorites || [],
        progress: []
      }
    ];
  }

  if (!user.activeProfileId) {
    user.activeProfileId = user.profiles[0]._id;
  }

  return user;
}

function getActiveProfile(user) {
  ensureProfiles(user);

  return (
    user.profiles.find(
      (profile) =>
        String(profile._id) === String(user.activeProfileId)
    ) || user.profiles[0]
  );
}

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "profiles.favorites"
    );

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    const profile = getActiveProfile(user);

    await user.save();

    res.json(profile.favorites || []);
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

    const profile = getActiveProfile(user);

    const alreadyFavorite = profile.favorites.some(
      (fav) => String(fav) === String(movie._id)
    );

    if (alreadyFavorite) {
      profile.favorites = profile.favorites.filter(
        (fav) => String(fav) !== String(movie._id)
      );

      await user.save();

      return res.json({
        message: "Removido dos favoritos",
        favorited: false,
        favoritesCount: profile.favorites.length,
        favoriteLimit: user.isPremium ? null : FREE_FAVORITE_LIMIT
      });
    }

    if (
      !user.isPremium &&
      profile.favorites.length >= FREE_FAVORITE_LIMIT
    ) {
      return res.status(403).json({
        message:
          "Limite grátis de 50 favoritos atingido. Premium tem favoritos ilimitados.",
        favoriteLimit: FREE_FAVORITE_LIMIT
      });
    }

    profile.favorites.push(movie._id);

    await user.save();

    res.json({
      message: "Adicionado aos favoritos",
      favorited: true,
      favoritesCount: profile.favorites.length,
      favoriteLimit: user.isPremium ? null : FREE_FAVORITE_LIMIT
    });
  } catch (err) {
    console.log("Erro ao atualizar favorito:", err);

    res.status(500).json({
      message: "Erro ao atualizar favorito"
    });
  }
});

module.exports = router;