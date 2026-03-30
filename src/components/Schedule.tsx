import { useState, useEffect } from 'react';
import { getSchedule, categoryColors, categoryLabels, getCurrentPlaybackState } from '../data/channelData';

export default function Schedule() {
  const [schedule, setSchedule] = useState(getSchedule(8));
  const [currentId, setCurrentId] = useState('');

  useEffect(() => {
    const update = () => {
      setSchedule(getSchedule(8));
      setCurrentId(getCurrentPlaybackState().currentVideo.id);
    };
    update();
    const interval = setInterval(update, 10000);
    // Aggiorna subito quando Firebase sincronizza nuovi dati
    window.addEventListener('ctv24-data-change', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ctv24-data-change', update);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <div className="bg-surface-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Palinsesto
        </h2>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          Prossime ore
        </span>
      </div>

      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
        {schedule.map((item, i) => {
          const isNow = item.video.id === currentId && i === 0;
          const isPast = item.endTime < new Date();

          return (
            <div
              key={`${item.video.id}-${i}`}
              className={`px-5 py-3 flex items-center gap-4 transition-colors ${
                isNow
                  ? 'bg-brand/10 border-l-2 border-brand'
                  : isPast
                  ? 'opacity-50'
                  : 'hover:bg-surface-hover'
              }`}
            >
              {/* Time */}
              <div className="flex-shrink-0 w-14 text-center">
                <span className={`text-sm font-mono ${isNow ? 'text-brand font-bold' : 'text-gray-400'}`}>
                  {formatTime(item.startTime)}
                </span>
              </div>

              {/* Category dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColors[item.video.category] }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isNow ? 'text-white' : 'text-gray-300'}`}>
                  {item.video.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: categoryColors[item.video.category] + '20',
                      color: categoryColors[item.video.category],
                    }}
                  >
                    {categoryLabels[item.video.category]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDuration(item.video.duration)}
                  </span>
                </div>
              </div>

              {/* Now indicator */}
              {isNow && (
                <span className="flex-shrink-0 text-xs bg-brand text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  In onda
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
