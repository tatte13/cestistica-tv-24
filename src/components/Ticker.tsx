import { useState, useEffect } from 'react';
import { getChannelConfig } from '../data/channelData';

export default function Ticker() {
  const [config, setConfig] = useState(getChannelConfig());

  useEffect(() => {
    const update = () => setConfig(getChannelConfig());
    // Aggiorna quando Firebase sincronizza nuovi dati
    window.addEventListener('ctv24-data-change', update);
    return () => window.removeEventListener('ctv24-data-change', update);
  }, []);

  const messages = config.tickerMessages.join('   •   ');

  return (
    <div className="w-full bg-surface-alt border-t border-b border-white/5 overflow-hidden">
      <div className="py-2 whitespace-nowrap ticker-animate inline-block">
        <span className="text-sm text-gray-400 font-medium">
          {messages}   •   {messages}
        </span>
      </div>
    </div>
  );
}
