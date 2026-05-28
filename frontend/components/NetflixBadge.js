export default function NetflixBadge({ type = "HD" }) {
  const normalized = String(type).toLowerCase();

  const labels = {
    novo: "NOVO",
    popular: "POPULAR",
    hd: "HD",
    premium: "PREMIUM",
    top10: "TOP 10"
  };

  const label = labels[normalized] || type;

  return (
    <>
      <span className={`netflix-badge ${normalized}`}>
        {label}
      </span>

      <style jsx>{`
        .netflix-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.4px;
          color: white;
          background: rgba(255,255,255,0.14);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .novo {
          background: #e50914;
        }

        .popular {
          background: linear-gradient(135deg, #e50914, #7a0006);
        }

        .hd {
          background: rgba(255,255,255,0.18);
        }

        .premium {
          background: linear-gradient(135deg, #ffd36a, #b8860b);
          color: #1a1200;
        }

        .top10 {
          background: #fff;
          color: #000;
        }
      `}</style>
    </>
  );
}