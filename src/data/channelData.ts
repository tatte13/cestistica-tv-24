// ============================================================
// CESTISTICA TV 24 — SYNC ENGINE & DATA RE-EXPORTS
// ============================================================
import {
  getPlaylist,
  getChannelConfig,
  getOverlayConfig,
  type VideoItem,
  type ChannelConfig,
  type OverlayConfig,
} from './store';

// Re-export types and getters
export type { VideoItem, ChannelConfig, OverlayConfig };
export { getPlaylist, getChannelConfig, getOverlayConfig };

// ============================================================
// CATEGORY COLORS & LABELS
// ============================================================
export const categoryColors: Record<VideoItem['category'], string> = {
  partita: '#e53e3e',
  highlights: '#22c55e',
  intervista: '#38a169',
  allenamento: '#3182ce',
  speciale: '#9f7aea',
  archivio: '#d69e2e',
  live: '#ef4444',
};

export const categoryLabels: Record<VideoItem['category'], string> = {
  partita: 'Partita',
  highlights: 'Highlights',
  intervista: 'Intervista',
  allenamento: 'Allenamento',
  speciale: 'Speciale',
  archivio: 'Archivio',
  live: '🔴 Live',
};

// ============================================================
// SYNC ENGINE — Calcola cosa va in onda in questo momento
// ============================================================
export function getTotalPlaylistDuration(): number {
  const pl = getPlaylist();
  return pl.reduce((sum, v) => sum + v.duration, 0);
}

export function getCurrentPlaybackState(): {
  currentVideo: VideoItem;
  currentIndex: number;
  elapsedInVideo: number;
  nextVideo: VideoItem;
  progress: number;
} {
  const pl = getPlaylist();
  const totalDuration = pl.reduce((sum, v) => sum + v.duration, 0);

  if (totalDuration === 0 || pl.length === 0) {
    const fallback: VideoItem = {
      id: 'empty',
      title: 'Nessun video in playlist',
      youtubeId: 'dQw4w9WgXcQ',
      duration: 300,
      category: 'speciale',
      description: 'Aggiungi video dal pannello admin',
    };
    return {
      currentVideo: fallback,
      currentIndex: 0,
      elapsedInVideo: 0,
      nextVideo: fallback,
      progress: 0,
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const positionInLoop = nowSeconds % totalDuration;

  let accumulated = 0;
  for (let i = 0; i < pl.length; i++) {
    if (accumulated + pl[i].duration > positionInLoop) {
      const elapsed = positionInLoop - accumulated;
      const nextIndex = (i + 1) % pl.length;
      return {
        currentVideo: pl[i],
        currentIndex: i,
        elapsedInVideo: elapsed,
        nextVideo: pl[nextIndex],
        progress: (elapsed / pl[i].duration) * 100,
      };
    }
    accumulated += pl[i].duration;
  }

  return {
    currentVideo: pl[0],
    currentIndex: 0,
    elapsedInVideo: 0,
    nextVideo: pl[1] || pl[0],
    progress: 0,
  };
}

// ============================================================
// SCHEDULE GENERATOR
// ============================================================
export function getSchedule(hoursAhead: number = 12): {
  video: VideoItem;
  startTime: Date;
  endTime: Date;
}[] {
  const pl = getPlaylist();
  const totalDuration = pl.reduce((sum, v) => sum + v.duration, 0);
  if (totalDuration === 0 || pl.length === 0) return [];

  const nowSeconds = Math.floor(Date.now() / 1000);
  const positionInLoop = nowSeconds % totalDuration;

  let accumulated = 0;
  let startIndex = 0;
  let startOffset = 0;
  for (let i = 0; i < pl.length; i++) {
    if (accumulated + pl[i].duration > positionInLoop) {
      startIndex = i;
      startOffset = positionInLoop - accumulated;
      break;
    }
    accumulated += pl[i].duration;
  }

  const schedule: { video: VideoItem; startTime: Date; endTime: Date }[] = [];
  const endTime = nowSeconds + hoursAhead * 3600;
  let currentTime = nowSeconds - startOffset;
  let idx = startIndex;

  while (currentTime < endTime) {
    const video = pl[idx % pl.length];
    const start = new Date(currentTime * 1000);
    const end = new Date((currentTime + video.duration) * 1000);
    schedule.push({ video, startTime: start, endTime: end });
    currentTime += video.duration;
    idx++;
  }

  return schedule;
}
