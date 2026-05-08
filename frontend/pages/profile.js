import { useEffect, useState } from "react";
import API from "../services/api";
import BackButton from "../components/BackButton";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    API.get("/favorites")
      .then((res) => {
        setFavorites(res.data);
      })
      .catch(() => {
        setFavorites([]);
      });

    setLoaded(true);
  }, []);

  const getInitial = () => {
    if (!user?.email) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  if (!loaded) {
    return (
      <div className="loading">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <BackButton />

        <div className="profile-card">
          <h1>Você não está logado</h1>

          <div className="profile-actions">
            <button onClick={() => window.location.href = "/login"}>
              Fazer login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <BackButton />

      <div className="profile-card">
        <div className="profile-avatar">
          {getInitial()}
        </div>

        <h1>Meu Perfil</h1>

        <div className="profile-info">
          <div className="profile-item">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-item">
            <span>Plano</span>
            <strong>{user.isPremium ? "Premium" : "Gratuito"}</strong>
          </div>

          <div className="profile-item">
            <span>Conta</span>
            <strong>{user.isAdmin ? "Administrador" : "Usuário"}</strong>
          </div>
        </div>

        <div className="profile-actions">
          <button>Alterar Foto</button>
          <button>Trocar Senha</button>
        </div>

        <div className="favorites-section">
          <h2>❤️ Favoritos</h2>

          {favorites.length === 0 && (
            <p>Nenhum favorito ainda</p>
          )}

          <div className="favorites-grid">
            {favorites.map((movie) => (
              <a
                href={`/watch/${movie._id}`}
                className="favorite-card"
                key={movie._id}
              >
                <img
                  src={movie.image || "https://via.placeholder.com/300x450"}
                  alt={movie.title}
                />

                <span>{movie.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}