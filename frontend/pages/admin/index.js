import { useEffect, useState } from "react";
import API from "../../services/api";
import Toast from "../../components/Toast";
import BackButton from "../../components/BackButton";

const emptySource = {
  name: "Servidor 1",
  url: "",
  type: "hls",
  audio: "dub",
  quality: "1080p",
  subtitles: []
};

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");

  const [imdbId, setImdbId] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("movie");
  const [featured, setFeatured] = useState(false);
  const [source, setSource] = useState(emptySource);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [episodeSources, setEpisodeSources] = useState([emptySource]);
  const [movieSources, setMovieSources] = useState([emptySource]);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    movie: null,
    loading: false
  });

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
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

  const updateSourceField = (field, value) => {
    setSource((prev) => ({
      ...prev,
      [field]: value,
      quality:
        field === "type" && value === "embed"
          ? "Auto"
          : prev.quality
    }));
  };

  const updateMovieSourceField = (index, field, value) => {
    setMovieSources((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              quality:
                field === "type" && value === "embed"
                  ? "Auto"
                  : item.quality
            }
          : item
      )
    );
  };

  const updateEpisodeSourceField = (index, field, value) => {
    setEpisodeSources((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              quality:
                field === "type" && value === "embed"
                  ? "Auto"
                  : item.quality
            }
          : item
      )
    );
  };

  const addMovieSource = () => {
    setMovieSources((prev) => [
      ...prev,
      {
        ...emptySource,
        name: `Servidor ${prev.length + 1}`
      }
    ]);
  };

  const addEpisodeSource = () => {
    setEpisodeSources((prev) => [
      ...prev,
      {
        ...emptySource,
        name: `Servidor ${prev.length + 1}`
      }
    ]);
  };

  const removeMovieSource = (index) => {
    setMovieSources((prev) => prev.filter((_, i) => i !== index));
  };

  const removeEpisodeSource = (index) => {
    setEpisodeSources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await API.post("/admin/movies", {
        imdbId,
        category,
        type,
        featured,
        source: type === "movie" ? source : null
      });

      showToast("Item adicionado", "success");

      setImdbId("");
      setCategory("");
      setType("movie");
      setFeatured(false);
      setSource(emptySource);

      loadMovies();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao adicionar item",
        "error"
      );
    }
  };

  const openDeleteModal = (movie) => {
    setDeleteModal({
      open: true,
      movie,
      loading: false
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;

    setDeleteModal({
      open: false,
      movie: null,
      loading: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.movie) return;

    try {
      setDeleteModal((prev) => ({
        ...prev,
        loading: true
      }));

      await API.delete(`/admin/movies/${deleteModal.movie._id}`);

      showToast("Item deletado", "success");

      if (selectedMovie?._id === deleteModal.movie._id) {
        setSelectedMovie(null);
        setSelectedEpisode(null);
      }

      setDeleteModal({
        open: false,
        movie: null,
        loading: false
      });

      loadMovies();
    } catch (err) {
      console.error(err);

      setDeleteModal((prev) => ({
        ...prev,
        loading: false
      }));

      showToast(
        err.response?.data?.message || "Erro ao deletar",
        "error"
      );
    }
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setSelectedEpisode(null);
    setEpisodeSearch("");

    setMovieSources(
      movie.sources?.length ? movie.sources : [emptySource]
    );
  };

  const handleCloseManage = () => {
    setSelectedMovie(null);
    setSelectedEpisode(null);
    setEpisodeSearch("");
    setMovieSources([emptySource]);
    setEpisodeSources([emptySource]);
  };

  const handleSelectEpisode = (episode) => {
    setSelectedEpisode(episode);

    setEpisodeSources(
      episode.sources?.length ? episode.sources : [emptySource]
    );
  };

  const handleSaveMovieSources = async () => {
    try {
      await API.put(`/admin/movies/${selectedMovie._id}/sources`, {
        sources: movieSources
      });

      showToast("Servidores do filme salvos", "success");

      loadMovies();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao salvar servidores",
        "error"
      );
    }
  };

  const handleSaveEpisodeSources = async () => {
    try {
      await API.put(`/admin/movies/${selectedMovie._id}/episodes`, {
        seasonNumber: selectedEpisode.seasonNumber,
        episodeNumber: selectedEpisode.episodeNumber,
        sources: episodeSources
      });

      showToast("Servidores do episódio salvos", "success");

      loadMovies();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
          "Erro ao salvar servidores do episódio",
        "error"
      );
    }
  };

  const renderSourceForm = (server, index, updateFn, removeFn) => {
    return (
      <div className="source-box-custom" key={index}>
        <input
          placeholder="Nome do servidor"
          value={server.name}
          onChange={(e) => updateFn(index, "name", e.target.value)}
        />

        <input
          placeholder={
            server.type === "embed"
              ? "URL do embed/player externo"
              : "URL .m3u8 ou .mp4"
          }
          value={server.url}
          onChange={(e) => updateFn(index, "url", e.target.value)}
        />

        <div className="form-grid-custom">
          <select
            value={server.type}
            onChange={(e) => updateFn(index, "type", e.target.value)}
          >
            <option value="hls">HLS / m3u8</option>
            <option value="mp4">MP4</option>
            <option value="embed">Embed externo</option>
          </select>

          <select
            value={server.audio}
            onChange={(e) => updateFn(index, "audio", e.target.value)}
          >
            <option value="dub">Dublado</option>
            <option value="leg">Legendado</option>
            <option value="original">Original</option>
          </select>

          <input
            placeholder="Qualidade"
            value={server.quality}
            onChange={(e) =>
              updateFn(index, "quality", e.target.value)
            }
          />
        </div>

        {server.type === "embed" && (
          <p className="embed-warning-custom">
            Use aqui links de players externos, como Videasy ou outro
            iframe compatível.
          </p>
        )}

        <button
          className="danger-btn-custom"
          onClick={() => removeFn(index)}
        >
          Remover servidor
        </button>
      </div>
    );
  };

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

      {deleteModal.open && (
        <div className="streaming-modal-overlay" onClick={closeDeleteModal}>
          <div
            className="streaming-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-poster">
              {deleteModal.movie?.image ? (
                <img
                  src={deleteModal.movie.image}
                  alt={deleteModal.movie.title}
                />
              ) : (
                <div className="modal-poster-placeholder">?</div>
              )}
            </div>

            <div className="modal-content">
              <span className="modal-tag">Confirmar exclusão</span>

              <h2>Remover este conteúdo?</h2>

              <p>
                Você está prestes a deletar{" "}
                <strong>{deleteModal.movie?.title}</strong> do catálogo.
                Essa ação não pode ser desfeita.
              </p>

              <div className="modal-actions">
                <button
                  className="modal-cancel"
                  onClick={closeDeleteModal}
                  disabled={deleteModal.loading}
                >
                  Cancelar
                </button>

                <button
                  className="modal-delete"
                  onClick={confirmDelete}
                  disabled={deleteModal.loading}
                >
                  {deleteModal.loading ? "Deletando..." : "Deletar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-custom">
        <BackButton />

        <h1>Painel Admin</h1>

        <section className="admin-card-custom">
          <h2>Adicionar conteúdo via TMDB</h2>

          <div className="form-grid-custom">
            <input
              placeholder="IMDb ID. Ex: tt2911666"
              value={imdbId}
              onChange={(e) => setImdbId(e.target.value)}
            />

            <input
              placeholder="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="movie">Filme</option>
              <option value="series">Série</option>
              <option value="anime">Anime</option>
            </select>

            <label className="checkbox-custom">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Marcar como destaque
            </label>
          </div>

          {type === "movie" && (
            <div className="source-box-custom">
              <h3>Servidor inicial do filme</h3>

              <input
                placeholder="Nome do servidor"
                value={source.name}
                onChange={(e) =>
                  updateSourceField("name", e.target.value)
                }
              />

              <input
                placeholder={
                  source.type === "embed"
                    ? "URL do embed/player externo"
                    : "URL do vídeo .m3u8 ou .mp4"
                }
                value={source.url}
                onChange={(e) =>
                  updateSourceField("url", e.target.value)
                }
              />

              <div className="form-grid-custom">
                <select
                  value={source.type}
                  onChange={(e) =>
                    updateSourceField("type", e.target.value)
                  }
                >
                  <option value="hls">HLS / m3u8</option>
                  <option value="mp4">MP4</option>
                  <option value="embed">Embed externo</option>
                </select>

                <select
                  value={source.audio}
                  onChange={(e) =>
                    updateSourceField("audio", e.target.value)
                  }
                >
                  <option value="dub">Dublado</option>
                  <option value="leg">Legendado</option>
                  <option value="original">Original</option>
                </select>

                <input
                  placeholder="Qualidade. Ex: 1080p ou Auto"
                  value={source.quality}
                  onChange={(e) =>
                    updateSourceField("quality", e.target.value)
                  }
                />
              </div>

              {source.type === "embed" && (
                <p className="embed-warning-custom">
                  Para Videasy ou outro player externo, cole a URL completa
                  do embed/player.
                </p>
              )}
            </div>
          )}

          <button className="primary-btn-custom" onClick={handleSubmit}>
            Adicionar
          </button>
        </section>

        <section className="admin-card-custom">
          <h2>Conteúdo cadastrado</h2>

          <input
            placeholder="Buscar conteúdo"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />

          {filteredMovies.length === 0 && <p>Nenhum item encontrado</p>}

          <div className="movie-list-custom">
            {filteredMovies.map((movie) => (
              <div className="movie-item-custom" key={movie._id}>
                <div className="movie-info-custom">
                  {movie.image && <img src={movie.image} alt={movie.title} />}

                  <div>
                    <strong>{movie.title}</strong>

                    <p>
                      {movie.category || "Sem categoria"} •{" "}
                      {movie.type === "anime"
                        ? "Anime"
                        : movie.type === "series"
                        ? "Série"
                        : "Filme"}{" "}
                      • {movie.featured ? "Destaque" : "Normal"} •{" "}
                      {movie.imdbId}
                    </p>

                    <p>
                      Servidores: {movie.sources?.length || 0} • Episódios:{" "}
                      {movie.episodes?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="actions-custom">
                  <button onClick={() => handleSelectMovie(movie)}>
                    Gerenciar
                  </button>

                  <button
                    className="danger-btn-custom"
                    onClick={() => openDeleteModal(movie)}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedMovie && (
          <section className="admin-card-custom manage-card-custom">
            <div className="manage-header-custom">
              <div>
                <span className="manage-tag-custom">Gerenciamento</span>
                <h2>{selectedMovie.title}</h2>
              </div>

              <button
                className="close-manage-btn-custom"
                onClick={handleCloseManage}
              >
                Minimizar
              </button>
            </div>

            {selectedMovie.type === "movie" && (
              <>
                <h3>Servidores do filme</h3>

                {movieSources.map((server, index) =>
                  renderSourceForm(
                    server,
                    index,
                    updateMovieSourceField,
                    removeMovieSource
                  )
                )}

                <button onClick={addMovieSource}>Adicionar servidor</button>

                <button
                  className="primary-btn-custom"
                  onClick={handleSaveMovieSources}
                >
                  Salvar servidores do filme
                </button>
              </>
            )}

            {(selectedMovie.type === "series" ||
              selectedMovie.type === "anime") && (
              <>
                <h3>Episódios</h3>

                <input
                  placeholder="Buscar episódio"
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                />

                <div className="episodes-list-custom">
                  {filteredEpisodes.map((episode) => (
                    <button
                      key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                      className={
                        selectedEpisode?.seasonNumber ===
                          episode.seasonNumber &&
                        selectedEpisode?.episodeNumber ===
                          episode.episodeNumber
                          ? "episode-btn-custom active"
                          : "episode-btn-custom"
                      }
                      onClick={() => handleSelectEpisode(episode)}
                    >
                      T{episode.seasonNumber} EP{episode.episodeNumber} -{" "}
                      {episode.title}
                      <br />
                      Servidores: {episode.sources?.length || 0}
                    </button>
                  ))}
                </div>

                {selectedEpisode && (
                  <div className="episode-editor-custom">
                    <h3>
                      Servidores: T{selectedEpisode.seasonNumber} EP
                      {selectedEpisode.episodeNumber}
                    </h3>

                    {episodeSources.map((server, index) =>
                      renderSourceForm(
                        server,
                        index,
                        updateEpisodeSourceField,
                        removeEpisodeSource
                      )
                    )}

                    <button onClick={addEpisodeSource}>
                      Adicionar servidor
                    </button>

                    <button
                      className="primary-btn-custom"
                      onClick={handleSaveEpisodeSources}
                    >
                      Salvar servidores do episódio
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      <style jsx>{`
        .admin-page-custom {
          min-height: 100vh;
          background: #141414;
          color: white;
          padding: 30px;
        }

        h1 {
          color: #e50914;
          margin-bottom: 25px;
        }

        h2,
        h3 {
          margin-bottom: 15px;
        }

        .admin-card-custom {
          background: #1b1b1b;
          padding: 25px;
          border-radius: 16px;
          margin-bottom: 25px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
        }

        .manage-card-custom {
          border: 1px solid rgba(229, 9, 20, 0.35);
        }

        .manage-header-custom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }

        .manage-header-custom h2 {
          margin-bottom: 0;
        }

        .manage-tag-custom {
          display: inline-block;
          background: #e50914;
          color: white;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .close-manage-btn-custom {
          background: #444;
          color: white;
          font-weight: bold;
          white-space: nowrap;
        }

        .close-manage-btn-custom:hover {
          background: #666;
        }

        .form-grid-custom {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        input,
        select {
          width: 100%;
          background: #2b2b2b;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          outline: none;
          margin-bottom: 10px;
        }

        input:focus,
        select:focus {
          box-shadow: 0 0 0 2px #e50914;
        }

        .checkbox-custom {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #242424;
          padding: 14px;
          border-radius: 8px;
        }

        .checkbox-custom input {
          width: auto;
          margin: 0;
        }

        button {
          background: #333;
          color: white;
          border: none;
          padding: 11px 15px;
          border-radius: 8px;
          cursor: pointer;
          margin: 5px 5px 5px 0;
          transition: 0.2s;
        }

        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .primary-btn-custom {
          background: #e50914;
          font-weight: bold;
        }

        .danger-btn-custom {
          background: #b00020;
        }

        .danger-btn-custom:hover {
          background: #d00028;
        }

        .source-box-custom {
          background: #151515;
          border: 1px solid #333;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .embed-warning-custom {
          background: rgba(229, 9, 20, 0.12);
          border: 1px solid rgba(229, 9, 20, 0.35);
          color: #f1f1f1;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .movie-list-custom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 15px;
        }

        .movie-item-custom {
          background: #242424;
          border-radius: 14px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .movie-info-custom {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .movie-info-custom img {
          width: 70px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
        }

        .movie-item-custom p {
          color: #ccc;
          margin: 5px 0;
        }

        .actions-custom {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .episodes-list-custom {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }

        .episode-btn-custom {
          text-align: left;
          background: #151515;
          border: 1px solid #333;
          width: 100%;
        }

        .episode-btn-custom.active {
          background: #e50914;
          border-color: #e50914;
        }

        .episode-editor-custom {
          margin-top: 20px;
        }

        .streaming-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          animation: modalFadeIn 0.18s ease;
        }

        .streaming-modal {
          width: 100%;
          max-width: 680px;
          background: linear-gradient(135deg, #242424, #111);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 190px 1fr;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.75);
          animation: modalScaleIn 0.2s ease;
        }

        .modal-poster {
          background: #0b0b0b;
          min-height: 280px;
        }

        .modal-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .modal-poster-placeholder {
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 4rem;
          color: #e50914;
          font-weight: bold;
        }

        .modal-content {
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .modal-tag {
          width: fit-content;
          background: #e50914;
          color: white;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 15px;
        }

        .modal-content h2 {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .modal-content p {
          color: #d0d0d0;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .modal-content strong {
          color: white;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .modal-cancel,
        .modal-delete {
          flex: 1;
          padding: 13px 16px;
          font-weight: bold;
          border-radius: 10px;
          margin: 0;
        }

        .modal-cancel {
          background: rgba(109, 109, 110, 0.7);
        }

        .modal-delete {
          background: #e50914;
        }

        .modal-delete:hover {
          background: #ff1f1f;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(15px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .admin-page-custom {
            padding: 12px;
          }

          .manage-header-custom {
            flex-direction: column;
            align-items: stretch;
          }

          .close-manage-btn-custom {
            width: 100%;
          }

          .movie-item-custom {
            flex-direction: column;
          }

          .movie-info-custom {
            align-items: flex-start;
          }

          .actions-custom {
            flex-direction: column;
            align-items: stretch;
          }

          button {
            width: 100%;
          }

          .streaming-modal {
            grid-template-columns: 1fr;
            max-width: 420px;
          }

          .modal-poster {
            height: 210px;
            min-height: auto;
          }

          .modal-content {
            padding: 22px;
          }

          .modal-content h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}