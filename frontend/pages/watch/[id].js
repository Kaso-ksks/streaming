import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../../services/api";
import VideoPlayer from "../../components/VideoPlayer";
import Toast from "../../components/Toast";

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!id) return;

    loadMovie();
  }, [id]);

  useEffect(() => {
    if (!movie) return;

    loadProgress();
  }, [movie, selectedEpisode]);

  const loadMovie = async () => {
    try {
      setLoading(true);

      const res = await API.get(`/movies/${id}`);
      const data = res.data;

      setMovie(data);

      if (
        (data.type === "series" || data.type === "anime") &&
        data.episodes?.length
      ) {
        setSelectedSeason(data.episodes[0].seasonNumber || 1);
        setSelectedEpisode(data.episodes[0]);
      }

      await checkFavorite(data._id);
    } catch (err) {
      console.error(err);
      setMovie(null);
    } finally {
      setLoading(false);
    }
  };

  const getProgressParams = () => {
    if (!movie || movie.type === "movie") {
      return {};
    }

    return {
      seasonNumber: selectedEpisode?.seasonNumber || null,
      episodeNumber: selectedEpisode?.episodeNumber || null
    };
  };

  const loadProgress = async () => {
    const token = localStorage.getItem("token");

    if (!token || !movie) {
      setInitialTime(0);
      return;
    }

    try {
      const params = getProgressParams();

      const res = await API.get(`/progress/${movie._id}`, {
        params
      });

      setInitialTime(Number(res.data?.currentTime || 0));
    } catch (err) {
      console.error(err);
      setInitialTime(0);
    }
  };

  const saveProgress = async ({ currentTime, duration }) => {
    const token = localStorage.getItem("token");

    if (!token || !movie) return;

    try {
      await API.put(`/progress/${movie._id}`, {
        ...getProgressParams(),
        currentTime,
        duration
      });
    } catch (err) {
      console.error(err);
    }
  };

  const checkFavorite = async (movieId) => {
    const token = localStorage.getItem("token");

    if (!token || !movieId) {
      setIsFavorited(false);
      return;
    }

    try {
      const res = await API.get("/favorites");

      const favorites = Array.isArray(res.data) ? res.data : [];

      const found = favorites.some(
        (favorite) =>
          favorite._id === movieId ||
          favorite.id === movieId
      );

      setIsFavorited(found);
    } catch (err) {
      console.error(err);
      setIsFavorited(false);
    }
  };

  const handleFavorite = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast(
        "Você precisa fazer login ou se registrar para favoritar",
        "warning"
      );
      return;
    }

    try {
      const res = await API.post(`/favorites/${movie._id}`);

      setIsFavorited(!!res.data.favorited);

      showToast(
        res.data.favorited
          ? "Adicionado aos favoritos deste perfil"
          : "Removido dos favoritos deste perfil",
        res.data.favorited ? "success" : "info"
      );
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao favoritar",
        "error"
      );
    }
  };

  const goNextEpisode = () => {
    if (!movie || movie.type === "movie" || !selectedEpisode) return;

    const sameSeasonEpisodes = movie.episodes.filter(
      (episode) =>
        episode.seasonNumber === selectedEpisode.seasonNumber
    );

    const currentIndex = sameSeasonEpisodes.findIndex(
      (episode) =>
        episode.episodeNumber === selectedEpisode.episodeNumber
    );

    const nextInSeason = sameSeasonEpisodes[currentIndex + 1];

    if (nextInSeason) {
      setSelectedEpisode(nextInSeason);
      showToast("Próximo episódio iniciado", "success");
      return;
    }

    const nextSeason = Math.min(
      ...movie.episodes
        .map((episode) => episode.seasonNumber)
        .filter(
          (season) => season > selectedEpisode.seasonNumber
        )
    );

    if (Number.isFinite(nextSeason)) {
      const firstNextSeasonEpisode = movie.episodes.find(
        (episode) => episode.seasonNumber === nextSeason
      );

      if (firstNextSeasonEpisode) {
        setSelectedSeason(nextSeason);
        setSelectedEpisode(firstNextSeasonEpisode);
        showToast("Próxima temporada iniciada", "success");
      }
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!movie) {
    return <div className="loading">Conteúdo não encontrado</div>;
  }

  const groupedEpisodes = {};

  movie.episodes?.forEach((ep) => {
    if (!groupedEpisodes[ep.seasonNumber]) {
      groupedEpisodes[ep.seasonNumber] = [];
    }

    groupedEpisodes[ep.seasonNumber].push(ep);
  });

  const currentSources =
    movie.type === "movie"
      ? movie.sources || []
      : selectedEpisode?.sources || [];

  const playerKey =
    movie.type === "movie"
      ? movie._id
      : `${movie._id}-${selectedEpisode?.seasonNumber}-${selectedEpisode?.episodeNumber}`;

  return (
    <>
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

      <div className="watch-page">
        <div className="topbar">
          <Link href="/">
            <button className="back-btn">← Voltar</button>
          </Link>
        </div>

        <div className="title-row">
          <div>
            <h1>{movie.title}</h1>

            {selectedEpisode && (
              <p>
                T{selectedEpisode.seasonNumber} EP
                {selectedEpisode.episodeNumber} —{" "}
                {selectedEpisode.title}
              </p>
            )}
          </div>

          <button
            className={
              isFavorited
                ? "favorite-title-btn active"
                : "favorite-title-btn"
            }
            onClick={handleFavorite}
          >
            {isFavorited ? "💔 Desfavoritar" : "❤️ Favoritar"}
          </button>
        </div>

        <div className="player-section">
          <VideoPlayer
            key={playerKey}
            sources={currentSources}
            initialTime={initialTime}
            onProgressUpdate={saveProgress}
            onEnded={goNextEpisode}
            title={
              selectedEpisode
                ? `${movie.title}-S${selectedEpisode.seasonNumber}E${selectedEpisode.episodeNumber}`
                : movie.title
            }
          />
        </div>

        <div className="movie-info">
          <p>{movie.description}</p>
        </div>

        {(movie.type === "series" || movie.type === "anime") && (
          <div className="episodes-section">
            <div className="season-selector">
              {Object.keys(groupedEpisodes).map((season) => (
                <button
                  key={season}
                  className={
                    Number(season) === selectedSeason ? "active" : ""
                  }
                  onClick={() => setSelectedSeason(Number(season))}
                >
                  Temporada {season}
                </button>
              ))}
            </div>

            <div className="episodes-grid">
              {groupedEpisodes[selectedSeason]?.map((episode) => (
                <button
                  key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                  className={
                    selectedEpisode?.episodeNumber ===
                      episode.episodeNumber &&
                    selectedEpisode?.seasonNumber ===
                      episode.seasonNumber
                      ? "episode active"
                      : "episode"
                  }
                  onClick={() => setSelectedEpisode(episode)}
                >
                  EP {episode.episodeNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .watch-page {
          min-height: 100vh;
          background: #141414;
          color: white;
          padding: 20px;
        }

        .topbar {
          display: flex;
          align-items: center;
          margin-bottom: 18px;
        }

        .back-btn {
          background: #e50914;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .title-row h1 {
          font-size: 2rem;
        }

        .title-row p {
          color: #bbb;
          margin-top: 6px;
        }

        .favorite-title-btn {
          background: #222;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          transition: 0.2s;
          white-space: nowrap;
        }

        .favorite-title-btn:hover,
        .favorite-title-btn.active {
          background: #e50914;
          transform: translateY(-1px);
        }

        .player-section {
          margin-bottom: 25px;
        }

        .movie-info {
          margin-bottom: 30px;
        }

        .movie-info p {
          color: #ccc;
          line-height: 1.7;
        }

        .episodes-section {
          margin-top: 30px;
        }

        .season-selector {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .season-selector button,
        .episode {
          background: #1f1f1f;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .season-selector button {
          padding: 10px 16px;
        }

        .episode {
          padding: 12px 16px;
        }

        .season-selector button.active,
        .episode.active {
          background: #e50914;
        }

        .episodes-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .loading {
          min-height: 100vh;
          background: #141414;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2rem;
        }

        @media (max-width: 768px) {
          .watch-page {
            padding: 10px;
          }

          .title-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .favorite-title-btn {
            width: 100%;
          }

          .title-row h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}