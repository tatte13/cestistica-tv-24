// ============================================================
// CESTISTICA TV 24 — SYNC ENGINE & DATA RE-EXPORTS
// ============================================================
import {
  getPlaylist,
  getChannelConfig,
  getOverlayConfig,
  markLiveStreamEnded,
  isLiveStreamEnded,
  type VideoItem,
  type ChannelConfig,
  type OverlayConfig,
} from './store';

// Re-export types and getters
export type { VideoItem, ChannelConfig, OverlayConfig };
export { getPlaylist, getChannelConfig, getOverlayConfig, markLiveStreamEnded, isLiveStreamEnded };

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

const EMPTY_FALLBACK_VIDEO: VideoItem = {
  id: 'empty',
  title: 'Nessun video in playlist',
  youtubeId: 'dQw4w9WgXcQ',
  duration: 300,
  category: 'speciale',
  description: 'Aggiungi video dal pannello admin',
};

// I video con un orario programmato (palinsesto manuale) escono dalla
// rotazione automatica "a ciclo continuo" e vengono gestiti separatamente:
// vanno in onda SOLO al loro orario esatto.
function getRotationPlaylist(pl: VideoItem[]): VideoItem[] {
  return pl.filter((v) => !v.scheduledStart);
}

function getScheduledWindow(video: VideoItem): { start: number; end: number } | null {
  if (!video.scheduledStart) return null;
  const start = new Date(video.scheduledStart).getTime();
  if (isNaN(start)) return null;
  return { start, end: start + video.duration * 1000 };
}

// Trova, se esiste, il video con orario programmato che dovrebbe essere
// in onda in questo momento esatto (interrompendo la rotazione automatica).
// In caso di sovrapposizioni, vince quello iniziato più di recente.
// Per le live, uno slot già segnalato come terminato dal player non è
// più considerato attivo, anche se non ha ancora raggiunto la durata massima.
function getActiveScheduledVideo(nowMs: number): { video: VideoItem; start: number; end: number } | null {
  const candidates = getPlaylist()
    .filter((v) => v.scheduledStart)
    .map((v) => ({ video: v, window: getScheduledWindow(v) }))
    .filter((x): x is { video: VideoItem; window: { start: number; end: number } } => x.window !== null)
    .filter(({ video, window }) => {
      if (nowMs < window.start || nowMs > window.end) return false;
      if (video.isLive && video.scheduledStart && isLiveStreamEnded(video.id, video.scheduledStart)) return false;
      return true;
    })
    .sort((a, b) => b.window.start - a.window.start);

  if (candidates.length === 0) return null;
  const { video, window } = candidates[0];
  return { video, start: window.start, end: window.end };
}

// Calcola in quale video della rotazione automatica ci troviamo in un
// dato istante, e da quanto tempo è iniziato (offset in ms).
function rotationPositionAt(pl: VideoItem[], totalDuration: number, atMs: number): { index: number; offsetMs: number } {
  if (totalDuration === 0 || pl.length === 0) return { index: 0, offsetMs: 0 };
  const atSeconds = Math.floor(atMs / 1000);
  const positionInLoop = ((atSeconds % totalDuration) + totalDuration) % totalDuration;
  let accumulated = 0;
  for (let i = 0; i < pl.length; i++) {
    if (accumulated + pl[i].duration > positionInLoop) {
      return { index: i, offsetMs: (positionInLoop - accumulated) * 1000 };
    }
    accumulated += pl[i].duration;
  }
  return { index: 0, offsetMs: 0 };
}

function getRotationPlaybackState(pl: VideoItem[], nowMs: number): {
  currentVideo: VideoItem;
  currentIndex: number;
  elapsedInVideo: number;
  nextVideo: VideoItem;
  progress: number;
} {
  const totalDuration = pl.reduce((sum, v) => sum + v.duration, 0);

  if (totalDuration === 0 || pl.length === 0) {
    return {
      currentVideo: EMPTY_FALLBACK_VIDEO,
      currentIndex: 0,
      elapsedInVideo: 0,
      nextVideo: EMPTY_FALLBACK_VIDEO,
      progress: 0,
    };
  }

  const { index, offsetMs } = rotationPositionAt(pl, totalDuration, nowMs);
  const nextIndex = (index + 1) % pl.length;
  const elapsed = offsetMs / 1000;
  return {
    currentVideo: pl[index],
    currentIndex: index,
    elapsedInVideo: elapsed,
    nextVideo: pl[nextIndex],
    progress: (elapsed / pl[index].duration) * 100,
  };
}

