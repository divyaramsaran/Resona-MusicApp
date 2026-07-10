import { usePlayerStore } from './playerStore';
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { seekAudio } from './AudioEngine';

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    setIsPlaying,
    setVolume,
    nextTrack,
    setImmersivePlayerOpen,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      id="persistent-player-bar"
      className="fixed bottom-[58px] md:bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-md border-t border-white/10 text-slate-100 flex flex-col transition-all duration-300"
    >
      {/* Top tiny progress line */}
      <div className="w-full h-1 bg-white/5 relative overflow-hidden group">
        <div
          className="absolute h-full bg-indigo-500 transition-all duration-100 ease-linear"
          style={{ width: `${(progress / currentTrack.durationSeconds) * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={currentTrack.durationSeconds}
          value={progress}
          onChange={(e) => seekAudio(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-indigo-500"
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Track info card - Tap to expand */}
        <div
          id="trigger-immersive-player"
          onClick={() => setImmersivePlayerOpen(true)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="min-w-0 pr-4">
            <h4 className="text-sm font-semibold truncate text-white group-hover:text-indigo-300 transition-all">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-slate-400 truncate font-mono">
              {currentTrack.artistName}
            </p>
          </div>
        </div>

        {/* Central Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            id="bar-btn-play-pause"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-all flex items-center justify-center active:scale-95 shadow-lg shadow-indigo-500/25"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            )}
          </button>
          
          <button
            id="bar-btn-next"
            onClick={nextTrack}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right side: Volume and Fullscreen expanders */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          <span className="text-xs font-mono text-slate-400">
            {formatTime(progress)} / {formatTime(currentTrack.durationSeconds)}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              id="bar-btn-toggle-mute"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="text-slate-400 hover:text-white transition-all"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 h-1 bg-white/10 rounded-lg cursor-pointer transition-all hover:h-1.5 focus:outline-none"
            />
          </div>

          <button
            id="bar-btn-expand-immersive"
            onClick={() => setImmersivePlayerOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            title="Expand Full Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
