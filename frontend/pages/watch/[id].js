import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import VideoPlayer from "../../components/VideoPlayer";
import Toast from "../../components/Toast";

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/api/movies/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMovie(data);

        if (
          (data.type === "series" || data.type === "anime") &&
          data.episodes?.length
        ) {
          setSelectedEpisode(data.episodes[0]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [id]);

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
      const res = await fetch(`http://localhost:5000/api/favorites/${movie._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Erro ao favoritar", "warning");
        return;
      }

      showToast("Adicionado aos favoritos", "success");
    } catch (err) {
      console.log(err);
      showToast("Erro ao favoritar", "error");
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!movie) {
    return <div className="loading">Filme não encontrado</div>;
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
          <h1>{movie.title}</h1>

          <button className="favorite-title-btn" onClick={handleFavorite}>
            ❤️ Favoritar
          </button>
        </div>

        <div className="player-section">
          <VideoPlayer
            sources={currentSources}
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
                  className={Number(season) === selectedSeason ? "active" : ""}
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
                    selectedEpisode?.episodeNumber === episode.episodeNumber &&
                    selectedEpisode?.seasonNumber === episode.seasonNumber
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

        .favorite-title-btn:hover {
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

        .season-selector button {
          background: #1f1f1f;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        .season-selector button.active {
          background: #e50914;
        }

        .episodes-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .episode {
          background: #1f1f1f;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        .episode.active {
          background: #e50914;
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

          .movie-info h2,
          .title-row h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}