export default function RandomButton({ movies = [] }) {
  const handleRandom = () => {
    if (!movies.length) return;

    const randomMovie =
      movies[Math.floor(Math.random() * movies.length)];

    if (randomMovie?._id) {
      window.location.href = `/watch/${randomMovie._id}`;
    }
  };

  return (
    <>
      <button className="random-btn" onClick={handleRandom}>
        🎲 Surpreenda-me
      </button>

      <style jsx>{`
        .random-btn {
          border: none;
          padding: 13px 20px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
          color: white;
          font-weight: 800;
          cursor: pointer;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.12);
          transition: 0.25s;
        }

        .random-btn:hover {
          background: #e50914;
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 12px 30px rgba(229,9,20,0.35);
        }
      `}</style>
    </>
  );
}