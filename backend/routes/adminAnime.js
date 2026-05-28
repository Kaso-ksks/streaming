const router = require("express").Router();
const axios = require("axios");
const admin = require("../middleware/admin");
const Movie = require("../models/Movie");

router.use(admin);

function stripHtml(text = "") {
  return String(text)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getTitle(media) {
  return (
    media?.title?.romaji ||
    media?.title?.english ||
    media?.title?.native ||
    "Anime sem título"
  );
}

async function fetchAnimeFromAniList({ anilistId, search }) {
  const query = `
    query ($id: Int, $search: String) {
      Media(id: $id, search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        episodes
        genres
        coverImage {
          extraLarge
          large
        }
        bannerImage
        seasonYear
        status
      }
    }
  `;

  const variables = {};

  if (anilistId) {
    variables.id = Number(anilistId);
  } else {
    variables.search = search;
  }

  const res = await axios.post(
    "https://graphql.anilist.co",
    {
      query,
      variables
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );

  return res.data?.data?.Media;
}

router.post("/", async (req, res) => {
  try {
    const { anilistId, search, category, featured = false } = req.body;

    if (!anilistId && !search) {
      return res.status(400).json({
        message: "Informe o ID do AniList ou o nome do anime"
      });
    }

    const anime = await fetchAnimeFromAniList({
      anilistId,
      search
    });

    if (!anime) {
      return res.status(404).json({
        message: "Anime não encontrado no AniList"
      });
    }

    const externalId = `anilist:${anime.id}`;

    const exists = await Movie.findOne({
      imdbId: externalId
    });

    if (exists) {
      return res.status(400).json({
        message: "Esse anime já está cadastrado"
      });
    }

    const episodeCount = anime.episodes || 1;

    const episodes = Array.from(
      {
        length: episodeCount
      },
      (_, index) => ({
        seasonNumber: 1,
        episodeNumber: index + 1,
        title: `Episódio ${index + 1}`,
        sources: []
      })
    );

    const finalCategory =
      category?.trim() ||
      anime.genres?.join(", ") ||
      "Anime";

    const created = await Movie.create({
      title: getTitle(anime),
      description:
        stripHtml(anime.description) ||
        "Descrição não disponível.",
      image: anime.coverImage?.extraLarge || anime.coverImage?.large || "",
      banner: anime.bannerImage || anime.coverImage?.extraLarge || "",
      category: finalCategory,
      type: "anime",
      featured: !!featured,
      imdbId: externalId,
      tmdbId: null,
      sources: [],
      episodes
    });

    res.status(201).json({
      message: "Anime adicionado com sucesso",
      movie: created
    });
  } catch (err) {
    console.log("Erro AniList:", err.response?.data || err.message);

    res.status(500).json({
      message:
        err.response?.data?.errors?.[0]?.message ||
        "Erro ao buscar anime no AniList"
    });
  }
});

module.exports = router;