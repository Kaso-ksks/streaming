import { useEffect, useState } from "react";
import API from "../services/api";

export default function Home() {

  const [movies, setMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {

    API.get("/movies")
      .then((res) => setMovies(res.data))
      .catch((err) =>
        console.error("Erro ao buscar filmes:", err)
      );

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

  }, []);

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    window.location.href = "/";
  };

  const getInitial = () => {
    if (!user?.email) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  const featuredMovie =
    movies.find((movie) => movie.featured) || movies[0];

  const filteredMovies = movies.filter((movie) =>
    movie.title
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  const categories = [
    ...new Set(
      filteredMovies
        .map((movie) => movie.category)
        .filter(Boolean)
    )
  ];

  return (
    <div className="home-page">

      <header className="header">

        <h1>🎬 Streaming</h1>

        <div className="header-center">

          <input
            type="text"
            placeholder="Buscar filmes..."
            className="search-input"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="header-buttons">

          {user ? (
            <>
              {user.isAdmin && (
                <a href="/admin">
                  Admin
                </a>
              )}

              <a
                href="/profile"
                className="avatar-button"
              >
                {getInitial()}
              </a>

              <button onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <a href="/login">
                Login
              </a>

              <a href="/register">
                Registrar
              </a>
            </>
          )}

        </div>

      </header>

      {!search && featuredMovie && (
        <section
          className="hero"
          style={{
            backgroundImage:
              `linear-gradient(to right, #141414 25%, rgba(20,20,20,0.4)), url(${featuredMovie.banner || featuredMovie.image})`
          }}
        >

          <div className="hero-content">

            <span className="hero-tag">
              Destaque
            </span>

            <h2>
              {featuredMovie.title}
            </h2>

            <p>
              {featuredMovie.description}
            </p>

            <div className="hero-buttons">

              <a
                href={`/watch/${featuredMovie._id}`}
                className="play-button"
              >
                ▶ Assistir
              </a>

              <a
                href={`/watch/${featuredMovie._id}`}
                className="info-button"
              >
                Mais informações
              </a>

            </div>

          </div>

        </section>
      )}

      <main className="container">

        {search && (
          <section className="movie-section">

            <h2 className="section-title">
              Resultados para "{search}"
            </h2>

            <div className="movie-row">

              {filteredMovies.map((movie) => (

                <a
                  href={`/watch/${movie._id}`}
                  className="row-card"
                  key={movie._id}
                >

                  <img
                    src={
                      movie.image ||
                      "https://via.placeholder.com/300x450"
                    }
                    alt={movie.title}
                  />

                  <div className="card-title">
                    {movie.title}
                  </div>

                </a>
              ))}

            </div>

          </section>
        )}

        {!search && (
          <>
            <section className="movie-section">

              <h2 className="section-title">
                Todos
              </h2>

              <div className="movie-row">

                {movies.map((movie) => (

                  <a
                    href={`/watch/${movie._id}`}
                    className="row-card"
                    key={movie._id}
                  >

                    <img
                      src={
                        movie.image ||
                        "https://via.placeholder.com/300x450"
                      }
                      alt={movie.title}
                    />

                    <div className="card-title">
                      {movie.title}
                    </div>

                  </a>
                ))}

              </div>

            </section>

            {categories.map((category) => (

              <section
                className="movie-section"
                key={category}
              >

                <h2 className="section-title">
                  {category}
                </h2>

                <div className="movie-row">

                  {movies
                    .filter(
                      (movie) =>
                        movie.category === category
                    )
                    .map((movie) => (

                      <a
                        href={`/watch/${movie._id}`}
                        className="row-card"
                        key={movie._id}
                      >

                        <img
                          src={
                            movie.image ||
                            "https://via.placeholder.com/300x450"
                          }
                          alt={movie.title}
                        />

                        <div className="card-title">
                          {movie.title}
                        </div>

                      </a>
                    ))}

                </div>

              </section>
            ))}
          </>
        )}

      </main>

    </div>
  );
}