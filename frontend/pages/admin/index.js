import { useEffect, useState } from "react";
import API from "../../services/api";
import Toast from "../../components/Toast";
import BackButton from "../../components/BackButton";

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [episodePlayerUrl, setEpisodePlayerUrl] = useState("");

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const [imdbId, setImdbId] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("movie");
  const [featured, setFeatured] = useState(false);
  const [playerUrl, setPlayerUrl] = useState("");

  const showToast = (message, type = "info") => {
    setToast({
      message,
      type
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("Faça login primeiro", "warning");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);

      return;
    }

    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const res = await API.get("/movies");
      setMovies(res.data);

      if (selectedMovie) {
        const updated = res.data.find(
          (movie) => movie._id === selectedMovie._id
        );

        setSelectedMovie(updated || null);
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar itens", "error");
    }
  };

  const filteredMovies = movies.filter((movie) => {
    const search = adminSearch.toLowerCase();

    return (
      movie.title?.toLowerCase().includes(search) ||
      movie.category?.toLowerCase().includes(search) ||
      movie.type?.toLowerCase().includes(search) ||
      movie.imdbId?.toLowerCase().includes(search)
    );
  });

  const filteredEpisodes =
    selectedMovie?.episodes?.filter((episode) => {
      const search = episodeSearch.toLowerCase();

      return (
        episode.title?.toLowerCase().includes(search) ||
        String(episode.seasonNumber).includes(search) ||
        String(episode.episodeNumber).includes(search)
      );
    }) || [];

  const handleSubmit = async () => {
    try {
      await API.post("/admin/movies", {
        imdbId,
        category,
        type,
        featured,
        playerUrl
      });

      showToast("Item adicionado", "success");

      setImdbId("");
      setCategory("");
      setType("movie");
      setFeatured(false);
      setPlayerUrl("");

      loadMovies();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
        "Erro ao adicionar item",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Deseja realmente deletar?");

    if (!confirmed) return;

    try {
      await API.delete(`/admin/movies/${id}`);

      showToast("Item deletado", "success");

      if (selectedMovie?._id === id) {
        setSelectedMovie(null);
      }

      loadMovies();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
        "Erro ao deletar",
        "error"
      );
    }
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setEpisodeSearch("");
    setEpisodePlayerUrl("");
  };

  const handleSaveEpisodePlayer = async (episode) => {
    try {
      await API.put(`/admin/movies/${selectedMovie._id}/episodes`, {
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        playerUrl: episodePlayerUrl
      });

      showToast("Player do episódio salvo", "success");

      setEpisodePlayerUrl("");

      loadMovies();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
        "Erro ao salvar player do episódio",
        "error"
      );
    }
  };

  return (
    <div className="admin-page">
      <BackButton />

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

      <div className="admin-layout">
        <div className="admin-box">
          <h1>Painel Admin</h1>

          <input
            placeholder="IMDb ID (tt1234567)"
            value={imdbId}
            onChange={(e) => setImdbId(e.target.value)}
          />

          <input
            placeholder="Categoria opcional"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            placeholder="Player customizado opcional para filme"
            value={playerUrl}
            onChange={(e) => setPlayerUrl(e.target.value)}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="movie">Filme</option>
            <option value="series">Série</option>
            <option value="anime">Anime</option>
          </select>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />

            <span>Marcar como destaque</span>
          </label>

          <button onClick={handleSubmit}>
            Adicionar via TMDB
          </button>
        </div>

        <div className="admin-list">
          <h2>Conteúdo cadastrado</h2>

          <input
            className="admin-search"
            placeholder="Pesquisar..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />

          {filteredMovies.length === 0 && (
            <p>Nenhum item encontrado</p>
          )}

          {filteredMovies.map((movie) => (
            <div
              className="admin-movie-item"
              key={movie._id}
            >
              <img
                src={
                  movie.image ||
                  "https://via.placeholder.com/120x180"
                }
                alt={movie.title}
              />

              <div className="admin-movie-info">
                <strong>{movie.title}</strong>

                <span>
                  {movie.category || "Sem categoria"}
                </span>

                <small>
                  {movie.type === "anime"
                    ? "Anime"
                    : movie.type === "series"
                    ? "Série"
                    : "Filme"}

                  {" • "}

                  {movie.featured
                    ? "Destaque"
                    : "Normal"}

                  {" • "}

                  {movie.imdbId}
                </small>
              </div>

              {(movie.type === "series" || movie.type === "anime") && (
                <button
                  className="delete-button"
                  onClick={() => handleSelectMovie(movie)}
                >
                  Episódios
                </button>
              )}

              <button
                className="delete-button"
                onClick={() => handleDelete(movie._id)}
              >
                Deletar
              </button>
            </div>
          ))}

          {selectedMovie && (
            <div className="admin-list" style={{ marginTop: 25 }}>
              <h2>
                Episódios: {selectedMovie.title}
              </h2>

              <input
                className="admin-search"
                placeholder="Pesquisar episódio..."
                value={episodeSearch}
                onChange={(e) => setEpisodeSearch(e.target.value)}
              />

              {filteredEpisodes.length === 0 && (
                <p>Nenhum episódio encontrado</p>
              )}

              {filteredEpisodes.map((episode) => (
                <div
                  className="admin-movie-item"
                  key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                >
                  <div className="admin-movie-info">
                    <strong>
                      T{episode.seasonNumber} EP{episode.episodeNumber}
                    </strong>

                    <span>
                      {episode.title}
                    </span>

                    <small>
                      {episode.playerUrl
                        ? "Player manual cadastrado"
                        : "Usando player padrão"}
                    </small>
                  </div>

                  <input
                    className="admin-search"
                    placeholder="Player deste episódio"
                    defaultValue={episode.playerUrl || ""}
                    onChange={(e) => setEpisodePlayerUrl(e.target.value)}
                  />

                  <button
                    className="delete-button"
                    onClick={() => handleSaveEpisodePlayer(episode)}
                  >
                    Salvar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}