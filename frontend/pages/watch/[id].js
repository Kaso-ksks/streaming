import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import API from "../../services/api";

export default function Watch() {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState(null);

  useEffect(() => {
    if (id) {
      API.get("/movies").then(res => {
        const found = res.data.find(m => m._id === id);
        setMovie(found);
      });
    }
  }, [id]);

  if (!movie) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{movie.title}</h1>

      <video controls width="100%" style={{ maxWidth: 900 }}>
        <source src={movie.videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}