export function getCurrentPlaybackState(): {
  currentVideo: VideoItem;
  currentIndex: number;
  elapsedInVideo: number;
  nextVideo: VideoItem;
  progress: number;
} {
  const nowMs = Date.now();
  const pl = getPlaylist();

  // 1. Uno slot programmato manualmente (live o normale) ha sempre la
  //    priorità e interrompe la rotazione automatica.
  const active = getActiveScheduledVideo(nowMs);
  if (active) {
    const elapsed = (nowMs - active.start) / 1000;
    const rotationState = getRotationPlaybackState(getRotationPlaylist(pl), nowMs);
    return {
      currentVideo: active.video,
      currentIndex: 0,
      elapsedInVideo: elapsed,
      nextVideo: rotationState.currentVideo,
      progress: Math.min(100, (elapsed / active.video.duration) * 100),
    };
  }

  // 2. Nessuno slot attivo: rotazione automatica normale, escludendo
  //    i video che hanno un proprio orario programmato.
  return getRotationPlaybackState(getRotationPlaylist(pl), nowMs);
}

// ============================================================
// SCHEDULE GENERATOR — Palinsesto: unisce gli slot programmati
// manualmente con la rotazione automatica che riempie gli spazi vuoti
// ============================================================
export function getSchedule(hoursAhead: number = 12): {
  video: VideoItem;
  startTime: Date;
  endTime: Date;
}[] {
  const nowMs = Date.now();
  const windowEndMs = nowMs + hoursAhead * 3600 * 1000;

  const rotationPlaylist = getRotationPlaylist(getPlaylist());
  const totalDuration = rotationPlaylist.reduce((sum, v) => sum + v.duration, 0);

  const manualSlots = getPlaylist()
    .filter((v) => v.scheduledStart)
    .map((v) => {
      const w = getScheduledWindow(v);
      return w ? { video: v, start: w.start, end: w.end } : null;
    })
    .filter((x): x is { video: VideoItem; start: number; end: number } => x !== null)
    .filter((x) => x.end > nowMs && x.start < windowEndMs)
    .sort((a, b) => a.start - b.start);

  const schedule: { video: VideoItem; startTime: Date; endTime: Date }[] = [];
  let cursor = nowMs;
  let manualIdx = 0;
  let isFirstEntry = true;

  while (cursor < windowEndMs) {
    const nextManual = manualSlots[manualIdx];

    // Uno slot manuale è già iniziato (o inizia proprio ora): va in onda subito.
    if (nextManual && nextManual.start <= cursor) {
      schedule.push({ video: nextManual.video, startTime: new Date(nextManual.start), endTime: new Date(nextManual.end) });
      cursor = nextManual.end;
      manualIdx++;
      isFirstEntry = false;
      continue;
    }

    if (totalDuration === 0 || rotationPlaylist.length === 0) {
      // Nessun contenuto in rotazione per riempire il vuoto: salta al prossimo slot manuale, se c'è.
      if (nextManual) { cursor = nextManual.start; isFirstEntry = false; continue; }
      break;
    }

    const { index, offsetMs } = rotationPositionAt(rotationPlaylist, totalDuration, cursor);
    const video = rotationPlaylist[index];
    // Per la primissima voce mostriamo l'orario di inizio reale del video
    // (che può essere nel passato, se siamo a metà della sua messa in onda).
    const trueStart = isFirstEntry ? cursor - offsetMs : cursor;
    const naturalEnd = trueStart + video.duration * 1000;
    const slotEnd = nextManual && nextManual.start < naturalEnd ? nextManual.start : naturalEnd;

    schedule.push({ video, startTime: new Date(trueStart), endTime: new Date(slotEnd) });
    cursor = slotEnd;
    isFirstEntry = false;
  }

  return schedule;
}
