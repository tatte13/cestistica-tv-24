import { useState, useEffect } from 'react';
import { getCurrentPlaybackState, categoryColors, categoryLabels } from '../data/channelData';

export default function NowPlaying() {
  const [state, setState] = useState(getCurrentPlaybackState());

  useEffect(() => {
    const update = () => setState(getCurrentPlaybackState());
    const interval = setInterval(update, 1000);
    // Aggiorna subito quando Firebase sincronizza nuovi dati
    window.addEventListener('ctv24-data-change', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ctv24-data-change', update);
    };
  }, []);

  const { currentVideo, nextVideo, elapsedInVideo } = state;
  const remaining = currentVideo.duration - elapsedInVideo;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          In onda ora
        </h2>
      </div>

      <div className="p-5">
        {/* Current */}
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <div
              className="w-1 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: categoryColors[currentVideo.category] }}
            />
            <div className="flex-1">
              <p className="text-white font-semibold text-base">{currentVideo.title}</p>
              <p className="text-gray-400 text-sm mt-1">{currentVideo.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: categoryColors[currentVideo.category] + '20',
                    color: categoryColors[currentVideo.category],
                  }}
                >
                  {categoryLabels[currentVideo.category]}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  Tempo rimasto: {formatTime(remaining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 my-4" />

        {/* Next up */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
            Prossimamente
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-8 rounded-full flex-shrink-0 opacity-50"
              style={{ backgroundColor: categoryColors[nextVideo.category] }}
            />
            <div>
              <p className="text-gray-300 text-sm font-medium">{nextVideo.title}</p>
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium mt-1 inline-block"
                style={{
                  backgroundColor: categoryColors[nextVideo.category] + '15',
                  color: categoryColors[nextVideo.category],
                }}
              >
                {categoryLabels[nextVideo.category]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
