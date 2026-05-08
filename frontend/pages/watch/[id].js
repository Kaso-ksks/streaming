import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import API from "../../services/api";
import Toast from "../../components/Toast";

export default function Watch() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const showToast = (message, type = "info") => {
    setToast({
      message,
      type
    });
  };

  const isLogged =
    typeof window !== "undefined" &&
    localStorage.getItem("token");

  useEffect(() => {
    if (!id) return;

    API.get(`/movies/${id}`)
      .then((res) => {
        setMovie(res.data);

        if (res.data.episodes?.length > 0) {
          setSelectedEpisode(res.data.episodes[0]);
          setSelectedSeason(res.data.episodes[0].seasonNumber);
        }
      })
      .catch((err) => console.error(err));

    if (isLogged) {
      API.get("/favorites")
        .then((res) => {
          const found = res.data.some((fav) => fav._id === id);
          setIsFavorite(found);
        })
        .catch(() => setIsFavorite(false));
    }
  }, [id]);

  const handleFavorite = async () => {
    if (!isLogged) {
      showToast("Faça login para favoritar", "warning");

      setTimeout(() => {
        router.push("/login");
      }, 1000);

      return;
    }

    try {
      if (isFavorite) {
        await API.delete(`/favorites/${id}`);
        setIsFavorite(false);
        showToast("Removido dos favoritos", "info");
      } else {
        await API.post(`/favorites/${id}`);
        setIsFavorite(true);
        showToast("Adicionado aos favoritos", "success");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message ||
        "Erro ao favoritar",
        "error"
      );
    }
  };

  const getPlayerUrl = () => {
    if (!movie) return "";

    if (
      (movie.type === "series" || movie.type === "anime") &&
      selectedEpisode
    ) {
      if (
        selectedEpisode.playerUrl &&
        selectedEpisode.playerUrl.trim() !== ""
      ) {
        return selectedEpisode.playerUrl;
      }

      return `https://www.vidking.net/embed/tv/${movie.imdbId}/${selectedEpisode.seasonNumber}/${selectedEpisode.episodeNumber}`;
    }

    if (movie.playerUrl && movie.playerUrl.trim() !== "") {
      return movie.playerUrl;
    }

    return `https://www.vidking.net/embed/movie/${movie.imdbId}`;
  };

  if (!movie) {
    return (
      <div className="loading">
        Carregando...
      </div>
    );
  }

  const hasEpisodes =
    movie.type === "series" ||
    movie.type === "anime";

  const seasons = [
    ...new Set(
      movie.episodes
        ?.map((ep) => ep.seasonNumber)
        .filter(Boolean)
    )
  ];

  const episodesBySeason =
    movie.episodes?.filter(
      (ep) => ep.seasonNumber === selectedSeason
    ) || [];

  return (
    <div className="watch-page">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: "",
            type: "info"
          })
        }
      />

      <div className="watch-header">
        <button
          className="back-button"
          onClick={() => router.push("/")}
        >
          ← Voltar
        </button>

        <h1>{movie.title}</h1>

        <button
          className={
            isFavorite
              ? "favorite-button active"
              : "favorite-button"
          }
          onClick={handleFavorite}
        >
          {isFavorite ? "❤️ Favoritado" : "🤍 Favoritar"}
        </button>
      </div>

      <iframe
        className="video-player"
        src={getPlayerUrl()}
        allowFullScreen
      ></iframe>

      <div className="movie-info">
        <p>{movie.description}</p>

        <span className="movie-category">
          {movie.category}
        </span>
      </div>

      {hasEpisodes && movie.episodes?.length > 0 && (
        <div className="episodes-section">
          <div className="episodes-header">
            <h2>Episódios</h2>

            <select
              value={selectedSeason}
              onChange={(e) => {
                const season = Number(e.target.value);
                setSelectedSeason(season);

                const firstEpisode =
                  movie.episodes.find(
                    (ep) => ep.seasonNumber === season
                  );

                setSelectedEpisode(firstEpisode);
              }}
            >
              {seasons.map((season) => (
                <option
                  key={season}
                  value={season}
                >
                  Temporada {season}
                </option>
              ))}
            </select>
          </div>

          <div className="episodes-list">
            {episodesBySeason.map((episode) => (
              <button
                key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                className={
                  selectedEpisode?.seasonNumber === episode.seasonNumber &&
                  selectedEpisode?.episodeNumber === episode.episodeNumber
                    ? "episode-card active"
                    : "episode-card"
                }
                onClick={() => setSelectedEpisode(episode)}
              >
                <strong>
                  EP {episode.episodeNumber}
                </strong>

                <span>
                  {episode.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}