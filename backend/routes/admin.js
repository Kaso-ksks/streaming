const router = require("express").Router();
const axios = require("axios");

const Movie = require("../models/Movie");
const admin = require("../middleware/admin");

router.use(admin);

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function imageUrl(path, size = "w500") {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

async function findByImdbId(imdbId) {
  const res = await axios.get(
    `https://api.themoviedb.org/3/find/${imdbId}`,
    {
      params: {
        api_key: process.env.TMDB_API_KEY,
        external_source: "imdb_id",
        language: "pt-BR"
      }
    }
  );

  return res.data;
}

async function getMovieFromTmdb(
  tmdbId,
  imdbId,
  category,
  type,
  featured,
  playerUrl
) {
  const res = await axios.get(
    `https://api.themoviedb.org/3/movie/${tmdbId}`,
    {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: "pt-BR"
      }
    }
  );

  const data = res.data;

  return {
    title: data.title,
    description: data.overview || "Sem descrição disponível.",
    image: imageUrl(data.poster_path, "w500"),
    banner: imageUrl(data.backdrop_path, "original"),
    imdbId,
    tmdbId: data.id,
    category: category || data.genres?.map((g) => g.name).join(", "),
    type,
    featured,
    playerUrl: playerUrl || "",
    episodes: []
  };
}

async function getSeriesFromTmdb(
  tmdbId,
  imdbId,
  category,
  type,
  featured,
  playerUrl
) {
  const res = await axios.get(
    `https://api.themoviedb.org/3/tv/${tmdbId}`,
    {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: "pt-BR"
      }
    }
  );

  const data = res.data;
  const episodes = [];

  for (const season of data.seasons || []) {
    if (season.season_number === 0) continue;

    const seasonRes = await axios.get(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: "pt-BR"
        }
      }
    );

    const seasonData = seasonRes.data;

    for (const ep of seasonData.episodes || []) {
      episodes.push({
        title: ep.name || `Episódio ${ep.episode_number}`,
        episodeNumber: ep.episode_number,
        seasonNumber: season.season_number,
        imdbId,
        playerUrl: ""
      });
    }
  }

  return {
    title: data.name,
    description: data.overview || "Sem descrição disponível.",
    image: imageUrl(data.poster_path, "w500"),
    banner: imageUrl(data.backdrop_path, "original"),
    imdbId,
    tmdbId: data.id,
    category: category || data.genres?.map((g) => g.name).join(", "),
    type,
    featured,
    playerUrl: playerUrl || "",
    episodes
  };
}

router.post("/movies", async (req, res) => {
  try {
    const {
      imdbId,
      category,
      type,
      featured,
      playerUrl
    } = req.body;

    if (!imdbId) {
      return res.status(400).json({
        message: "IMDb ID obrigatório"
      });
    }

    if (!process.env.TMDB_API_KEY) {
      return res.status(500).json({
        message: "TMDB_API_KEY não configurada"
      });
    }

    const exists = await Movie.findOne({ imdbId });

    if (exists) {
      return res.status(400).json({
        message: "Item já cadastrado"
      });
    }

    const tmdbFind = await findByImdbId(imdbId);

    let movieData;

    if (type === "movie") {
      const movieResult = tmdbFind.movie_results?.[0];

      if (!movieResult) {
        return res.status(404).json({
          message: "Filme não encontrado na TMDB"
        });
      }

      movieData = await getMovieFromTmdb(
        movieResult.id,
        imdbId,
        category,
        "movie",
        !!featured,
        playerUrl
      );
    } else {
      const tvResult = tmdbFind.tv_results?.[0];

      if (!tvResult) {
        return res.status(404).json({
          message: "Série/anime não encontrado na TMDB"
        });
      }

      movieData = await getSeriesFromTmdb(
        tvResult.id,
        imdbId,
        category,
        type,
        !!featured,
        playerUrl
      );
    }

    const movie = await Movie.create(movieData);

    res.status(201).json({
      message: "Item adicionado com sucesso",
      movie
    });
  } catch (err) {
    console.log("Erro ao adicionar item:", err.response?.data || err);

    res.status(500).json({
      message: "Erro ao adicionar item"
    });
  }
});

router.put("/movies/:movieId/episodes", async (req, res) => {
  try {
    const {
      seasonNumber,
      episodeNumber,
      playerUrl
    } = req.body;

    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Item não encontrado"
      });
    }

    const episode = movie.episodes.find(
      (ep) =>
        ep.seasonNumber === Number(seasonNumber) &&
        ep.episodeNumber === Number(episodeNumber)
    );

    if (!episode) {
      return res.status(404).json({
        message: "Episódio não encontrado"
      });
    }

    episode.playerUrl = playerUrl || "";

    await movie.save();

    res.json({
      message: "Player do episódio atualizado",
      episode
    });
  } catch (err) {
    console.log("Erro ao atualizar episódio:", err);

    res.status(500).json({
      message: "Erro ao atualizar episódio"
    });
  }
});

router.delete("/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Item não encontrado"
      });
    }

    res.json({
      message: "Item deletado"
    });
  } catch (err) {
    console.log("Erro ao deletar item:", err);

    res.status(500).json({
      message: "Erro ao deletar item"
    });
  }
});

module.exports = router;