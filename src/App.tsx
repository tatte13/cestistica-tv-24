import { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Ticker from './components/Ticker';
import NowPlaying from './components/NowPlaying';
import Schedule from './components/Schedule';
import Stats from './components/Stats';
import Guide from './components/Guide';
import EmbedModal from './components/EmbedModal';
import EmbedView from './components/EmbedView';
import AdminPage from './components/AdminPage';

type View = 'main' | 'embed' | 'admin';

function MainSite() {
  const [embedOpen, setEmbedOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <Header onEmbedClick={() => setEmbedOpen(true)} />
      <Ticker />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Player section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main player */}
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer />
            {/* Mobile: now playing under player */}
            <div className="lg:hidden">
              <NowPlaying />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Desktop: now playing */}
            <div className="hidden lg:block">
              <NowPlaying />
            </div>
            <Stats />
          </div>
        </div>

        {/* Schedule & Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Schedule />
          <Guide />
        </div>

        {/* Footer */}
        <footer className="mt-12 mb-8 text-center border-t border-white/5 pt-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand to-green-600 rounded-lg flex items-center justify-center text-lg">
              🏀
            </div>
            <span className="text-white font-bold">Cestistica TV 24</span>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Streaming 24/7 senza server — i video sono sincronizzati automaticamente
            per tutti gli spettatori tramite l'orario corrente.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setEmbedOpen(true)}
              className="text-brand hover:text-brand-light text-sm font-medium transition-colors"
            >
              Incorpora nel tuo sito
            </button>
            <span className="text-gray-600">•</span>
            <a href="#guida" className="text-gray-400 hover:text-white text-sm transition-colors">
              Guida
            </a>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => { window.location.hash = '#/admin'; }}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Admin
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-6">
            © {new Date().getFullYear()} Cestistica TV 24. Tutti i diritti riservati.
          </p>
        </footer>
      </main>

      <EmbedModal isOpen={embedOpen} onClose={() => setEmbedOpen(false)} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('main');

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#/embed') {
        setView('embed');
      } else if (hash === '#/admin') {
        setView('admin');
      } else {
        setView('main');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  if (view === 'embed') {
    return <EmbedView />;
  }

  if (view === 'admin') {
    return (
      <AdminPage
        onClose={() => {
          window.location.hash = '';
          setView('main');
        }}
      />
    );
  }

  return <MainSite />;
}
