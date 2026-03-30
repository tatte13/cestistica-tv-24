import { useState, useEffect } from 'react';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseEnabled,
  setFirebaseEnabled,
  initFirebase,
  pullFromFirestore,
  pushToFirestore,
  startRealtimeSync,
  stopRealtimeSync,
  testConnection,
  pushBroadcastToFirestore,
  type FirebaseConfig,
  type FirebaseSyncStatus,
} from '../firebase';
import {
  getPlaylist, savePlaylist,
  getOverlayConfig, saveOverlayConfig,
  getChannelConfig, saveChannelConfig,
  getBroadcastState, saveBroadcastState, setLiveMode, setReplicaMode, forceVideo, clearForcedVideo,
  checkAuth, isAuthenticated, setAuthenticated,
  extractYouTubeId, extractPlaylistId, parseDuration, formatDurationDisplay, generateId,
  categoryOptions,
  type VideoItem, type OverlayConfig, type ChannelConfig, type BroadcastState,
} from '../data/store';

// ============================================================
// LOGIN
// ============================================================
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (checkAuth(username, password)) {
        setAuthenticated(true);
        onLogin();
      } else {
        setError('Credenziali non valide. Riprova.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-brand to-green-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-brand/30">🏀</div>
          <h1 className="text-3xl font-black text-white">Cestistica TV 24</h1>
          <p className="text-gray-500 mt-2">Pannello di Amministrazione</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface-card rounded-2xl p-8 border border-white/10 shadow-2xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface rounded-xl pl-4 pr-4 py-3.5 text-white border border-white/10 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all"
              placeholder="Inserisci username" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface rounded-xl pl-4 pr-12 py-3.5 text-white border border-white/10 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all"
                placeholder="Inserisci password" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading || !username || !password}
            className="w-full bg-gradient-to-r from-brand to-green-600 hover:from-brand-dark hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand/20">
            {loading ? '⏳ Accesso in corso...' : '🔐 Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN ADMIN PAGE
// ============================================================
export default function AdminPage({ onClose }: { onClose: () => void }) {
  const [authed, setAuthed] = useState(isAuthenticated());
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminPanel onClose={onClose} />;
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'regia' | 'videos' | 'overlay' | 'share' | 'settings' | 'firebase'>('regia');
  const [playlist, setPlaylistState] = useState(getPlaylist());
  const [overlay, setOverlayState] = useState(getOverlayConfig());
  const [config, setConfigState] = useState(getChannelConfig());
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSavePlaylist = (p: VideoItem[]) => { savePlaylist(p); setPlaylistState(p); showToast('✅ Playlist salvata!'); };
  const handleSaveOverlay = (o: OverlayConfig) => { saveOverlayConfig(o); setOverlayState(o); showToast('✅ Overlay salvato!'); };
  const handleSaveConfig = (c: ChannelConfig) => { saveChannelConfig(c); setConfigState(c); showToast('✅ Impostazioni salvate!'); };
  const handleLogout = () => { setAuthenticated(false); onClose(); };

  const tabs = [
    { key: 'regia' as const, icon: '🎬', label: 'Regia' },
    { key: 'videos' as const, icon: '📹', label: 'Video' },
    { key: 'overlay' as const, icon: '🖼️', label: 'Overlay' },
    { key: 'share' as const, icon: '📡', label: 'Condividi' },
    { key: 'settings' as const, icon: '⚙️', label: 'Impostazioni' },
    { key: 'firebase' as const, icon: '🔥', label: 'Firebase' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-alt/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand to-green-600 rounded-lg flex items-center justify-center text-lg">🏀</div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Pannello Admin</h1>
                <p className="text-gray-500 text-xs hidden sm:block">Gestione Cestistica TV 24</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10">
                Logout
              </button>
              <button onClick={onClose} className="bg-surface-hover hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                👁️ <span className="hidden sm:inline">Torna al sito</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
        <div className="flex gap-1 bg-surface-card rounded-xl p-1.5 w-fit border border-white/5 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                tab === t.key ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 pb-16">
          {tab === 'regia' && <RegiaTab playlist={playlist} />}
          {tab === 'videos' && <VideosTab playlist={playlist} onSave={handleSavePlaylist} />}
          {tab === 'overlay' && <OverlayTab overlay={overlay} onSave={handleSaveOverlay} />}
          {tab === 'share' && <ShareTab playlist={playlist} />}
          {tab === 'settings' && <SettingsTab config={config} onSave={handleSaveConfig} />}
          {tab === 'firebase' && <FirebaseTab />}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-card border border-green-500/30 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2">
          <span className="text-lg">{toast.slice(0, 2)}</span>
          <span className="text-sm font-medium">{toast.slice(2)}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VIDEOS TAB
// ============================================================
function VideosTab({ playlist, onSave }: { playlist: VideoItem[]; onSave: (p: VideoItem[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showPlaylistImport, setShowPlaylistImport] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ youtubeUrl: '', title: '', duration: '', category: 'highlights' as VideoItem['category'], description: '', isLive: false });
  const [formError, setFormError] = useState('');

  // Playlist import state
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState<{ id: string; title: string; duration: number; selected: boolean }[]>([]);

  // Bulk import state
  const [bulkUrls, setBulkUrls] = useState('');

  const resetForm = () => {
    setForm({ youtubeUrl: '', title: '', duration: '', category: 'highlights', description: '', isLive: false });
    setFormError('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (video: VideoItem) => {
    setForm({
      youtubeUrl: video.youtubeId,
      title: video.title,
      duration: formatDurationDisplay(video.duration),
      category: video.category,
      description: video.description,
      isLive: video.isLive || false,
    });
    setEditingId(video.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    setFormError('');
    const youtubeId = extractYouTubeId(form.youtubeUrl);
    if (!youtubeId) { setFormError('URL o ID YouTube non valido'); return; }
    if (!form.title.trim()) { setFormError('Inserisci un titolo'); return; }
    const duration = form.isLive ? (parseDuration(form.duration) || 3600) : parseDuration(form.duration);
    if (!duration) { setFormError('Durata non valida (usa MM:SS o HH:MM:SS o secondi)'); return; }

    const videoData: VideoItem = {
      id: editingId || generateId(),
      title: form.title.trim(),
      youtubeId,
      duration,
      category: form.isLive ? 'live' : form.category,
      description: form.description.trim(),
      isLive: form.isLive,
    };

    if (editingId) {
      onSave(playlist.map((v) => (v.id === editingId ? videoData : v)));
    } else {
      onSave([...playlist, videoData]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Eliminare questo video?')) onSave(playlist.filter((v) => v.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const p = [...playlist];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= p.length) return;
    [p[index], p[target]] = [p[target], p[index]];
    onSave(p);
  };

  // ======= PLAYLIST IMPORT =======
  const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.in.projectsegfau.lt',
    'https://piped-api.garudalinux.org',
  ];

  const INVIDIOUS_INSTANCES = [
    'https://invidious.snopyta.org',
    'https://vid.puffyan.us',
    'https://invidious.kavin.rocks',
    'https://invidious.nerdvpn.de',
    'https://inv.nadeko.net',
  ];

  const fetchWithTimeout = (url: string, ms = 7000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  const fetchPlaylist = async () => {
    const plId = extractPlaylistId(playlistUrl);
    if (!plId) { setPlaylistError('URL playlist non valido. Usa un link come: youtube.com/playlist?list=PLxxx'); return; }
    setPlaylistLoading(true);
    setPlaylistError('');
    setPlaylistVideos([]);

    // Try Piped instances first
    for (const instance of PIPED_INSTANCES) {
      try {
        const res = await fetchWithTimeout(`${instance}/playlists/${plId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.relatedStreams && data.relatedStreams.length > 0) {
          const videos = data.relatedStreams
            .map((v: { url?: string; title?: string; duration?: number }) => {
              const urlMatch = v.url?.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
              return {
                id: urlMatch?.[1] || '',
                title: v.title || 'Video senza titolo',
                duration: v.duration || 300,
                selected: true,
              };
            })
            .filter((v: { id: string }) => v.id.length === 11);
          if (videos.length > 0) {
            setPlaylistVideos(videos);
            setPlaylistLoading(false);
            return;
          }
        }
      } catch { /* try next */ }
    }

    // Fallback: try Invidious instances
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const res = await fetchWithTimeout(`${instance}/api/v1/playlists/${plId}?fields=videos`);
        if (!res.ok) continue;
        const data = await res.json();
        const items: { videoId?: string; title?: string; lengthSeconds?: number }[] = data.videos ?? [];
        if (items.length > 0) {
          const videos = items
            .map((v) => ({
              id: v.videoId || '',
              title: v.title || 'Video senza titolo',
              duration: v.lengthSeconds || 300,
              selected: true,
            }))
            .filter((v) => v.id.length === 11);
          if (videos.length > 0) {
            setPlaylistVideos(videos);
            setPlaylistLoading(false);
            return;
          }
        }
      } catch { /* try next */ }
    }

    setPlaylistError('Impossibile caricare la playlist. Tutti i server sono irraggiungibili. Puoi usare "Importa in blocco" e incollare i link dei video uno per riga.');
    setPlaylistLoading(false);
  };

  const importSelectedVideos = () => {
    const newVideos: VideoItem[] = playlistVideos
      .filter(v => v.selected)
      .map(v => ({
        id: generateId(),
        title: v.title,
        youtubeId: v.id,
        duration: v.duration,
        category: 'highlights' as const,
        description: '',
      }));
    if (newVideos.length > 0) {
      onSave([...playlist, ...newVideos]);
      setShowPlaylistImport(false);
      setPlaylistVideos([]);
      setPlaylistUrl('');
    }
  };

  // ======= BULK IMPORT =======
  const handleBulkImport = () => {
    const lines = bulkUrls.split('\n').map(l => l.trim()).filter(Boolean);
    const newVideos: VideoItem[] = [];
    const errors: string[] = [];

    lines.forEach((line, i) => {
      const ytId = extractYouTubeId(line);
      if (ytId) {
        newVideos.push({
          id: generateId(),
          title: `Video ${playlist.length + newVideos.length + 1}`,
          youtubeId: ytId,
          duration: 600, // default 10 min, user can edit later
          category: 'highlights',
          description: '',
        });
      } else {
        errors.push(`Riga ${i + 1}: URL non valido`);
      }
    });

    if (newVideos.length > 0) {
      onSave([...playlist, ...newVideos]);
      setShowBulkImport(false);
      setBulkUrls('');
    }
    if (errors.length > 0) {
      setFormError(`Importati ${newVideos.length} video. Errori: ${errors.join(', ')}`);
    }
  };

  const totalDuration = playlist.reduce((s, v) => s + v.duration, 0);
  const detectedId = form.youtubeUrl ? extractYouTubeId(form.youtubeUrl) : null;
  const liveCount = playlist.filter(v => v.isLive).length;
  const vodCount = playlist.length - liveCount;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { value: playlist.length.toString(), label: 'Totale', color: 'text-brand' },
          { value: vodCount.toString(), label: 'Video', color: 'text-brand' },
          { value: liveCount.toString(), label: 'Live', color: 'text-red-400' },
          { value: `${(totalDuration / 3600).toFixed(1)}h`, label: 'Durata', color: 'text-brand' },
          { value: '24/7', label: 'In onda', color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-card rounded-xl p-4 text-center border border-white/5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {!showForm && !showPlaylistImport && !showBulkImport && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-gradient-to-r from-brand to-green-600 hover:from-brand-dark hover:to-green-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center gap-2 text-sm">
            ➕ Aggiungi Video
          </button>
          <button onClick={() => { resetForm(); setForm(f => ({ ...f, isLive: true, category: 'live', duration: '1:00:00' })); setShowForm(true); }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 text-sm">
            🔴 Aggiungi Live
          </button>
          <button onClick={() => setShowPlaylistImport(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 text-sm">
            📋 Importa Playlist YT
          </button>
          <button onClick={() => setShowBulkImport(true)}
            className="bg-surface-card hover:bg-surface-hover text-gray-300 font-bold px-5 py-3 rounded-xl transition-all border border-white/10 flex items-center gap-2 text-sm">
            📥 Importa in blocco
          </button>
        </div>
      )}

      {/* ======= PLAYLIST IMPORT PANEL ======= */}
      {showPlaylistImport && (
        <div className="bg-surface-card rounded-2xl p-6 border-2 border-purple-500/30 space-y-4 shadow-lg shadow-purple-500/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">📋 Importa Playlist YouTube</h3>
          <p className="text-sm text-gray-400">Incolla l'URL di una playlist YouTube per importare automaticamente tutti i video.</p>

          <div className="flex gap-2">
            <input type="text" value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)}
              className="flex-1 bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-purple-500 focus:outline-none"
              placeholder="https://youtube.com/playlist?list=PLxxxxxxx" />
            <button onClick={fetchPlaylist} disabled={playlistLoading || !playlistUrl}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2 whitespace-nowrap">
              {playlistLoading ? '⏳ Caricamento...' : '🔍 Cerca'}
            </button>
          </div>

          {playlistError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{playlistError}</p>
            </div>
          )}

          {playlistVideos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300 font-medium">{playlistVideos.filter(v => v.selected).length} / {playlistVideos.length} video selezionati</p>
                <div className="flex gap-2">
                  <button onClick={() => setPlaylistVideos(playlistVideos.map(v => ({ ...v, selected: true })))}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Seleziona tutti</button>
                  <button onClick={() => setPlaylistVideos(playlistVideos.map(v => ({ ...v, selected: false })))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Deseleziona tutti</button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                {playlistVideos.map((v, i) => (
                  <div key={i} onClick={() => {
                    const updated = [...playlistVideos];
                    updated[i] = { ...v, selected: !v.selected };
                    setPlaylistVideos(updated);
                  }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      v.selected ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-surface border border-white/5 opacity-50'
                    }`}>
                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs ${
                      v.selected ? 'bg-purple-500 text-white' : 'bg-surface-hover text-gray-600'
                    }`}>{v.selected ? '✓' : ''}</div>
                    <img src={`https://img.youtube.com/vi/${v.id}/default.jpg`} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{v.title}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{formatDurationDisplay(v.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={importSelectedVideos} disabled={!playlistVideos.some(v => v.selected)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40">
                📥 Importa {playlistVideos.filter(v => v.selected).length} video
              </button>
            </div>
          )}

          <button onClick={() => { setShowPlaylistImport(false); setPlaylistVideos([]); setPlaylistUrl(''); setPlaylistError(''); }}
            className="bg-surface-hover hover:bg-white/10 text-gray-300 px-6 py-2.5 rounded-lg transition-colors text-sm">
            Annulla
          </button>
        </div>
      )}

      {/* ======= BULK IMPORT PANEL ======= */}
      {showBulkImport && (
        <div className="bg-surface-card rounded-2xl p-6 border-2 border-blue-500/30 space-y-4 shadow-lg shadow-blue-500/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">📥 Importa in blocco</h3>
          <p className="text-sm text-gray-400">Incolla uno o più URL di YouTube, uno per riga. Funziona anche con link di live e shorts.</p>
          <textarea
            value={bulkUrls}
            onChange={e => setBulkUrls(e.target.value)}
            className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
            rows={8}
            placeholder={"https://youtube.com/watch?v=abc123\nhttps://youtu.be/def456\nhttps://youtube.com/live/ghi789"}
          />
          <p className="text-xs text-gray-500">
            💡 I video importati avranno durata predefinita di 10 minuti. Potrai modificarli successivamente.
          </p>
          <div className="flex gap-3">
            <button onClick={handleBulkImport} disabled={!bulkUrls.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-40">
              📥 Importa
            </button>
            <button onClick={() => { setShowBulkImport(false); setBulkUrls(''); }}
              className="bg-surface-hover hover:bg-white/10 text-gray-300 px-6 py-2.5 rounded-lg transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* ======= ADD/EDIT SINGLE VIDEO FORM ======= */}
      {showForm && (
        <div className="bg-surface-card rounded-2xl p-6 border-2 border-brand/30 space-y-4 shadow-lg shadow-brand/5">
          <h3 className="text-lg font-bold text-white">
            {editingId ? (form.isLive ? '✏️ Modifica Live' : '✏️ Modifica Video') : (form.isLive ? '🔴 Nuova Live' : '📹 Nuovo Video')}
          </h3>

          {/* Live Toggle */}
          <div className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${form.isLive ? 'bg-red-500/10 border-red-500/40' : 'bg-surface border-white/5 hover:border-white/15'}`}
            onClick={() => setForm({ ...form, isLive: !form.isLive, category: !form.isLive ? 'live' : (form.category === 'live' ? 'highlights' : form.category), duration: !form.isLive && !form.duration ? '1:00:00' : form.duration })}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.isLive ? 'bg-red-500/30' : 'bg-surface-hover'}`}>
                  {form.isLive ? <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" /> : <span className="text-gray-500">📹</span>}
                </div>
                <div>
                  <p className={`font-bold text-sm ${form.isLive ? 'text-red-400' : 'text-gray-300'}`}>
                    {form.isLive ? '🔴 Live Stream' : 'È un Live Stream?'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {form.isLive ? 'Diretta in tempo reale' : 'Attiva per link di live YouTube'}
                  </p>
                </div>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-colors ${form.isLive ? 'bg-red-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isLive ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                {form.isLive ? 'YouTube Live URL' : 'YouTube URL o ID'} <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none"
                placeholder={form.isLive ? 'https://youtube.com/live/...' : 'https://youtube.com/watch?v=...'} />
              {detectedId && <p className="text-xs text-green-400 mt-1">✅ ID: {detectedId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Titolo <span className="text-red-400">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none"
                placeholder="Titolo del video" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                {form.isLive ? 'Durata slot' : 'Durata'} {!form.isLive && <span className="text-red-400">*</span>}
                <span className="text-gray-600 font-normal ml-1">(MM:SS o HH:MM:SS)</span>
              </label>
              <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none"
                placeholder={form.isLive ? '1:00:00' : '10:30'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoria</label>
              {form.isLive ? (
                <div className="w-full bg-surface rounded-lg px-4 py-3 text-red-400 border border-red-500/20 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> 🔴 Live Stream
                </div>
              ) : (
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as VideoItem['category'] })}
                  className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none appearance-none cursor-pointer">
                  {categoryOptions.filter(o => o.value !== 'live').map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Descrizione</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none resize-none" rows={2}
              placeholder="Breve descrizione del video" />
          </div>

          {/* Thumbnail preview */}
          {detectedId && (
            <div className={`flex items-center gap-4 rounded-xl p-3 border ${form.isLive ? 'bg-red-500/5 border-red-500/20' : 'bg-surface border-white/5'}`}>
              <div className="relative w-36 h-20 flex-shrink-0">
                <img src={`https://img.youtube.com/vi/${detectedId}/mqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                {form.isLive && (
                  <div className="absolute top-1 left-1 bg-red-600 px-1.5 py-0.5 rounded text-[8px] text-white font-black flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium">{form.isLive ? 'Anteprima Live' : 'Anteprima'}</p>
                <p className="text-xs text-gray-600 mt-1">ID: {detectedId}</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2">
              ✅ {editingId ? 'Salva Modifiche' : 'Aggiungi'}
            </button>
            <button onClick={resetForm} className="bg-surface-hover hover:bg-white/10 text-gray-300 px-6 py-2.5 rounded-lg transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          📋 Playlist ({playlist.length} elementi)
        </h3>

        {playlist.map((video, index) => {
          const cat = categoryOptions.find((c) => c.value === video.category);
          return (
            <div key={video.id} className="bg-surface-card rounded-xl p-3 md:p-4 border border-white/5 flex items-center gap-3 md:gap-4 hover:border-white/10 transition-colors group">
              {/* Order controls */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors p-0.5" title="Sposta su">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                </button>
                <span className="text-[10px] text-gray-600 text-center font-mono leading-none">{index + 1}</span>
                <button onClick={() => handleMove(index, 'down')} disabled={index === playlist.length - 1}
                  className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors p-0.5" title="Sposta giù">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
              </div>

              {/* Thumbnail */}
              <div className="relative w-20 h-12 md:w-28 md:h-16 flex-shrink-0">
                <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover rounded-lg" />
                {video.isLive && (
                  <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <div className="bg-red-600 px-1.5 py-0.5 rounded text-[8px] text-white font-black flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{video.title}</p>
                  {video.isLive && (
                    <div className="flex items-center gap-1 bg-red-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[9px] text-red-400 font-black uppercase">LIVE</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {cat && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: cat.color + '20', color: cat.color }}>{cat.label}</span>
                  )}
                  <span className="text-[10px] text-gray-500 font-mono bg-surface px-1.5 py-0.5 rounded">
                    {video.isLive ? `Slot: ${formatDurationDisplay(video.duration)}` : formatDurationDisplay(video.duration)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(video)} className="text-gray-400 hover:text-brand transition-colors p-2 rounded-lg hover:bg-brand/10" title="Modifica">
                  ✏️
                </button>
                <button onClick={() => handleDelete(video.id)} className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Elimina">
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        {playlist.length === 0 && (
          <div className="bg-surface-card rounded-2xl p-16 text-center border border-dashed border-white/10">
            <div className="text-5xl mb-4">📹</div>
            <p className="text-gray-400 text-lg font-medium">Nessun video nella playlist</p>
            <p className="text-gray-600 text-sm mt-2">Clicca "Aggiungi Video" per iniziare</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SHARE TAB — Embed + M3U + IPTV
// ============================================================
function ShareTab({ playlist }: { playlist: VideoItem[] }) {
  const [copied, setCopied] = useState('');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  const baseUrl = window.location.origin + window.location.pathname;
  const embedUrl = `${baseUrl}#/embed`;

  const sizes = { small: { w: 480, h: 270 }, medium: { w: 720, h: 405 }, large: { w: 1024, h: 576 } };
  const { w, h } = sizes[size];

  const embedCode = `<iframe src="${embedUrl}" width="${w}" height="${h}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:12px;overflow:hidden;"></iframe>`;

  const responsiveEmbed = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  // Generate M3U file
  const generateM3U = () => {
    const config = getChannelConfig();
    let m3u = '#EXTM3U\n';
    m3u += `#PLAYLIST:${config.name}\n\n`;

    // Live channel entry (embed page)
    m3u += `#EXTINF:-1 tvg-name="${config.name}" tvg-logo="" group-title="Sport",${config.name} - LIVE 24/7\n`;
    m3u += `${embedUrl}\n\n`;

    // Individual videos as YouTube URLs (VLC/Kodi/mpv can play these)
    playlist.forEach(video => {
      const label = video.isLive ? '[LIVE] ' : '';
      m3u += `#EXTINF:${video.duration},${label}${video.title}\n`;
      m3u += `https://www.youtube.com/watch?v=${video.youtubeId}\n`;
    });

    return m3u;
  };

  const downloadM3U = () => {
    const content = generateM3U();
    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cestistica-tv-24.m3u';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateM3UDataUri = () => {
    const content = generateM3U();
    return 'data:audio/x-mpegurl;base64,' + btoa(unescape(encodeURIComponent(content)));
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* === EMBED CODE === */}
      <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">🔗 Incorpora nel tuo sito</h3>
        <p className="text-sm text-gray-400">
          Copia il codice HTML e incollalo nel tuo sito web. Il player si sincronizzerà automaticamente con tutti gli spettatori!
        </p>

        {/* Size selector */}
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${size === s ? 'bg-brand text-white' : 'bg-surface-hover text-gray-400 hover:text-white'}`}>
              {s === 'small' ? 'Piccolo' : s === 'medium' ? 'Medio' : 'Grande'}
              <span className="block text-xs opacity-70">{sizes[s].w}×{sizes[s].h}</span>
            </button>
          ))}
        </div>

        {/* Fixed size embed */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 block">Dimensione fissa</label>
          <div className="bg-surface rounded-lg p-3 font-mono text-xs text-green-400 break-all border border-white/5">{embedCode}</div>
          <button onClick={() => copyText(embedCode, 'fixed')}
            className={`mt-2 w-full py-2.5 rounded-lg font-semibold text-white transition-all ${copied === 'fixed' ? 'bg-green-600' : 'bg-brand hover:bg-brand-dark'}`}>
            {copied === 'fixed' ? '✅ Copiato!' : '📋 Copia codice'}
          </button>
        </div>

        {/* Responsive embed */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 block">Responsive (adatta alla larghezza)</label>
          <div className="bg-surface rounded-lg p-3 font-mono text-xs text-blue-400 break-all border border-white/5">{responsiveEmbed}</div>
          <button onClick={() => copyText(responsiveEmbed, 'responsive')}
            className={`mt-2 w-full py-2.5 rounded-lg font-semibold text-white transition-all ${copied === 'responsive' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {copied === 'responsive' ? '✅ Copiato!' : '📋 Copia codice responsive'}
          </button>
        </div>

        {/* Direct link */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 block">Link diretto</label>
          <div className="flex gap-2">
            <input type="text" readOnly value={embedUrl} className="flex-1 bg-surface rounded-lg px-4 py-3 text-white border border-white/10 text-sm font-mono" />
            <button onClick={() => copyText(embedUrl, 'link')}
              className={`px-4 py-3 rounded-lg font-semibold text-white transition-all whitespace-nowrap ${copied === 'link' ? 'bg-green-600' : 'bg-surface-hover hover:bg-white/10'}`}>
              {copied === 'link' ? '✅' : '📋'}
            </button>
          </div>
        </div>
      </div>

      {/* === M3U / IPTV === */}
      <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">📡 M3U per IPTV Player</h3>
        <p className="text-sm text-gray-400">
          Scarica la playlist M3U per utilizzarla con player IPTV come VLC, Kodi, IPTV Smarters, TiviMate e altri.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={downloadM3U}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex flex-col items-center gap-2">
            <span className="text-2xl">📥</span>
            <span>Scarica file M3U</span>
            <span className="text-xs opacity-70">cestistica-tv-24.m3u</span>
          </button>

          <button onClick={() => copyText(generateM3UDataUri(), 'm3u-url')}
            className={`font-bold py-4 rounded-xl transition-all flex flex-col items-center gap-2 ${
              copied === 'm3u-url' ? 'bg-green-600 text-white' : 'bg-surface-hover hover:bg-white/10 text-gray-300 border border-white/10'
            }`}>
            <span className="text-2xl">🔗</span>
            <span>{copied === 'm3u-url' ? '✅ URL Copiato!' : 'Copia URL M3U'}</span>
            <span className="text-xs opacity-70">Per player che accettano URL</span>
          </button>
        </div>

        {/* M3U Preview */}
        <details className="group">
          <summary className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer flex items-center gap-2 select-none">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Anteprima contenuto M3U ({playlist.length} video)
          </summary>
          <pre className="mt-3 bg-surface rounded-lg p-4 text-xs text-gray-400 overflow-x-auto max-h-60 overflow-y-auto border border-white/5 font-mono whitespace-pre-wrap">
            {generateM3U()}
          </pre>
        </details>

        {/* Compatibility info */}
        <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-3">
          <p className="text-sm font-bold text-white">🎯 Compatibilità Player</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {[
              { name: 'VLC Media Player', status: '✅ Pieno supporto', desc: 'Apri M3U direttamente' },
              { name: 'Kodi + YouTube addon', status: '✅ Pieno supporto', desc: 'Importa playlist M3U' },
              { name: 'mpv', status: '✅ Pieno supporto', desc: 'Supporto nativo YouTube' },
              { name: 'IPTV Smarters', status: '⚠️ Parziale', desc: 'Usa link embed come sorgente' },
              { name: 'TiviMate', status: '⚠️ Parziale', desc: 'Richiede link HLS diretto' },
              { name: 'Browser / Smart TV', status: '✅ Usa embed', desc: 'Incorpora con iframe' },
            ].map((p, i) => (
              <div key={i} className="bg-surface-card rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">{p.name}</span>
                  <span>{p.status}</span>
                </div>
                <p className="text-gray-500 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-sm text-yellow-400 font-medium mb-1.5">💡 Come usare con VLC</p>
          <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Scarica il file M3U</li>
            <li>Apri VLC → Media → Apri file</li>
            <li>Seleziona il file <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">cestistica-tv-24.m3u</code></li>
            <li>VLC riprodurrà automaticamente i video di YouTube in sequenza</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERLAY TAB
// ============================================================
function OverlayTab({ overlay, onSave }: { overlay: OverlayConfig; onSave: (o: OverlayConfig) => void }) {
  const [local, setLocal] = useState(overlay);
  const update = (changes: Partial<OverlayConfig>) => setLocal(prev => ({ ...prev, ...changes }));

  const positions = [
    { value: 'top-left' as const, label: '↖ Alto Sx' },
    { value: 'top-right' as const, label: '↗ Alto Dx' },
    { value: 'bottom-left' as const, label: '↙ Basso Sx' },
    { value: 'bottom-right' as const, label: '↘ Basso Dx' },
  ];

  const posStyle: React.CSSProperties = {
    ...(local.position.includes('top') ? { top: local.marginY } : { bottom: local.marginY + 50 }),
    ...(local.position.includes('left') ? { left: local.marginX } : { right: local.marginX }),
    opacity: local.opacity / 100,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Logo / Overlay</h3>
              <p className="text-xs text-gray-500 mt-0.5">Mostra il tuo logo sul player</p>
            </div>
            <button onClick={() => update({ enabled: !local.enabled })}
              className={`relative w-14 h-7 rounded-full transition-colors ${local.enabled ? 'bg-brand' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${local.enabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="border-t border-white/5" />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">URL Immagine Logo</label>
            <input type="text" value={local.imageUrl} onChange={(e) => update({ imageUrl: e.target.value })}
              className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none text-sm"
              placeholder="https://esempio.com/logo.png" />
            <p className="text-[10px] text-gray-600 mt-1.5">
              PNG trasparente consigliato. Carica gratis su <a href="https://imgbb.com" target="_blank" rel="noopener" className="text-brand hover:underline">imgbb.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Testo (alternativa)</label>
            <input type="text" value={local.text} onChange={(e) => update({ text: e.target.value })}
              className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none text-sm"
              placeholder="Cestistica TV 24" />
          </div>

          <div className="border-t border-white/5" />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Posizione</label>
            <div className="grid grid-cols-2 gap-2">
              {positions.map(pos => (
                <button key={pos.value} onClick={() => update({ position: pos.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    local.position === pos.value ? 'bg-brand/20 text-brand border-brand/50' : 'bg-surface text-gray-500 border-white/5 hover:text-white'
                  }`}>{pos.label}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">Dimensione</label>
              <span className="text-sm font-bold text-brand">{local.width}px</span>
            </div>
            <input type="range" min="20" max="300" value={local.width} onChange={(e) => update({ width: parseInt(e.target.value) })}
              className="w-full accent-[#22c55e] h-2 rounded-full appearance-none bg-surface cursor-pointer" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">Opacità</label>
              <span className="text-sm font-bold text-brand">{local.opacity}%</span>
            </div>
            <input type="range" min="10" max="100" value={local.opacity} onChange={(e) => update({ opacity: parseInt(e.target.value) })}
              className="w-full accent-[#22c55e] h-2 rounded-full appearance-none bg-surface cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Margine X</label>
                <span className="text-xs font-bold text-brand">{local.marginX}px</span>
              </div>
              <input type="range" min="0" max="100" value={local.marginX} onChange={(e) => update({ marginX: parseInt(e.target.value) })}
                className="w-full accent-[#22c55e] h-2 rounded-full appearance-none bg-surface cursor-pointer" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Margine Y</label>
                <span className="text-xs font-bold text-brand">{local.marginY}px</span>
              </div>
              <input type="range" min="0" max="100" value={local.marginY} onChange={(e) => update({ marginY: parseInt(e.target.value) })}
                className="w-full accent-[#22c55e] h-2 rounded-full appearance-none bg-surface cursor-pointer" />
            </div>
          </div>

          <button onClick={() => onSave(local)}
            className="w-full bg-gradient-to-r from-brand to-green-600 hover:from-brand-dark hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2">
            💾 Salva Overlay
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Anteprima</h3>
        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
            <div className="text-center opacity-30">
              <p className="text-7xl mb-3">🏀</p>
              <p className="text-gray-500 text-xs uppercase tracking-widest">Video Player</p>
            </div>
          </div>

          {local.enabled && (local.imageUrl || local.text) && (
            <div className="absolute z-30 pointer-events-none transition-all duration-300" style={posStyle}>
              {local.imageUrl ? (
                <img src={local.imageUrl} alt="Logo" style={{ width: local.width }} className="object-contain drop-shadow-2xl"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : local.text ? (
                <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 text-white font-black drop-shadow-2xl whitespace-nowrap"
                  style={{ fontSize: Math.max(10, local.width / 5) }}>{local.text}</div>
              ) : null}
            </div>
          )}

          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Live</span>
              <span className="text-white/40 text-xs ml-auto">Cestistica TV 24</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20">
            <div className="w-full h-1 bg-white/10"><div className="h-full w-2/5 bg-brand rounded-full" /></div>
            <div className="bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm bg-white/30" />
                  <span className="text-white/50 text-[10px] font-mono">4:32 / 10:00</span>
                </div>
                <div className="w-4 h-4 rounded-sm bg-white/30" />
              </div>
            </div>
          </div>

          {!local.enabled && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
                <p className="text-gray-300 text-sm font-medium">Overlay disabilitato</p>
                <p className="text-gray-500 text-xs mt-1">Attiva il toggle</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================
function SettingsTab({ config, onSave }: { config: ChannelConfig; onSave: (c: ChannelConfig) => void }) {
  const [local, setLocal] = useState(config);
  const [newMessage, setNewMessage] = useState('');

  const addMessage = () => {
    if (newMessage.trim()) {
      setLocal({ ...local, tickerMessages: [...local.tickerMessages, newMessage.trim()] });
      setNewMessage('');
    }
  };

  const removeMessage = (index: number) => {
    setLocal({ ...local, tickerMessages: local.tickerMessages.filter((_, i) => i !== index) });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white">⚙️ Impostazioni Canale</h3>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome Canale</label>
          <input type="text" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })}
            className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Tagline</label>
          <input type="text" value={local.tagline} onChange={(e) => setLocal({ ...local, tagline: e.target.value })}
            className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-brand focus:outline-none" />
        </div>

        <div className="border-t border-white/5" />

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Messaggi Ticker <span className="text-gray-600">({local.tickerMessages.length})</span>
          </label>
          <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
            {local.tickerMessages.map((msg, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2.5 group">
                <span className="text-xs text-gray-600 font-mono w-6 flex-shrink-0">{i + 1}.</span>
                <span className="text-gray-300 text-sm flex-1 truncate">{msg}</span>
                <button onClick={() => removeMessage(i)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMessage()}
              className="flex-1 bg-surface rounded-lg px-4 py-2.5 text-white border border-white/10 focus:border-brand focus:outline-none text-sm"
              placeholder="Nuovo messaggio..." />
            <button onClick={addMessage} disabled={!newMessage.trim()}
              className="bg-surface-hover hover:bg-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30">
              + Aggiungi
            </button>
          </div>
        </div>

        <button onClick={() => onSave(local)}
          className="w-full bg-gradient-to-r from-brand to-green-600 hover:from-brand-dark hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand/20">
          💾 Salva Impostazioni
        </button>
      </div>

      <div className="bg-surface-card rounded-2xl p-6 border border-red-500/10">
        <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ Zona Pericolosa</h3>
        <p className="text-xs text-gray-500 mb-4">Resetta tutto ai valori predefiniti.</p>
        <button onClick={() => {
          if (confirm('Sei sicuro? Questo cancellerà TUTTI i dati.')) {
            localStorage.removeItem('ctv24_playlist');
            localStorage.removeItem('ctv24_config');
            localStorage.removeItem('ctv24_overlay');
            window.location.reload();
          }
        }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Resetta tutto
        </button>
      </div>
    </div>
  );
}

// ============================================================
// FIREBASE TAB
// ============================================================
function FirebaseTab() {
  const emptyConfig: FirebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  const [config, setConfig] = useState<FirebaseConfig>(() => getFirebaseConfig() ?? emptyConfig);
  const [enabled, setEnabled] = useState(isFirebaseEnabled());
  const [status, setStatus] = useState<FirebaseSyncStatus>('disconnected');
  const [statusMsg, setStatusMsg] = useState('');
  const [realtimeSync, setRealtimeSync] = useState(isFirebaseEnabled() && !!getFirebaseConfig());
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  // Se Firebase era già configurato all'avvio, mostra connected
  useEffect(() => {
    if (isFirebaseEnabled() && getFirebaseConfig()) {
      setStatus('connected');
      setStatusMsg('Firebase configurato. Premi "Testa Connessione" per verificare.');
    }
  }, []);

  const handleSaveConfig = async () => {
    const missing = Object.entries(config).filter(([, v]) => !v.trim());
    if (missing.length > 0) {
      setStatus('error');
      setStatusMsg(`❌ Compila tutti i campi. Mancanti: ${missing.map(([k]) => k).join(', ')}`);
      return;
    }
    setLoading(true);
    setStatus('connecting');
    setStatusMsg('Connessione in corso...');
    try {
      saveFirebaseConfig(config);
      initFirebase(config);
      const result = await testConnection();
      setFirebaseEnabled(result.success);
      setEnabled(result.success);
      setStatus(result.success ? 'connected' : 'error');
      setStatusMsg(result.message);
    } catch (e) {
      setStatus('error');
      setStatusMsg(`❌ Errore: ${(e as Error).message}`);
    }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!getFirebaseConfig()) { setStatusMsg('❌ Salva prima la configurazione.'); return; }
    setLoading(true);
    try {
      initFirebase(config);
      const result = await testConnection();
      setStatus(result.success ? 'connected' : 'error');
      setStatusMsg(result.message);
    } catch (e) {
      setStatus('error');
      setStatusMsg(`❌ ${(e as Error).message}`);
    }
    setLoading(false);
  };

  const handlePull = async () => {
    setLoading(true);
    const result = await pullFromFirestore();
    setStatusMsg(result.message);
    setLoading(false);
  };

  const handlePush = async () => {
    setLoading(true);
    const result = await pushToFirestore();
    setStatusMsg(result.message);
    setLoading(false);
  };

  const handleToggleRealtime = () => {
    if (realtimeSync) {
      stopRealtimeSync();
      setRealtimeSync(false);
      setStatusMsg('🔴 Sincronizzazione in tempo reale disattivata.');
    } else {
      initFirebase(config);
      startRealtimeSync(() => setStatusMsg('🔄 Dati aggiornati da Firebase!'));
      setRealtimeSync(true);
      setStatusMsg('🟢 Sincronizzazione in tempo reale attiva!');
    }
  };

  const handleDisconnect = () => {
    if (confirm('Sei sicuro? Verranno rimosse le chiavi Firebase salvate.')) {
      stopRealtimeSync();
      clearFirebaseConfig();
      setConfig(emptyConfig);
      setEnabled(false);
      setRealtimeSync(false);
      setStatus('disconnected');
      setStatusMsg('Firebase disconnesso.');
    }
  };

  const statusColor = {
    disconnected: 'text-gray-500',
    connecting: 'text-yellow-400',
    connected: 'text-green-400',
    error: 'text-red-400',
  }[status];

  const statusDot = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-green-400',
    error: 'bg-red-400',
  }[status];

  const fields: { key: keyof FirebaseConfig; label: string; placeholder: string }[] = [
    { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...' },
    { key: 'authDomain', label: 'Auth Domain', placeholder: 'il-tuo-progetto.firebaseapp.com' },
    { key: 'projectId', label: 'Project ID', placeholder: 'il-tuo-progetto' },
    { key: 'storageBucket', label: 'Storage Bucket', placeholder: 'il-tuo-progetto.appspot.com' },
    { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789012' },
    { key: 'appId', label: 'App ID', placeholder: '1:123456789012:web:abc...' },
  ];

  return (
    <div className="max-w-2xl space-y-6">

      {/* HEADER CARD */}
      <div className="bg-surface-card rounded-2xl p-6 border border-orange-500/20">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🔥</span>
          <div>
            <h3 className="text-lg font-bold text-white">Configurazione Firebase</h3>
            <p className="text-xs text-gray-500">Collega il sito a Firebase per sincronizzare i dati tra dispositivi</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
            <span className={`text-xs font-medium ${statusColor}`}>
              {status === 'disconnected' ? 'Non connesso' : status === 'connecting' ? 'Connessione...' : status === 'connected' ? 'Connesso' : 'Errore'}
            </span>
          </div>
        </div>
      </div>

      {/* GUIDA */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-blue-400 mb-3">📖 Come ottenere le chiavi Firebase</h4>
        <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>Vai su <span className="text-blue-400 font-mono">console.firebase.google.com</span></li>
          <li>Crea un nuovo progetto (o selezionane uno esistente)</li>
          <li>Nella sidebar vai su <strong className="text-gray-300">Firestore Database</strong> → crea un database</li>
          <li>Scegli la modalità <strong className="text-gray-300">Test</strong> per iniziare</li>
          <li>Vai su <strong className="text-gray-300">Impostazioni progetto</strong> (icona ⚙️ in alto a sinistra)</li>
          <li>Scorri fino a <strong className="text-gray-300">Le tue app</strong> → clicca sull'icona web <strong className="text-gray-300">&lt;/&gt;</strong></li>
          <li>Registra l'app e copia il blocco <span className="text-blue-400 font-mono">firebaseConfig</span></li>
          <li>Incolla i valori nei campi qui sotto 👇</li>
        </ol>
      </div>

      {/* FORM CHIAVI */}
      <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">🔑 Chiavi di configurazione</h3>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 bg-surface-hover rounded-lg"
          >
            {showKeys ? '🙈 Nascondi' : '👁️ Mostra'}
          </button>
        </div>

        <div className="grid gap-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {label}
                {config[key] && <span className="ml-2 text-green-500">✓</span>}
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={config[key]}
                onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all font-mono text-sm"
                placeholder={placeholder}
                autoComplete="off"
              />
            </div>
          ))}
        </div>

        {/* PASTE INTERO OGGETTO */}
        <div className="border-t border-white/5 pt-4">
          <p className="text-xs text-gray-500 mb-2">💡 <strong className="text-gray-400">Scorciatoia:</strong> Incolla qui l'intero oggetto <span className="font-mono text-orange-400">firebaseConfig</span> copiato dalla console:</p>
          <textarea
            rows={3}
            className="w-full bg-surface rounded-lg px-4 py-3 text-gray-400 border border-white/10 focus:border-orange-500 focus:outline-none text-xs font-mono resize-none"
            placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  // incolla qui tutto il blocco\n};'}
            onChange={(e) => {
              try {
                // Estrai l'oggetto JSON dal blocco JS
                const text = e.target.value;
                const match = text.match(/\{[\s\S]+\}/);
                if (!match) return;
                // Sostituisci le chiavi JS in chiavi JSON
                const jsonStr = match[0]
                  .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
                  .replace(/'/g, '"');
                const parsed = JSON.parse(jsonStr);
                const mapped: Partial<FirebaseConfig> = {};
                if (parsed.apiKey) mapped.apiKey = parsed.apiKey;
                if (parsed.authDomain) mapped.authDomain = parsed.authDomain;
                if (parsed.projectId) mapped.projectId = parsed.projectId;
                if (parsed.storageBucket) mapped.storageBucket = parsed.storageBucket;
                if (parsed.messagingSenderId) mapped.messagingSenderId = parsed.messagingSenderId;
                if (parsed.appId) mapped.appId = parsed.appId;
                setConfig((prev) => ({ ...prev, ...mapped }));
              } catch { /* parsing in progress, ignore */ }
            }}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-orange-500/20"
          >
            {loading ? '⏳ Connessione...' : '🔥 Salva e Connetti'}
          </button>
          <button
            onClick={handleTest}
            disabled={loading || !enabled}
            className="px-5 py-3 bg-surface-hover hover:bg-white/10 text-gray-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-30"
          >
            🔍 Testa
          </button>
        </div>

        {statusMsg && (
          <div className={`rounded-xl px-4 py-3 text-sm ${
            status === 'connected' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
            status === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
            'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
          }`}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* SYNC ACTIONS */}
      {enabled && (
        <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-5">
          <h3 className="text-base font-bold text-white">🔄 Sincronizzazione Dati</h3>
          <p className="text-xs text-gray-500">Sincronizza la playlist, l'overlay e le impostazioni tra localStorage e Firebase Firestore.</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePull}
              disabled={loading}
              className="flex flex-col items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl p-4 text-sm font-medium transition-colors disabled:opacity-30"
            >
              <span className="text-2xl">⬇️</span>
              <span>Scarica da Firebase</span>
              <span className="text-xs text-blue-500/70">Firebase → Sito</span>
            </button>
            <button
              onClick={handlePush}
              disabled={loading}
              className="flex flex-col items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl p-4 text-sm font-medium transition-colors disabled:opacity-30"
            >
              <span className="text-2xl">⬆️</span>
              <span>Carica su Firebase</span>
              <span className="text-xs text-green-500/70">Sito → Firebase</span>
            </button>
          </div>

          {/* REALTIME SYNC */}
          <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-white/5">
            <div>
              <p className="text-sm font-medium text-white">Sincronizzazione in tempo reale</p>
              <p className="text-xs text-gray-500">Aggiorna automaticamente quando Firebase cambia</p>
            </div>
            <button
              onClick={handleToggleRealtime}
              className={`relative w-12 h-6 rounded-full transition-colors ${realtimeSync ? 'bg-green-500' : 'bg-surface-hover'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${realtimeSync ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* ZONA PERICOLOSA */}
      {enabled && (
        <div className="bg-surface-card rounded-2xl p-6 border border-red-500/10">
          <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ Disconnetti Firebase</h3>
          <p className="text-xs text-gray-500 mb-4">Rimuove le chiavi salvate e disconnette il sito da Firebase. I dati locali non vengono cancellati.</p>
          <button
            onClick={handleDisconnect}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔌 Disconnetti Firebase
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REGIA TAB
// ============================================================
function RegiaTab({ playlist }: { playlist: VideoItem[] }) {
  const replicaPlaylist = playlist.filter(v => v.category !== 'live');
  const [broadcast, setBroadcast] = useState<BroadcastState>(getBroadcastState());
  const [liveInput, setLiveInput] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Aggiorna stato locale quando Firebase cambia
  useEffect(() => {
    const update = () => setBroadcast(getBroadcastState());
    window.addEventListener('ctv24-data-change', update);
    return () => window.removeEventListener('ctv24-data-change', update);
  }, []);

  const saveBroadcast = (state: BroadcastState) => {
    saveBroadcastState(state);
    setBroadcast(state);
    // Sincronizza subito su Firebase se connesso
    pushBroadcastToFirestore(state);
  };

  const handleGoLive = () => {
    const ytId = extractYouTubeId(liveInput.trim());
    if (!ytId) { showToast('❌ Link YouTube non valido'); return; }
    const title = liveTitle.trim() || '🔴 Diretta in corso';
    setLiveMode(ytId, title);
    saveBroadcast({ mode: 'live', forcedVideoId: null, forcedVideoIndex: null, liveYoutubeId: ytId, liveTitle: title, liveStartedAt: Date.now(), updatedAt: Date.now() });
    setLiveInput('');
    showToast('🔴 Live avviato!');
  };

  const handleStopLive = () => {
    setReplicaMode();
    saveBroadcast({ mode: 'replica', forcedVideoId: null, forcedVideoIndex: null, liveYoutubeId: null, liveTitle: '', liveStartedAt: null, updatedAt: Date.now() });
    showToast('✅ Tornato in modalità Replica');
  };

  const handleForceVideo = (index: number, video: VideoItem) => {
    forceVideo(index, video.id);
    saveBroadcast({ mode: 'replica', forcedVideoId: video.id, forcedVideoIndex: index, liveYoutubeId: null, liveTitle: '', liveStartedAt: null, updatedAt: Date.now() });
    showToast(`▶ "${video.title}" mandato in onda!`);
  };

  const handleSkipNext = () => {
    if (replicaPlaylist.length === 0) return;
    const currentIdx = broadcast.forcedVideoIndex ?? 0;
    const nextIdx = (currentIdx + 1) % replicaPlaylist.length;
    const nextVideo = replicaPlaylist[nextIdx];
    handleForceVideo(nextIdx, nextVideo);
    showToast(`⏭ Passato a "${nextVideo.title}"`);
  };

  const handleBackToAuto = () => {
    clearForcedVideo();
    saveBroadcast({ ...broadcast, forcedVideoId: null, forcedVideoIndex: null, updatedAt: Date.now() });
    showToast('🔄 Tornato alla rotazione automatica');
  };

  const isLive = broadcast.mode === 'live';
  const isForced = !isLive && !!broadcast.forcedVideoId;

  return (
    <div className="max-w-2xl space-y-6">

      {/* STATO ATTUALE */}
      <div className={`rounded-2xl p-5 border-2 ${isLive ? 'bg-red-500/10 border-red-500/40' : 'bg-green-500/10 border-green-500/20'}`}>
        <div className="flex items-center gap-3 mb-1">
          <span className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className={`text-lg font-black ${isLive ? 'text-red-400' : 'text-green-400'}`}>
            {isLive ? '🔴 LIVE IN CORSO' : '📺 MODALITÀ REPLICA'}
          </span>
        </div>
        {isLive && (
          <p className="text-sm text-red-300 ml-6">{broadcast.liveTitle}</p>
        )}
        {isForced && (
          <p className="text-xs text-green-400 ml-6 mt-1">
            ▶ Video forzato: <strong>{replicaPlaylist[broadcast.forcedVideoIndex!]?.title}</strong>
          </p>
        )}
        {!isLive && !isForced && (
          <p className="text-xs text-green-500/70 ml-6 mt-1">Rotazione automatica basata sul tempo</p>
        )}
      </div>

      {/* CONTROLLI REPLICA */}
      {!isLive && (
        <div className="bg-surface-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">📺 Controlli Replica</h3>
            {isForced && (
              <button onClick={handleSkipNext}
                className="flex items-center gap-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                ⏭ Video Successivo
              </button>
            )}
          </div>

          {isForced && (
            <button onClick={handleBackToAuto}
              className="w-full bg-surface-hover hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-colors">
              🔄 Torna alla rotazione automatica
            </button>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {replicaPlaylist.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Nessun video in playlist</p>
            )}
            {replicaPlaylist.map((video, index) => {
              const isCurrent = broadcast.forcedVideoId === video.id;
              return (
                <div key={video.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                    isCurrent ? 'bg-brand/10 border-brand/30' : 'bg-surface hover:bg-surface-hover border-white/5'
                  }`}>
                  <span className="text-xs text-gray-600 font-mono w-6 flex-shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? 'text-brand' : 'text-gray-200'}`}>
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-500">{formatDurationDisplay(video.duration)}</p>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">▶ In onda</span>
                  ) : (
                    <button onClick={() => handleForceVideo(index, video)}
                      className="flex-shrink-0 text-xs bg-surface-hover hover:bg-brand/20 hover:text-brand text-gray-400 border border-white/10 hover:border-brand/30 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      ▶ Manda ora
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALITA' LIVE */}
      <div className={`bg-surface-card rounded-2xl p-6 border ${isLive ? 'border-red-500/30' : 'border-white/5'} space-y-4`}>
        <h3 className="text-base font-bold text-white">🔴 Modalità Live</h3>

        {isLive ? (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 font-bold text-sm mb-1">🔴 Live attivo</p>
              <p className="text-gray-300 text-sm">{broadcast.liveTitle}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">ID: {broadcast.liveYoutubeId}</p>
            </div>
            <button onClick={handleStopLive}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-500/20">
              ⏹ Ferma Live — Torna in Replica
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Incolla il link del live YouTube. Tutti i dispositivi passeranno immediatamente alla diretta.</p>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Titolo della diretta</label>
              <input type="text" value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)}
                className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-red-500 focus:outline-none text-sm"
                placeholder="Es: Partita — Cestistica vs Rivali" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Link YouTube Live</label>
              <input type="text" value={liveInput} onChange={(e) => setLiveInput(e.target.value)}
                className="w-full bg-surface rounded-lg px-4 py-3 text-white border border-white/10 focus:border-red-500 focus:outline-none text-sm font-mono"
                placeholder="https://youtube.com/live/..." />
            </div>
            <button onClick={handleGoLive} disabled={!liveInput.trim()}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-red-500/20">
              🔴 Vai in Live
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-card border border-white/10 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}
