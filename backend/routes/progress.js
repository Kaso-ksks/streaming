const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Movie = require("../models/Movie");

function ensureProfiles(user) {
  if (!user.profiles || user.profiles.length === 0) {
    user.profiles = [
      {
        name: "Principal",
        avatarUrl: user.avatarUrl || "",
        favorites: [],
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

function sameProgress(item, movieId, seasonNumber, episodeNumber) {
  return (
    String(item.movie) === String(movieId) &&
    Number(item.seasonNumber || 0) === Number(seasonNumber || 0) &&
    Number(item.episodeNumber || 0) === Number(episodeNumber || 0)
  );
}

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "profiles.progress.movie"
    );

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    const profile = getActiveProfile(user);

    await user.save();

    const progress = (profile.progress || [])
      .filter((item) => item.movie)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(progress);
  } catch (err) {
    console.log("Erro ao buscar progresso:", err);

    res.status(500).json({
      message: "Erro ao buscar progresso"
    });
  }
});

router.get("/:movieId", auth, async (req, res) => {
  try {
    const { seasonNumber, episodeNumber } = req.query;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    const profile = getActiveProfile(user);

    const progress = profile.progress.find((item) =>
      sameProgress(
        item,
        req.params.movieId,
        seasonNumber,
        episodeNumber
      )
    );

    await user.save();

    res.json(progress || null);
  } catch (err) {
    console.log("Erro ao buscar progresso do conteúdo:", err);

    res.status(500).json({
      message: "Erro ao buscar progresso"
    });
  }
});

router.put("/:movieId", auth, async (req, res) => {
  try {
    const {
      seasonNumber = null,
      episodeNumber = null,
      currentTime = 0,
      duration = 0
    } = req.body;

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

    let progress = profile.progress.find((item) =>
      sameProgress(
        item,
        movie._id,
        seasonNumber,
        episodeNumber
      )
    );

    const safeCurrentTime = Math.max(0, Number(currentTime) || 0);
    const safeDuration = Math.max(0, Number(duration) || 0);

    if (!progress) {
      profile.progress.push({
        movie: movie._id,
        seasonNumber,
        episodeNumber,
        currentTime: safeCurrentTime,
        duration: safeDuration,
        updatedAt: new Date()
      });

      progress = profile.progress[profile.progress.length - 1];
    } else {
      progress.currentTime = safeCurrentTime;
      progress.duration = safeDuration;
      progress.updatedAt = new Date();
    }

    if (
      safeDuration > 0 &&
      safeCurrentTime >= safeDuration - 20
    ) {
      profile.progress = profile.progress.filter(
        (item) =>
          !sameProgress(
            item,
            movie._id,
            seasonNumber,
            episodeNumber
          )
      );
    }

    await user.save();

    res.json({
      message: "Progresso salvo",
      progress
    });
  } catch (err) {
    console.log("Erro ao salvar progresso:", err);

    res.status(500).json({
      message: "Erro ao salvar progresso"
    });
  }
});

router.delete("/:movieId", auth, async (req, res) => {
  try {
    const { seasonNumber, episodeNumber } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    const profile = getActiveProfile(user);

    profile.progress = profile.progress.filter(
      (item) =>
        !sameProgress(
          item,
          req.params.movieId,
          seasonNumber,
          episodeNumber
        )
    );

    await user.save();

    res.json({
      message: "Progresso removido"
    });
  } catch (err) {
    console.log("Erro ao remover progresso:", err);

    res.status(500).json({
      message: "Erro ao remover progresso"
    });
  }
});

module.exports = router;