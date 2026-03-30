// ============================================================
// CESTISTICA TV 24 — DATA STORE (localStorage)
// ============================================================

export interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  duration: number;
  category: 'partita' | 'highlights' | 'intervista' | 'allenamento' | 'speciale' | 'archivio' | 'live';
  description: string;
  thumbnail?: string;
  isLive?: boolean;
}

export interface ChannelConfig {
  name: string;
  tagline: string;
  logo?: string;
  tickerMessages: string[];
}

export interface OverlayConfig {
  enabled: boolean;
  imageUrl: string;
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width: number;
  opacity: number;
  marginX: number;
  marginY: number;
}

// ============================================================
// STORAGE KEYS
// ============================================================
const KEYS = {
  playlist: 'ctv24_playlist',
  config: 'ctv24_config',
  overlay: 'ctv24_overlay',
};

// ============================================================
// DEFAULTS
// ============================================================
export const defaultPlaylist: VideoItem[] = [
  {
    id: 'demo-1',
    title: 'Basket Highlights — Top 10 Plays',
    youtubeId: 'ZVEqB9NAhcA',
    duration: 600,
    category: 'highlights',
    description: 'Le migliori giocate della stagione',
  },
  {
    id: 'demo-2',
    title: 'Partita Completa — Cestistica vs Rivali',
    youtubeId: 'V-QVliMByiE',
    duration: 480,
    category: 'partita',
    description: 'Rivivi la sfida più emozionante della stagione',
  },
  {
    id: 'demo-3',
    title: 'Intervista Post-Partita — Coach',
    youtubeId: '6GOuseekaFo',
    duration: 360,
    category: 'intervista',
    description: 'Le parole del mister dopo la vittoria',
  },
  {
    id: 'demo-4',
    title: 'Sessione di Allenamento',
    youtubeId: 'ljqra3BcqWM',
    duration: 420,
    category: 'allenamento',
    description: 'Dentro la palestra con la squadra',
  },
  {
    id: 'demo-5',
    title: 'Speciale — Storia del Club',
    youtubeId: 'LXb3EKWsInQ',
    duration: 540,
    category: 'speciale',
    description: 'Un viaggio nella storia della Cestistica',
  },
  {
    id: 'demo-6',
    title: 'Archivio — Finale 2019',
    youtubeId: 'UBMk30rjy0o',
    duration: 720,
    category: 'archivio',
    description: 'La storica finale del campionato 2019',
  },
];

export const defaultConfig: ChannelConfig = {
  name: 'Cestistica TV 24',
  tagline: 'Il tuo canale di basket, sempre in diretta',
  tickerMessages: [
    '🏀 Cestistica TV 24 — Trasmissione continua 24 ore su 24',
    '📺 Segui tutte le partite, gli highlights e le interviste',
    '⭐ Iscriviti e condividi il canale con i tuoi amici!',
    '🔴 LIVE — Stai guardando Cestistica TV 24',
    '📱 Guardaci ovunque: smartphone, tablet, PC e Smart TV',
  ],
};

export const defaultOverlay: OverlayConfig = {
  enabled: false,
  imageUrl: '',
  text: '',
  position: 'top-right',
  width: 80,
  opacity: 80,
  marginX: 16,
  marginY: 16,
};

// ============================================================
// GETTERS
// ============================================================
export function getPlaylist(): VideoItem[] {
  try {
    const stored = localStorage.getItem(KEYS.playlist);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [...defaultPlaylist];
}

export function getChannelConfig(): ChannelConfig {
  try {
    const stored = localStorage.getItem(KEYS.config);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { ...defaultConfig };
}

export function getOverlayConfig(): OverlayConfig {
  try {
    const stored = localStorage.getItem(KEYS.overlay);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { ...defaultOverlay };
}

// ============================================================
// SETTERS
// ============================================================
export function savePlaylist(items: VideoItem[]): void {
  localStorage.setItem(KEYS.playlist, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('ctv24-data-change'));
}

export function saveChannelConfig(config: ChannelConfig): void {
  localStorage.setItem(KEYS.config, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('ctv24-data-change'));
}

export function saveOverlayConfig(config: OverlayConfig): void {
  localStorage.setItem(KEYS.overlay, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('ctv24-data-change'));
}

// ============================================================
// AUTH
// ============================================================
const ADMIN_USER = 'tatte13';
const ADMIN_PASS = 'Matteo13';

export function checkAuth(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem('ctv24_admin_auth') === 'true';
}

export function setAuthenticated(value: boolean): void {
  if (value) {
    sessionStorage.setItem('ctv24_admin_auth', 'true');
  } else {
    sessionStorage.removeItem('ctv24_admin_auth');
  }
}

// ============================================================
// HELPERS
// ============================================================
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  // Direct playlist ID — PL, OLAK, RD, FL, UU, LL and other prefixes
  if (/^[A-Z]{2}[a-zA-Z0-9_-]{8,}$/.test(trimmed)) return trimmed;
  // URL with list= parameter
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match) return match[1];
  }
  return null;
}

export function detectLiveUrl(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  return trimmed.includes('/live/') || trimmed.includes('live');
}

export function parseDuration(input: string): number | null {
  const hms = input.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) return parseInt(hms[1]) * 3600 + parseInt(hms[2]) * 60 + parseInt(hms[3]);
  const ms = input.match(/^(\d+):(\d{2})$/);
  if (ms) return parseInt(ms[1]) * 60 + parseInt(ms[2]);
  const num = parseInt(input);
  if (!isNaN(num) && num > 0) return num;
  return null;
}

export function formatDurationDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return `vid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const categoryOptions: { value: VideoItem['category']; label: string; color: string }[] = [
  { value: 'partita', label: 'Partita', color: '#e53e3e' },
  { value: 'highlights', label: 'Highlights', color: '#22c55e' },
  { value: 'intervista', label: 'Intervista', color: '#38a169' },
  { value: 'allenamento', label: 'Allenamento', color: '#3182ce' },
  { value: 'speciale', label: 'Speciale', color: '#9f7aea' },
  { value: 'archivio', label: 'Archivio', color: '#d69e2e' },
  { value: 'live', label: '🔴 Live Stream', color: '#ef4444' },
];
