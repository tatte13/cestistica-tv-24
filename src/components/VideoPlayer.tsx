import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentPlaybackState, getOverlayConfig, type VideoItem } from '../data/channelData';
import LiveBadge from './LiveBadge';

declare global {
  interface Window {
    YT: { Player: typeof YT.Player; PlayerState: typeof YT.PlayerState };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface Props {
  embed?: boolean;
  onVideoChange?: (video: VideoItem) => void;
}

// Load YT IFrame API script once
let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) { resolve(); return; }
    ytReadyCallbacks.push(resolve);
    if (ytApiLoaded) return;
    ytApiLoaded = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytReadyCallbacks.forEach(cb => cb());
      ytReadyCallbacks.length = 0;
    };
  });
}

export default function VideoPlayer({ embed = false, onVideoChange }: Props) {
  const initialState = getCurrentPlaybackState();
  const [currentVideo, setCurrentVideo] = useState(initialState.currentVideo);
  const [progress, setProgress] = useState(initialState.progress);
  const [elapsedInVideo, setElapsedInVideo] = useState(initialState.elapsedInVideo);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [overlay, setOverlay] = useState(getOverlayConfig());
  const [overlayImgError, setOverlayImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVideoIdRef = useRef<string>(initialState.currentVideo.id);
  const isMutedRef = useRef(true);
  const currentVideoRef = useRef(initialState.currentVideo);

  // Keep refs in sync
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { currentVideoRef.current = currentVideo; }, [currentVideo]);

  // Overlay + playlist reload quando i dati cambiano (es. sync Firebase)
  useEffect(() => {
    const check = () => { setOverlay(getOverlayConfig()); setOverlayImgError(false); };
    const interval = setInterval(check, 1000);
    const handler = () => {
      check();
      // Ricalcola lo stato di playback con la playlist aggiornata da Firebase
      const newState = getCurrentPlaybackState();
      // Aggiorna se cambia il video (es. switch live/replica o video forzato)
      if (newState.currentVideo.id !== currentVideoRef.current.id) {
        setCurrentVideo(newState.currentVideo);
        setProgress(newState.progress);
        setElapsedInVideo(newState.elapsedInVideo);
        lastVideoIdRef.current = newState.currentVideo.id;
      }
    };
    window.addEventListener('ctv24-data-change', handler);
    return () => { clearInterval(interval); window.removeEventListener('ctv24-data-change', handler); };
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    let destroyed = false;

    const initPlayer = async () => {
      await loadYTApi();
      if (destroyed || !playerDivRef.current) return;

      const state = getCurrentPlaybackState();
      const startSeconds = state.currentVideo.isLive ? 0 : Math.floor(state.elapsedInVideo);

      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: state.currentVideo.youtubeId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          cc_load_policy: 0,
          enablejsapi: 1,
          start: startSeconds,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setIsLoading(false);
            // Apply crop styles to the generated iframe
            try {
              const iframe = playerRef.current?.getIframe();
              if (iframe) {
                iframe.style.position = 'absolute';
                iframe.style.top = '-60px';
                iframe.style.left = '-10px';
                iframe.style.width = 'calc(100% + 20px)';
                iframe.style.height = 'calc(100% + 120px)';
                iframe.style.pointerEvents = 'none';
                iframe.style.border = 'none';
              }
            } catch { /* ignore */ }
            // Ensure muted state
            if (isMutedRef.current) {
              playerRef.current?.mute();
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (destroyed) return;
            // If video ended or errored, check sync
            if (event.data === window.YT.PlayerState.ENDED || event.data === window.YT.PlayerState.PAUSED) {
              // Resume playing if paused unexpectedly
              setTimeout(() => {
                if (!destroyed && playerRef.current) {
                  try { playerRef.current.playVideo(); } catch { /* ignore */ }
                }
              }, 500);
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsLoading(false);
            }
            if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsLoading(true);
            }
          },
          onError: () => {
            if (destroyed) return;
            // On error, try to move to next video
            setIsLoading(false);
          },
        },
      });
    };

    initPlayer();

    return () => {
      destroyed = true;
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync tick — checks video changes and updates progress
  const tick = useCallback(() => {
    const state = getCurrentPlaybackState();
    setProgress(state.progress);
    setElapsedInVideo(state.elapsedInVideo);

    if (state.currentVideo.id !== lastVideoIdRef.current) {
      lastVideoIdRef.current = state.currentVideo.id;
      setCurrentVideo(state.currentVideo);
      setIsLoading(true);
      onVideoChange?.(state.currentVideo);

      // Load new video in existing player — no iframe reload!
      if (playerRef.current) {
        try {
          const startSeconds = state.currentVideo.isLive ? 0 : Math.floor(state.elapsedInVideo);
          playerRef.current.loadVideoById({
            videoId: state.currentVideo.youtubeId,
            startSeconds,
          });
          // Restore mute state after loading new video
          setTimeout(() => {
            if (playerRef.current) {
              if (isMutedRef.current) {
                playerRef.current.mute();
              } else {
                playerRef.current.unMute();
              }
            }
          }, 500);
        } catch { /* ignore */ }
      }
    }
  }, [onVideoChange]);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Mute toggle — uses YT Player API, no reload!
  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    try {
      if (newMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        // CRITICAL: resume playing after unmute (browser autoplay policy may have paused it)
        setTimeout(() => {
          try {
            playerRef.current?.playVideo();
          } catch { /* ignore */ }
        }, 100);
      }
    } catch { /* ignore */ }
  }, [isMuted]);

  // Controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3500);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const isLiveVideo = currentVideo.isLive === true;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Overlay position
  const getOverlayStyle = (): React.CSSProperties => {
    const bottomOff = overlay.position.includes('bottom') ? overlay.marginY + 52 : overlay.marginY;
    return {
      ...(overlay.position.includes('top') ? { top: bottomOff } : { bottom: bottomOff }),
      ...(overlay.position.includes('left') ? { left: overlay.marginX } : { right: overlay.marginX }),
      opacity: overlay.opacity / 100,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden group ${embed ? '' : 'rounded-2xl'}`}
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* ===== YOUTUBE PLAYER — CSS CROPPED TO HIDE ALL YOUTUBE UI ===== */}
      <div className="absolute inset-0 overflow-hidden" id="yt-crop-container">
        <div
          ref={playerDivRef}
          id="yt-player-root"
          className="absolute pointer-events-none"
          style={{
            top: '-60px',
            left: '-10px',
            width: 'calc(100% + 20px)',
            height: 'calc(100% + 120px)',
          }}
        />
        <style>{`
          #yt-crop-container iframe {
            position: absolute !important;
            top: -60px !important;
            left: -10px !important;
            width: calc(100% + 20px) !important;
            height: calc(100% + 120px) !important;
            pointer-events: none !important;
            border: none !important;
          }
        `}</style>
      </div>

      {/* Transparent interaction blocker — covers entire player */}
      <div className="absolute inset-0 z-10" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-brand/30 rounded-full" />
              <div className="w-14 h-14 border-4 border-brand border-t-transparent rounded-full animate-spin absolute inset-0" />
            </div>
            <p className="text-gray-400 text-sm font-medium">Sintonizzazione in corso...</p>
          </div>
        </div>
      )}

      {/* ===== CHANNEL OVERLAY / LOGO ===== */}
      {overlay.enabled && (overlay.imageUrl || overlay.text) && (
        <div className="absolute z-30 pointer-events-none transition-all duration-500" style={getOverlayStyle()}>
          {overlay.imageUrl && !overlayImgError ? (
            <img
              src={overlay.imageUrl}
              alt="Channel Logo"
              style={{ width: overlay.width }}
              className="object-contain drop-shadow-2xl"
              onError={() => setOverlayImgError(true)}
            />
          ) : overlay.text ? (
            <div
              className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 text-white font-black drop-shadow-2xl whitespace-nowrap"
              style={{ fontSize: Math.max(10, overlay.width / 5) }}
            >
              {overlay.text}
            </div>
          ) : null}
        </div>
      )}

      {/* ===== TOP OVERLAY ===== */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLiveVideo ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-md shadow-lg shadow-red-600/40 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-white text-[11px] font-black uppercase tracking-wider">LIVE</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-md">
                  <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /></svg>
                  <span className="text-red-300 text-[10px] font-bold uppercase tracking-wider">In diretta</span>
                </div>
              </div>
            ) : (
              <LiveBadge size={embed ? 'sm' : 'md'} />
            )}
            {!embed && (
              <span className="text-white font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-[400px] drop-shadow-lg">
                {currentVideo.title}
              </span>
            )}
          </div>
          {!embed && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/10 backdrop-blur-sm text-white/80">
                Cestistica TV 24
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===== BOTTOM CONTROLS ===== */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/15 cursor-pointer group/progress">
          {isLiveVideo ? (
            <div className="h-full w-full bg-red-500 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-400 rounded-full shadow-lg shadow-red-500/50 animate-pulse" />
            </div>
          ) : (
            <div
              className="h-full bg-gradient-to-r from-brand to-green-400 transition-all duration-1000 ease-linear relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="px-3 md:px-4 py-2.5 md:py-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors p-1 relative z-30 pointer-events-auto"
              title={isMuted ? 'Attiva audio' : 'Disattiva audio'}
            >
              {isMuted ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            {/* Volume slider when unmuted */}
            {!isMuted && (
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="100"
                className="w-16 md:w-20 h-1 accent-brand cursor-pointer relative z-30 pointer-events-auto"
                onChange={(e) => {
                  try {
                    playerRef.current?.setVolume(Number(e.target.value));
                  } catch { /* ignore */ }
                }}
              />
            )}

            {/* Time */}
            {isLiveVideo ? (
              <span className="text-red-400 text-xs md:text-sm font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                DIRETTA
              </span>
            ) : (
              <span className="text-white/60 text-xs md:text-sm font-mono tabular-nums">
                {formatTime(elapsedInVideo)} / {formatTime(currentVideo.duration)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white transition-colors p-1 relative z-30 pointer-events-auto"
              title="Schermo intero"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Unmute CTA overlay */}
      {isMuted && showControls && (
        <button
          onClick={toggleMute}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          style={{ zIndex: 25 }}
        >
          <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 hover:bg-black/80 transition-all hover:scale-105 shadow-2xl pointer-events-auto">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            <span className="text-white text-sm font-semibold">Tocca per attivare l'audio</span>
          </div>
        </button>
      )}
    </div>
  );
}
