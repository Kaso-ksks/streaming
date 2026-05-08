import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../services/api";

function getMovieCategories(movie) {
  if (!movie.category) return [];

  return movie.category
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean);
}

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    API.get("/movies")
      .then((res) => setMovies(res.data))
      .catch((err) => console.error("Erro ao buscar filmes:", err));

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
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
    movie.title?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    ...new Set(
      filteredMovies.flatMap((movie) => getMovieCategories(movie))
    )
  ].sort();

  return (
    <div className="home-page">
      <header className="header">
        <Link href="/" className="logo">
          <h1>Streaming</h1>
        </Link>

        <div className="header-center">
          <input
            className="search-input"
            placeholder="Buscar filmes, séries e animes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="header-buttons">
          {user ? (
            <>
              {user.isAdmin && <Link href="/admin">Admin</Link>}

              <Link href="/profile" className="avatar-button">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Perfil" />
                ) : (
                  <span>{getInitial()}</span>
                )}
              </Link>

              <button onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Registrar</Link>
            </>
          )}
        </div>
      </header>

      {!search && featuredMovie && (
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(
              rgba(0,0,0,.45),
              rgba(20,20,20,1)
            ), url(${featuredMovie.banner || featuredMovie.image})`
          }}
        >
          <div className="hero-content">
            <span className="hero-tag">Destaque</span>

            <h2>{featuredMovie.title}</h2>

            <p>{featuredMovie.description}</p>

            <div className="hero-buttons">
              <Link
                href={`/watch/${featuredMovie._id}`}
                className="play-button"
              >
                ▶ Assistir
              </Link>

              <Link
                href={`/movie/${featuredMovie._id}`}
                className="info-button"
              >
                Mais informações
              </Link>
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
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {!search && (
          <>
            <section className="movie-section">
              <h2 className="section-title">Todos</h2>

              <div className="movie-row">
                {movies.map((movie) => (
                  <MovieCard key={movie._id} movie={movie} />
                ))}
              </div>
            </section>

            {categories.map((category) => {
              const categoryMovies = movies.filter((movie) =>
                getMovieCategories(movie).includes(category)
              );

              if (categoryMovies.length === 0) return null;

              return (
                <section className="movie-section" key={category}>
                  <h2 className="section-title">{category}</h2>

                  <div className="movie-row">
                    {categoryMovies.map((movie) => (
                      <MovieCard key={movie._id} movie={movie} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}

function MovieCard({ movie }) {
  return (
    <Link href={`/movie/${movie._id}`} className="row-card">
      {movie.image ? (
        <img src={movie.image} alt={movie.title} />
      ) : (
        <div className="card-placeholder">Sem imagem</div>
      )}

      <div className="card-title">{movie.title}</div>
    </Link>
  );
}