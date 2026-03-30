import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmbedModal({ isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'responsive'>('responsive');

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const embedUrl = `${baseUrl}#/embed`;

  const sizes = {
    small: { w: 480, h: 270 },
    medium: { w: 720, h: 405 },
    large: { w: 1024, h: 576 },
  };

  const getEmbedCode = () => {
    if (size === 'responsive') {
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
    }
    const { w, h } = sizes[size];
    return `<iframe src="${embedUrl}" width="${w}" height="${h}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:12px;"></iframe>`;
  };

  const embedCode = getEmbedCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-card rounded-2xl w-full max-w-lg overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">🔗 Incorpora il Player</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-400 text-sm">
            Copia il codice e incollalo nel tuo sito web. Il player si sincronizzerà automaticamente!
          </p>

          {/* Size selector */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'responsive' as const, label: 'Responsive', sub: 'Auto' },
              { key: 'small' as const, label: 'Piccolo', sub: '480×270' },
              { key: 'medium' as const, label: 'Medio', sub: '720×405' },
              { key: 'large' as const, label: 'Grande', sub: '1024×576' },
            ].map((s) => (
              <button key={s.key} onClick={() => setSize(s.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  size === s.key ? 'bg-brand text-white' : 'bg-surface-hover text-gray-400 hover:text-white'
                }`}>
                {s.label}
                <span className="block text-xs opacity-70">{s.sub}</span>
              </button>
            ))}
          </div>

          <div className="bg-surface rounded-lg p-3 font-mono text-xs text-green-400 break-all border border-white/5 max-h-32 overflow-y-auto">
            {embedCode}
          </div>

          <button onClick={handleCopy}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${copied ? 'bg-green-600' : 'bg-brand hover:bg-brand-dark'}`}>
            {copied ? '✅ Copiato!' : '📋 Copia codice'}
          </button>

          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              📡 Per opzioni avanzate (M3U, IPTV) vai nel <button onClick={() => { onClose(); window.location.hash = '#/admin'; }}
                className="text-brand hover:underline font-medium">Pannello Admin → Condividi</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
