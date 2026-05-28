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

function normalizeSource(source = {}) {
  return {
    name: source.name || "Servidor 1",
    url: source.url || "",
    type: source.type || "hls",
    audio: source.audio || "dub",
    quality: source.quality || "Auto",
    subtitles: source.subtitles || []
  };
}

function getAniListId(movie) {
  if (!movie?.imdbId) return "";

  if (String(movie.imdbId).startsWith("anilist:")) {
    return String(movie.imdbId).replace("anilist:", "");
  }

  return "";
}

function buildEpisodeUrl(template, movie, episode) {
  const anilistId = getAniListId(movie);

  return template
    .replaceAll("{tmdbId}", String(movie.tmdbId || ""))
    .replaceAll("{imdbId}", String(movie.imdbId || ""))
    .replaceAll("{anilistId}", String(anilistId || ""))
    .replaceAll("{season}", String(episode.seasonNumber))
    .replaceAll("{episode}", String(episode.episodeNumber));
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

async function getMovieFromTmdb({
  tmdbId,
  imdbId,
  category,
  type,
  featured,
  sources
}) {
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
    sources,
    episodes: []
  };
}

async function getSeriesFromTmdb({
  tmdbId,
  imdbId,
  category,
  type,
  featured
}) {
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

    for (const ep of seasonRes.data.episodes || []) {
      episodes.push({
        title: ep.name || `Episódio ${ep.episode_number}`,
        episodeNumber: ep.episode_number,
        seasonNumber: season.season_number,
        imdbId,
        sources: []
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
    sources: [],
    episodes
  };
}

router.post("/movies", async (req, res) => {
  try {
    const {
      imdbId,
      category,
      type = "movie",
      featured = false,
      source
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

      const sources = source?.url ? [normalizeSource(source)] : [];

      movieData = await getMovieFromTmdb({
        tmdbId: movieResult.id,
        imdbId,
        category,
        type: "movie",
        featured: !!featured,
        sources
      });
    } else {
      const tvResult = tmdbFind.tv_results?.[0];

      if (!tvResult) {
        return res.status(404).json({
          message: "Série não encontrada na TMDB"
        });
      }

      movieData = await getSeriesFromTmdb({
        tmdbId: tvResult.id,
        imdbId,
        category,
        type,
        featured: !!featured
      });
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

router.put("/movies/:movieId/sources", async (req, res) => {
  try {
    const { sources } = req.body;

    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Item não encontrado"
      });
    }

    movie.sources = Array.isArray(sources)
      ? sources.map(normalizeSource).filter((source) => source.url)
      : [];

    await movie.save();

    res.json({
      message: "Servidores do filme atualizados",
      movie
    });
  } catch (err) {
    console.log("Erro ao atualizar servidores:", err);

    res.status(500).json({
      message: "Erro ao atualizar servidores"
    });
  }
});

router.put("/movies/:movieId/episodes", async (req, res) => {
  try {
    const { seasonNumber, episodeNumber, sources } = req.body;

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

    episode.sources = Array.isArray(sources)
      ? sources.map(normalizeSource).filter((source) => source.url)
      : [];

    await movie.save();

    res.json({
      message: "Servidores do episódio atualizados",
      episode
    });
  } catch (err) {
    console.log("Erro ao atualizar episódio:", err);

    res.status(500).json({
      message: "Erro ao atualizar episódio"
    });
  }
});

router.put("/movies/:movieId/episodes/bulk", async (req, res) => {
  try {
    const {
      name = "Videasy",
      urlTemplate,
      type = "embed",
      audio = "dub",
      quality = "Auto",
      mode = "replace"
    } = req.body;

    if (!urlTemplate) {
      return res.status(400).json({
        message: "Template de URL obrigatório"
      });
    }

    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Item não encontrado"
      });
    }

    if (!movie.episodes?.length) {
      return res.status(400).json({
        message: "Esse item não possui episódios"
      });
    }

    if (movie.type === "anime" && !getAniListId(movie)) {
      return res.status(400).json({
        message:
          "Esse anime não possui AniList ID salvo. Reimporte pelo fluxo AniList."
      });
    }

    movie.episodes = movie.episodes.map((episode) => {
      const url = buildEpisodeUrl(urlTemplate, movie, episode);

      const source = normalizeSource({
        name,
        url,
        type,
        audio,
        quality
      });

      if (mode === "append") {
        episode.sources = [...(episode.sources || []), source];
      } else {
        episode.sources = [source];
      }

      return episode;
    });

    await movie.save();

    res.json({
      message: "Servidores aplicados em todos os episódios",
      movie
    });
  } catch (err) {
    console.log("Erro ao aplicar servidores em massa:", err);

    res.status(500).json({
      message: "Erro ao aplicar servidores em massa"
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