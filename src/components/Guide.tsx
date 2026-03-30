export default function Guide() {
  const steps = [
    {
      num: '1',
      title: 'Carica i tuoi video su YouTube',
      desc: 'Carica i video delle partite, highlights, interviste ecc. su YouTube. Puoi metterli anche "Non in lista" così solo chi ha il link può vederli.',
      icon: '📤',
    },
    {
      num: '2',
      title: 'Aggiungi i video dal Pannello Admin',
      desc: 'Clicca l\'icona ⚙️ in alto a destra per accedere al pannello di gestione. Aggiungi video, configura l\'overlay e personalizza il canale.',
      icon: '📝',
    },
    {
      num: '3',
      title: 'Pubblica il sito (gratis!)',
      desc: 'Puoi usare servizi gratuiti come Netlify, Vercel o GitHub Pages. Basta fare il deploy e il canale è live 24/7 automaticamente!',
      icon: '🚀',
    },
    {
      num: '4',
      title: 'Incorpora ovunque',
      desc: 'Usa il pulsante "Incorpora" per ottenere il codice HTML da inserire in qualsiasi altro sito web. Il player si sincronizzerà automaticamente.',
      icon: '🔗',
    },
  ];

  return (
    <div id="guida" className="bg-surface-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-brand">⚡</span>
          Come funziona — Streaming 24/7 GRATIS
        </h2>
      </div>

      <div className="p-5">
        <div className="bg-brand/10 border border-brand/20 rounded-lg p-4 mb-6">
          <p className="text-brand-light text-sm font-medium">
            🎯 <strong>Il segreto:</strong> Non serve un computer acceso 24/7! I video sono hostati gratis su YouTube.
            Il sito calcola automaticamente quale video deve andare in onda in base all'ora — tutti gli spettatori
            vedono la stessa cosa nello stesso momento, come un vero canale TV.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-surface rounded-lg p-4 border border-white/5 hover:border-brand/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{step.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                    <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-surface rounded-lg p-4 border border-white/5">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span>🆓</span> Hosting gratuito consigliato
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { name: 'Netlify', url: 'https://netlify.com', desc: 'Drop della cartella dist/' },
              { name: 'Vercel', url: 'https://vercel.com', desc: 'Collega il repo GitHub' },
              { name: 'GitHub Pages', url: 'https://pages.github.com', desc: 'Gratis con GitHub' },
            ].map((host) => (
              <a
                key={host.name}
                href={host.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-alt rounded-lg p-3 hover:bg-surface-hover transition-colors block"
              >
                <p className="text-white font-medium text-sm">{host.name}</p>
                <p className="text-gray-500 text-xs">{host.desc}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-brand/5 border border-brand/15 rounded-lg p-4">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <span>🔧</span> Pannello Admin
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            Clicca l'icona <span className="text-brand font-bold">⚙️</span> in alto a destra per accedere al pannello di amministrazione.
            Da lì puoi aggiungere/rimuovere video, configurare il logo/overlay sul player, e personalizzare
            le impostazioni del canale. Tutti i dati sono salvati nel browser (localStorage).
          </p>
        </div>
      </div>
    </div>
  );
}
