import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function VideoPlayer({
  sources = [],
  title = "",
  autoPlay = true
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [selectedServer, setSelectedServer] = useState(0);
  const [audioType, setAudioType] = useState("dub");

  const filteredSources =
    audioType === "all"
      ? sources
      : sources.filter((s) => s.audio === audioType);

  const currentSource =
    filteredSources[selectedServer] || filteredSources[0];

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !currentSource?.url) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const isHls =
      currentSource.type === "hls" ||
      currentSource.url.includes(".m3u8");

    if (isHls) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = currentSource.url;
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(currentSource.url);
        hls.attachMedia(video);

        hlsRef.current = hls;
      }
    } else {
      video.src = currentSource.url;
    }

    if (autoPlay) {
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentSource, autoPlay]);

  useEffect(() => {
    const savedTime = localStorage.getItem(
      `watch-time-${title}`
    );

    if (savedTime && videoRef.current) {
      videoRef.current.currentTime = Number(savedTime);
    }
  }, [title]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        localStorage.setItem(
          `watch-time-${title}`,
          videoRef.current.currentTime
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [title]);

  const toggleFullscreen = () => {
    const player = videoRef.current;

    if (!document.fullscreenElement) {
      player.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="custom-player-container">
      <video
        ref={videoRef}
        className="custom-video-player"
        controls
        playsInline
        controlsList="nodownload"
      >
        {currentSource?.subtitles?.map((sub, index) => (
          <track
            key={index}
            kind="subtitles"
            src={sub.url}
            srcLang={sub.lang}
            label={sub.label}
          />
        ))}
      </video>

      <div className="player-toolbar">
        <div className="player-selects">
          <select
            value={audioType}
            onChange={(e) => {
              setAudioType(e.target.value);
              setSelectedServer(0);
            }}
          >
            <option value="dub">Dublado</option>
            <option value="leg">Legendado</option>
            <option value="original">Original</option>
            <option value="all">Todos</option>
          </select>

          <select
            value={selectedServer}
            onChange={(e) =>
              setSelectedServer(Number(e.target.value))
            }
          >
            {filteredSources.map((server, index) => (
              <option key={index} value={index}>
                {server.name} • {server.quality}
              </option>
            ))}
          </select>
        </div>

        <button
          className="fullscreen-btn"
          onClick={toggleFullscreen}
        >
          Fullscreen
        </button>
      </div>

      <style jsx>{`
        .custom-player-container {
          width: 100%;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }

        .custom-video-player {
          width: 100%;
          height: 75vh;
          background: #000;
        }

        .player-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #111;
          gap: 10px;
          flex-wrap: wrap;
        }

        .player-selects {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        select {
          background: #1c1c1c;
          color: white;
          border: 1px solid #333;
          padding: 10px;
          border-radius: 8px;
          outline: none;
        }

        .fullscreen-btn {
          background: #e50914;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .fullscreen-btn:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .custom-video-player {
            height: 45vh;
          }

          .player-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .player-selects {
            flex-direction: column;
          }

          select,
          .fullscreen-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}