import { usePlayerStore } from './features/player/playerStore';
import AudioEngine from './features/player/AudioEngine';
import PlayerBar from './features/player/PlayerBar';
import ImmersivePlayer from './features/player/ImmersivePlayer';

// Tabs
import HomeTab from './features/home/HomeTab';
import SearchTab from './features/search/SearchTab';
import LibraryTab from './features/library/LibraryTab';

// Icons
import { Home, Search, Library, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { activeTab, setActiveTab, currentTrack } = usePlayerStore();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'search':
        return <SearchTab />;
      case 'library':
        return <LibraryTab />;
      default:
        return <HomeTab />;
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
  ] as const;

  return (
    <div className="relative h-screen h-[100dvh] w-screen text-slate-100 flex flex-col md:flex-row antialiased select-none font-sans md:p-6 md:gap-6 overflow-hidden">
      {/* Mesh Background */}
      <div className="mesh-bg" />

      {/* Invisible HTML5 Audio Handler */}
      <AudioEngine />

      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 glass rounded-3xl p-6 flex-shrink-0 relative z-30">
        {/* Brand Logo */}
        <div id="sidebar-logo" className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center font-bold text-xl text-white">
            <Music className="w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white uppercase font-sans">
              Resona
            </h1>
            <span className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">
              Free Stream
            </span>
          </div>
        </div>

        {/* Navigation Link List */}
        <nav className="mt-8 flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 text-indigo-300 border-l-4 border-indigo-400 pl-3'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Legal CC Branding Credit */}
        <div className="text-[10px] text-slate-400 leading-relaxed bg-white/5 p-4 border border-white/10 rounded-2xl">
          <p className="font-semibold text-slate-200">Creative Commons</p>
          <p className="mt-1">All tracks sourced legally via Jamendo and Archive.org portals under CC licenses.</p>
        </div>
      </aside>

      {/* Mobile Top Header (Visible on Mobile Only) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
            <Music className="w-4 h-4" fill="currentColor" />
          </div>
          <span className="text-sm font-black tracking-wider uppercase text-white font-sans">
            Resona
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full">
          CC Portal
        </span>
      </header>

      {/* Main content viewport */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-transparent relative overflow-hidden">
        <div className={`flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8 scrollbar-thin ${currentTrack ? 'pb-40 md:pb-32' : 'pb-28 md:pb-8'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-t border-white/10 py-2.5 px-6 flex items-center justify-around z-30 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                isSelected ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium font-sans">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Persistent Audio Controls Bar */}
      <PlayerBar />

      {/* Fullscreen Slider Now Playing Drawer */}
      <ImmersivePlayer />
    </div>
  );
}
