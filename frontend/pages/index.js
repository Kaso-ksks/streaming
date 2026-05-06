import { useEffect, useState } from "react";
import API from "../services/api";

export default function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    API.get("/movies")
      .then(res => setMovies(res.data))
      .catch(err => console.error("Erro ao buscar filmes:", err));
  }, []);

  return (
    <div className="container">
      <div className="header">🎬 Streaming</div>

      <div className="grid">
        {movies.length === 0 && (
          <p>Nenhum filme encontrado</p>
        )}

        {movies.map(movie => (
          <a
            href={`/watch/${movie._id}`}
            className="card"
            key={movie._id}
          >
            <img
              src={
                movie.thumbnail ||
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
    </div>
  );
}