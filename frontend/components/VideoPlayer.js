import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function VideoPlayer({
  sources = [],
  title = "",
  autoPlay = true,
  initialTime = 0,
  onProgressUpdate,
  onEnded
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const lastSavedRef = useRef(0);
  const initialAppliedRef = useRef(false);

  const [selectedServer, setSelectedServer] = useState(0);
  const [audioType, setAudioType] = useState("all");

  const availableAudios = [
    ...new Set(sources.map((source) => source.audio).filter(Boolean))
  ];

  const filteredSources =
    audioType === "all"
      ? sources
      : sources.filter((source) => source.audio === audioType);

  const currentSource =
    filteredSources[selectedServer] || filteredSources[0];

  const showAudioSelect = availableAudios.length > 1;
  const showServerSelect = filteredSources.length > 1;
  const showToolbar = showAudioSelect || showServerSelect;

  useEffect(() => {
    if (availableAudios.length === 1) {
      setAudioType(availableAudios[0]);
    } else {
      setAudioType("all");
    }

    setSelectedServer(0);
    initialAppliedRef.current = false;
    lastSavedRef.current = 0;
  }, [sources]);

  useEffect(() => {
    setSelectedServer(0);
    initialAppliedRef.current = false;
  }, [audioType]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !currentSource?.url) return;
    if (currentSource.type === "embed") return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.removeAttribute("src");
    video.load();

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

    const applyInitialTime = () => {
      if (
        initialAppliedRef.current ||
        !initialTime ||
        Number(initialTime) <= 5
      ) {
        return;
      }

      video.currentTime = Number(initialTime);
      initialAppliedRef.current = true;
    };

    video.addEventListener("loadedmetadata", applyInitialTime);

    if (autoPlay) {
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener("loadedmetadata", applyInitialTime);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource, autoPlay, initialTime]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video || !onProgressUpdate) return;

    const now = Date.now();

    if (now - lastSavedRef.current < 5000) return;

    lastSavedRef.current = now;

    onProgressUpdate({
      currentTime: video.currentTime || 0,
      duration: video.duration || 0
    });
  };

  const handleEnded = () => {
    const video = videoRef.current;

    if (onProgressUpdate && video) {
      onProgressUpdate({
        currentTime: video.duration || video.currentTime || 0,
        duration: video.duration || 0
      });
    }

    if (onEnded) {
      onEnded();
    }
  };

  const toggleFullscreen = () => {
    const player = videoRef.current;

    if (!player) return;

    if (!document.fullscreenElement) {
      player.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const audioLabel = (audio) => {
    if (audio === "dub") return "Dublado";
    if (audio === "leg") return "Legendado";
    if (audio === "original") return "Original";
    return audio;
  };

  if (!sources.length) {
    return (
      <div className="custom-player-container">
        <div className="empty-player">
          Nenhum servidor disponível
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="custom-player-container">
      {currentSource?.type === "embed" ? (
        <iframe
          className="custom-embed-player"
          src={currentSource.url}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
        />
      ) : (
        <video
          ref={videoRef}
          className="custom-video-player"
          controls
          playsInline
          controlsList="nodownload"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
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
      )}

      {showToolbar && (
        <div className="player-toolbar">
          <div className="player-selects">
            {showAudioSelect && (
              <select
                value={audioType}
                onChange={(e) => setAudioType(e.target.value)}
              >
                <option value="all">Todos</option>

                {availableAudios.map((audio) => (
                  <option key={audio} value={audio}>
                    {audioLabel(audio)}
                  </option>
                ))}
              </select>
            )}

            {showServerSelect && (
              <select
                value={selectedServer}
                onChange={(e) =>
                  setSelectedServer(Number(e.target.value))
                }
              >
                {filteredSources.map((server, index) => (
                  <option key={index} value={index}>
                    {server.name} •{" "}
                    {server.type === "embed"
                      ? "Embed"
                      : server.type.toUpperCase()}{" "}
                    • {server.quality}
                  </option>
                ))}
              </select>
            )}
          </div>

          {currentSource?.type !== "embed" && (
            <button
              className="fullscreen-btn"
              onClick={toggleFullscreen}
            >
              Fullscreen
            </button>
          )}
        </div>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .custom-player-container {
    width: 100%;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
  }

  .custom-video-player,
  .custom-embed-player {
    width: 100%;
    height: 75vh;
    background: #000;
    border: none;
    display: block;
  }

  .empty-player {
    height: 60vh;
    background: #000;
    color: #aaa;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
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

  @media (max-width: 768px) {
    .custom-video-player,
    .custom-embed-player {
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
`;