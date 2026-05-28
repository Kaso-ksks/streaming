import Link from "next/link";

export default function Custom404() {
  return (
    <div className="not-found-page">
      <div className="glow" />

      <div className="not-found-card">
        <span className="error-code">404</span>

        <h1>Essa cena não existe</h1>

        <p>
          O conteúdo que você tentou acessar saiu do catálogo,
          mudou de endereço ou nunca esteve disponível.
        </p>

        <div className="actions">
          <Link href="/" className="primary">
            Voltar para a Kyzo
          </Link>

          <button onClick={() => history.back()}>
            Voltar
          </button>
        </div>
      </div>

      <style jsx>{`
        .not-found-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(229,9,20,0.28), transparent 38%),
            linear-gradient(180deg, #050505, #141414);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
          position: relative;
        }

        .glow {
          position: absolute;
          width: 520px;
          height: 520px;
          background: #e50914;
          filter: blur(160px);
          opacity: 0.18;
          animation: pulseGlow 4s infinite alternate;
        }

        .not-found-card {
          position: relative;
          z-index: 2;
          max-width: 640px;
          width: 100%;
          padding: 42px;
          border-radius: 24px;
          background: rgba(20,20,20,0.82);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(18px);
          box-shadow: 0 30px 90px rgba(0,0,0,0.75);
          text-align: center;
          animation: fadeUp 0.5s ease both;
        }

        .error-code {
          display: inline-block;
          font-size: 6rem;
          font-weight: 900;
          color: #e50914;
          line-height: 1;
          margin-bottom: 10px;
          text-shadow: 0 0 30px rgba(229,9,20,0.45);
        }

        h1 {
          font-size: 2.4rem;
          margin-bottom: 16px;
        }

        p {
          color: #cfcfcf;
          line-height: 1.7;
          margin-bottom: 28px;
        }

        .actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        a,
        button {
          text-decoration: none;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          color: white;
          background: #2a2a2a;
          transition: 0.25s;
        }

        .primary {
          background: #e50914;
        }

        a:hover,
        button:hover {
          transform: translateY(-2px) scale(1.03);
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulseGlow {
          from {
            transform: scale(0.9);
            opacity: 0.13;
          }

          to {
            transform: scale(1.12);
            opacity: 0.24;
          }
        }

        @media (max-width: 600px) {
          .not-found-card {
            padding: 28px;
          }

          .error-code {
            font-size: 4.2rem;
          }

          h1 {
            font-size: 1.8rem;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}