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
      [field]: value
    }));
  };

  const updateMovieSourceField = (index, field, value) => {
    setMovieSources((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const updateEpisodeSourceField = (index, field, value) => {
    setEpisodeSources((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
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

      <div className="admin-page">
        <BackButton />

        <h1>Painel Admin</h1>

        <section className="card">
          <h2>Adicionar conteúdo via TMDB</h2>

          <div className="form-grid">
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

            <label className="checkbox">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Marcar como destaque
            </label>
          </div>

          {type === "movie" && (
            <div className="source-box">
              <h3>Servidor inicial do filme</h3>

              <input
                placeholder="Nome do servidor"
                value={source.name}
                onChange={(e) =>
                  updateSourceField("name", e.target.value)
                }
              />

              <input
                placeholder="URL do vídeo .m3u8 ou .mp4"
                value={source.url}
                onChange={(e) =>
                  updateSourceField("url", e.target.value)
                }
              />

              <div className="form-grid">
                <select
                  value={source.type}
                  onChange={(e) =>
                    updateSourceField("type", e.target.value)
                  }
                >
                  <option value="hls">HLS / m3u8</option>
                  <option value="mp4">MP4</option>
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
                  placeholder="Qualidade. Ex: 1080p"
                  value={source.quality}
                  onChange={(e) =>
                    updateSourceField("quality", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          <button className="primary-btn" onClick={handleSubmit}>
            Adicionar
          </button>
        </section>

        <section className="card">
          <h2>Conteúdo cadastrado</h2>

          <input
            placeholder="Buscar conteúdo"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />

          {filteredMovies.length === 0 && (
            <p>Nenhum item encontrado</p>
          )}

          <div className="movie-list">
            {filteredMovies.map((movie) => (
              <div className="movie-item" key={movie._id}>
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
                    Servidores: {movie.sources?.length || 0} •
                    Episódios: {movie.episodes?.length || 0}
                  </p>
                </div>

                <div className="actions">
                  <button onClick={() => handleSelectMovie(movie)}>
                    Gerenciar
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() => handleDelete(movie._id)}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedMovie && (
          <section className="card">
            <h2>Gerenciar: {selectedMovie.title}</h2>

            {selectedMovie.type === "movie" && (
              <>
                <h3>Servidores do filme</h3>

                {movieSources.map((server, index) => (
                  <div className="source-box" key={index}>
                    <input
                      placeholder="Nome do servidor"
                      value={server.name}
                      onChange={(e) =>
                        updateMovieSourceField(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                    />

                    <input
                      placeholder="URL .m3u8 ou .mp4"
                      value={server.url}
                      onChange={(e) =>
                        updateMovieSourceField(
                          index,
                          "url",
                          e.target.value
                        )
                      }
                    />

                    <div className="form-grid">
                      <select
                        value={server.type}
                        onChange={(e) =>
                          updateMovieSourceField(
                            index,
                            "type",
                            e.target.value
                          )
                        }
                      >
                        <option value="hls">HLS / m3u8</option>
                        <option value="mp4">MP4</option>
                      </select>

                      <select
                        value={server.audio}
                        onChange={(e) =>
                          updateMovieSourceField(
                            index,
                            "audio",
                            e.target.value
                          )
                        }
                      >
                        <option value="dub">Dublado</option>
                        <option value="leg">Legendado</option>
                        <option value="original">Original</option>
                      </select>

                      <input
                        placeholder="Qualidade"
                        value={server.quality}
                        onChange={(e) =>
                          updateMovieSourceField(
                            index,
                            "quality",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      className="danger-btn"
                      onClick={() => removeMovieSource(index)}
                    >
                      Remover servidor
                    </button>
                  </div>
                ))}

                <button onClick={addMovieSource}>
                  Adicionar servidor
                </button>

                <button
                  className="primary-btn"
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

                <div className="episodes-list">
                  {filteredEpisodes.map((episode) => (
                    <button
                      key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                      className={
                        selectedEpisode?.seasonNumber ===
                          episode.seasonNumber &&
                        selectedEpisode?.episodeNumber ===
                          episode.episodeNumber
                          ? "episode-btn active"
                          : "episode-btn"
                      }
                      onClick={() => handleSelectEpisode(episode)}
                    >
                      T{episode.seasonNumber} EP
                      {episode.episodeNumber} - {episode.title}
                      <br />
                      Servidores: {episode.sources?.length || 0}
                    </button>
                  ))}
                </div>

                {selectedEpisode && (
                  <div className="episode-editor">
                    <h3>
                      Servidores: T{selectedEpisode.seasonNumber} EP
                      {selectedEpisode.episodeNumber}
                    </h3>

                    {episodeSources.map((server, index) => (
                      <div className="source-box" key={index}>
                        <input
                          placeholder="Nome do servidor"
                          value={server.name}
                          onChange={(e) =>
                            updateEpisodeSourceField(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                        />

                        <input
                          placeholder="URL .m3u8 ou .mp4"
                          value={server.url}
                          onChange={(e) =>
                            updateEpisodeSourceField(
                              index,
                              "url",
                              e.target.value
                            )
                          }
                        />

                        <div className="form-grid">
                          <select
                            value={server.type}
                            onChange={(e) =>
                              updateEpisodeSourceField(
                                index,
                                "type",
                                e.target.value
                              )
                            }
                          >
                            <option value="hls">HLS / m3u8</option>
                            <option value="mp4">MP4</option>
                          </select>

                          <select
                            value={server.audio}
                            onChange={(e) =>
                              updateEpisodeSourceField(
                                index,
                                "audio",
                                e.target.value
                              )
                            }
                          >
                            <option value="dub">Dublado</option>
                            <option value="leg">Legendado</option>
                            <option value="original">Original</option>
                          </select>

                          <input
                            placeholder="Qualidade"
                            value={server.quality}
                            onChange={(e) =>
                              updateEpisodeSourceField(
                                index,
                                "quality",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <button
                          className="danger-btn"
                          onClick={() => removeEpisodeSource(index)}
                        >
                          Remover servidor
                        </button>
                      </div>
                    ))}

                    <button onClick={addEpisodeSource}>
                      Adicionar servidor
                    </button>

                    <button
                      className="primary-btn"
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
        .admin-page {
          min-height: 100vh;
          background: #141414;
          color: white;
          padding: 25px;
        }

        h1,
        h2,
        h3 {
          margin-bottom: 15px;
        }

        .card {
          background: #1f1f1f;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        input,
        select {
          width: 100%;
          background: #111;
          color: white;
          border: 1px solid #333;
          padding: 12px;
          border-radius: 8px;
          outline: none;
          margin-bottom: 10px;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox input {
          width: auto;
          margin: 0;
        }

        button {
          background: #333;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          margin: 5px 5px 5px 0;
        }

        button:hover {
          opacity: 0.85;
        }

        .primary-btn {
          background: #e50914;
          font-weight: bold;
        }

        .danger-btn {
          background: #8b0000;
        }

        .source-box {
          background: #151515;
          border: 1px solid #333;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 15px;
        }

        .movie-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 15px;
        }

        .movie-item {
          background: #151515;
          border-radius: 10px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .movie-item p {
          color: #ccc;
          margin: 5px 0;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .episodes-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }

        .episode-btn {
          text-align: left;
          background: #151515;
          border: 1px solid #333;
        }

        .episode-btn.active {
          background: #e50914;
          border-color: #e50914;
        }

        .episode-editor {
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .admin-page {
            padding: 12px;
          }

          .movie-item {
            flex-direction: column;
          }

          .actions {
            flex-direction: column;
            align-items: stretch;
          }

          button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}