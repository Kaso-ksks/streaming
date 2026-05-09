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

function getProfileAvatar(user) {
  return user?.activeProfile?.avatarUrl || user?.avatarUrl || "";
}

function getProfileName(user) {
  return user?.activeProfile?.name || user?.email || "Perfil";
}

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [premiumModal, setPremiumModal] = useState(false);

  useEffect(() => {
    API.get("/movies")
      .then((res) => setMovies(res.data))
      .catch((err) => console.error("Erro ao buscar filmes:", err));

    loadUser();
  }, []);

  const maybeShowPremiumModal = (userData) => {
    if (!userData?.isPremium) return;

    const key = `premium-welcome-${userData.id}`;

    if (!sessionStorage.getItem(key)) {
      setPremiumModal(true);
      sessionStorage.setItem(key, "true");
    }
  };

  const loadUser = async () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        maybeShowPremiumModal(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }

    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const res = await API.get("/auth/me");

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      maybeShowPremiumModal(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    window.location.href = "/";
  };

  const getInitial = () => {
    const name = getProfileName(user);
    return name.charAt(0).toUpperCase();
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

  const avatarUrl = getProfileAvatar(user);

  return (
    <div className="home-page">
      {premiumModal && (
        <div
          className="premium-modal-overlay"
          onClick={() => setPremiumModal(false)}
        >
          <div
            className="premium-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="premium-modal-art"
              style={{
                backgroundImage: user?.premiumBannerUrl
                  ? `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.75)), url(${user.premiumBannerUrl})`
                  : "linear-gradient(135deg, #7a0006, #e50914)"
              }}
            >
              <span>👑</span>
            </div>

            <div className="premium-modal-content">
              <span className="premium-modal-tag">
                Premium ativo
              </span>

              <h2>Bem-vindo, {getProfileName(user)}</h2>

              <p>
                Sua experiência premium está ativa: avatar destacado,
                banner exclusivo, favoritos ilimitados e múltiplos perfis.
              </p>

              <button onClick={() => setPremiumModal(false)}>
                Começar a assistir
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <Link href="/" className="logo">
          <h1>Kyzo</h1>
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
              {user.isPremium && (
                <span className="premium-header-badge">
                  👑 Premium
                </span>
              )}

              {user.isAdmin && <Link href="/admin">Admin</Link>}

              <Link
                href="/profile"
                className={
                  user.isPremium
                    ? "avatar-button premium-avatar"
                    : "avatar-button"
                }
                title={getProfileName(user)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Perfil" />
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
                href={`/watch/${featuredMovie._id}`}
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

      <style jsx>{`
        .premium-header-badge {
          background: linear-gradient(135deg, #ffd36a, #b8860b);
          color: #1a1200;
          padding: 9px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: bold;
          white-space: nowrap;
        }

        .premium-avatar {
          box-shadow:
            0 0 0 2px #ffd36a,
            0 0 24px rgba(255, 211, 106, 0.45);
        }

        .premium-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .premium-modal {
          width: 100%;
          max-width: 760px;
          background: linear-gradient(135deg, #242424, #111);
          border: 1px solid rgba(255, 211, 106, 0.35);
          border-radius: 22px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 280px 1fr;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.8);
        }

        .premium-modal-art {
          min-height: 360px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .premium-modal-art span {
          font-size: 5rem;
          filter: drop-shadow(0 10px 25px rgba(0,0,0,.6));
        }

        .premium-modal-content {
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .premium-modal-tag {
          width: fit-content;
          background: linear-gradient(135deg, #ffd36a, #b8860b);
          color: #1a1200;
          padding: 8px 13px;
          border-radius: 999px;
          font-weight: bold;
          margin-bottom: 16px;
        }

        .premium-modal-content h2 {
          font-size: 2.2rem;
          margin-bottom: 14px;
        }

        .premium-modal-content p {
          color: #dcdcdc;
          line-height: 1.6;
          margin-bottom: 26px;
        }

        .premium-modal-content button {
          background: #e50914;
          color: white;
          border: none;
          padding: 14px 18px;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.2s;
        }

        .premium-modal-content button:hover {
          background: #ff1f1f;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .premium-header-badge {
            display: none;
          }

          .premium-modal {
            grid-template-columns: 1fr;
            max-width: 430px;
          }

          .premium-modal-art {
            min-height: 180px;
          }

          .premium-modal-content {
            padding: 24px;
          }

          .premium-modal-content h2 {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </div>
  );
}

function MovieCard({ movie }) {
  return (
    <Link href={`/watch/${movie._id}`} className="row-card">
      {movie.image ? (
        <img src={movie.image} alt={movie.title} />
      ) : (
        <div className="card-placeholder">Sem imagem</div>
      )}

      <div className="card-title">{movie.title}</div>
    </Link>
  );
}