import { useState } from "react";
import API from "../../services/api";

export default function Admin() {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const handleSubmit = async () => {
    try {
      await API.post("/admin/movies", {
        title,
        videoUrl,
        thumbnail
      });

      alert("Filme adicionado!");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar filme");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Painel Admin</h1>

      <input
        placeholder="Título"
        onChange={e => setTitle(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="URL do vídeo"
        onChange={e => setVideoUrl(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Thumbnail"
        onChange={e => setThumbnail(e.target.value)}
      />
      <br /><br />

      <button onClick={handleSubmit}>
        Adicionar Filme
      </button>
    </div>
  );
}