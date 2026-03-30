import { useState, useEffect } from 'react';

export default function LiveBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Simula un conteggio di spettatori realistico
    const base = 42 + Math.floor(Math.random() * 30);
    setViewers(base);
    const interval = setInterval(() => {
      setViewers((v) => Math.max(10, v + Math.floor(Math.random() * 7) - 3));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 bg-live-red text-white font-bold rounded ${sizes[size]} uppercase tracking-wider`}
      >
        <span className="w-2 h-2 bg-white rounded-full live-pulse" />
        Live
      </span>
      {size !== 'sm' && (
        <span className="text-gray-400 text-sm">
          {viewers.toLocaleString()} spettatori
        </span>
      )}
    </div>
  );
}
