"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

export function PublicHeroVideoPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  function toggleMuted() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <div className="relative h-full min-h-[25rem] overflow-hidden md:min-h-[29rem] xl:min-h-[30rem]">
      <video
        ref={videoRef}
        className="h-full min-h-[25rem] w-full object-cover md:min-h-[29rem] xl:min-h-[30rem]"
        poster={poster}
        preload="metadata"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
        }}
      >
        <source src={src} />
      </video>

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={playing ? "Videoyu duraklat" : "Videoyu oynat"}
        className={`absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/16 text-white shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur transition hover:bg-white/22 ${
          playing ? "opacity-0 hover:opacity-100 focus-visible:opacity-100" : "opacity-100"
        }`}
      >
        {playing ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-9 w-9" />}
      </button>

      <div className="absolute bottom-5 left-5 right-5 z-10 md:bottom-6 md:left-6 md:right-6">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/18">
          <div
            className="h-full rounded-full bg-white/78 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-white/88 drop-shadow">
            {title}
          </p>
          <button
            type="button"
            onClick={toggleMuted}
            aria-label={muted ? "Sesi aç" : "Sesi kapat"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/14 bg-black/24 text-white/86 backdrop-blur transition hover:bg-black/34"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
