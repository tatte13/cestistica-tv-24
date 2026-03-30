import { getPlaylist, getTotalPlaylistDuration, categoryLabels, categoryColors } from '../data/channelData';

export default function Stats() {
  const playlist = getPlaylist();
  const totalDuration = getTotalPlaylistDuration();
  const totalHours = (totalDuration / 3600).toFixed(1);
  const totalVideos = playlist.length;

  const categoryCounts: Record<string, number> = {};
  playlist.forEach((v) => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
  });

  return (
    <div className="bg-surface-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Statistiche Canale
        </h2>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-brand">{totalVideos}</p>
            <p className="text-xs text-gray-500 mt-1">Video in rotazione</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-brand">{totalHours}h</p>
            <p className="text-xs text-gray-500 mt-1">Contenuto totale</p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryColors[cat as keyof typeof categoryColors] }}
              />
              <span className="text-sm text-gray-400 flex-1">
                {categoryLabels[cat as keyof typeof categoryLabels]}
              </span>
              <span className="text-sm text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
