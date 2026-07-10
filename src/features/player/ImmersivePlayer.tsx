import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from './playerStore';
import { seekAudio } from './AudioEngine';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  ChevronDown,
  Heart,
  ListMusic,
  Plus,
  Music,
} from 'lucide-react';

export default function ImmersivePlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    playbackMode,
    favorites,
    queue,
    playlists,
    immersivePlayerOpen,
    toggleFavorite,
    setIsPlaying,
    setVolume,
    nextTrack,
    prevTrack,
    setPlaybackMode,
    setImmersivePlayerOpen,
    addTrackToPlaylist,
    createPlaylist,
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!immersivePlayerOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekAudio(val);
  };

  const isFav = favorites.includes(currentTrack.id);

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim(), 'My custom playlist');
    setNewPlaylistName('');
  };

  return (
    <AnimatePresence>
      <motion.div
        id="immersive-player"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white overflow-hidden"
      >
        {/* Blurred ambient album art background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f111a]/60 to-[#0f111a] pointer-events-none" />

        {/* Top Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <button
            id="btn-close-immersive"
            onClick={() => setImmersivePlayerOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">Now Playing</span>
            <h1 className="text-sm font-semibold text-slate-200">{currentTrack.albumName}</h1>
          </div>
          <button
            id="btn-toggle-queue-view"
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 rounded-full transition-all ${
              showQueue ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </header>

        {/* Main Workspace */}
        <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-start lg:justify-center p-6 lg:p-12 gap-8 max-w-7xl mx-auto w-full overflow-y-auto">
          
          {/* Left panel: Disk / Art */}
          <div className="flex flex-col items-center justify-center w-full max-w-md flex-shrink-0">
            <div className="relative group w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 flex-shrink-0 aspect-square flex items-center justify-center">
              {/* Vinyl record design */}
              <div 
                className={`absolute inset-0 rounded-full bg-slate-950 shadow-2xl flex items-center justify-center border-4 border-white/5 ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
                style={{
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* Vinyl grooved lines */}
                <div className="absolute inset-2 sm:inset-3 rounded-full border border-white/5 opacity-40" />
                <div className="absolute inset-4 sm:inset-6 rounded-full border border-white/5 opacity-40" />
                <div className="absolute inset-7 sm:inset-10 rounded-full border border-white/5 opacity-40" />
                <div className="absolute inset-11 sm:inset-16 rounded-full border border-white/5 opacity-40" />
                <div className="absolute inset-16 sm:inset-24 rounded-full border border-white/5 opacity-40" />
                
                {/* Center album art disc */}
                <div
                  className="w-28 h-28 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-slate-900 relative z-10"
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Vinyl center adapter hole */}
                  <div className="absolute inset-0 m-auto w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0a0a0f] border-2 border-slate-900 shadow-inner" />
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="text-center mt-8 w-full">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-1 text-white px-4">
                {currentTrack.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-1 line-clamp-1 px-4 font-mono">
                {currentTrack.artistName}
              </p>
            </div>
          </div>

          {/* Right panel: Details / Queue / Lyrics fallbacks */}
          <div className="flex-1 flex flex-col w-full max-w-md glass border border-white/10 rounded-3xl p-6 shadow-2xl h-[340px] sm:h-[400px] md:h-[450px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="font-semibold text-sm tracking-wide">
                {showQueue ? 'Upcoming Queue' : 'Track Options'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {showQueue ? `${queue.length} Tracks` : currentTrack.source.toUpperCase()}
              </span>
            </div>

            {showQueue ? (
              // Active Queue view
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                      track.id === currentTrack.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${track.id === currentTrack.id ? 'text-indigo-300' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate font-mono">{track.artistName}</p>
                    </div>
                    {track.id === currentTrack.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Options view
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                    <div>
                      <p className="text-sm font-semibold">Favorites</p>
                      <p className="text-xs text-slate-400">Save track to library</p>
                    </div>
                    <button
                      id="btn-toggle-fav-immersive"
                      onClick={() => toggleFavorite(currentTrack.id)}
                      className={`p-2 rounded-full transition-all ${
                        isFav ? 'bg-rose-500/20 text-rose-500' : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">Add to Playlist</p>
                        <p className="text-xs text-slate-400">Organize your music</p>
                      </div>
                      <button
                        id="btn-toggle-playlists-selector"
                        onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-300 hover:text-white"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {showPlaylistSelector && (
                      <div className="space-y-2 border-t border-white/10 pt-2 max-h-32 overflow-y-auto">
                        {playlists.map((playlist) => (
                          <button
                            key={playlist.id}
                            id={`btn-add-to-playlist-${playlist.id}`}
                            onClick={() => {
                              addTrackToPlaylist(playlist.id, currentTrack.id);
                              setShowPlaylistSelector(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-xs flex items-center justify-between"
                          >
                            <span>{playlist.name}</span>
                            {playlist.trackIds.includes(currentTrack.id) ? (
                              <span className="text-indigo-400 font-medium">Added</span>
                            ) : (
                              <span className="text-slate-400 hover:text-white">+ Add</span>
                            )}
                          </button>
                        ))}
                        <form onSubmit={handleCreateAndAdd} className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="New playlist..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-500 hover:bg-indigo-600 rounded-lg px-3 py-1 text-xs text-white font-semibold transition-all shadow-md shadow-indigo-500/20"
                          >
                            Create
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                {/* License Tag */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-3">
                  <Music className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Creative Commons Licensed</p>
                    <a
                      href={currentTrack.licenseUrl || 'https://creativecommons.org/'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline block"
                    >
                      View CC Terms
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Player Controls Panel (Footer) */}
        <footer className="relative z-10 w-full bg-[#0a0b0f]/80 border-t border-white/10 px-6 py-6 max-w-4xl mx-auto flex flex-col gap-4">
          
          {/* Progress Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(currentTrack.durationSeconds)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={currentTrack.durationSeconds}
              value={progress}
              onChange={handleSeekChange}
              className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg cursor-pointer transition-all hover:h-1.5 focus:outline-none"
            />
          </div>

          {/* Media Control Row */}
          <div className="flex items-center justify-between mt-2">
            
            {/* Playback mode (Shuffle) */}
            <button
              id="btn-toggle-shuffle"
              onClick={() => setPlaybackMode(playbackMode === 'shuffle' ? 'repeat' : 'shuffle')}
              className={`p-2 rounded-full transition-all ${
                playbackMode === 'shuffle' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous track */}
            <button
              id="btn-prev-track"
              onClick={prevTrack}
              className="p-3 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition-all"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            {/* Play/Pause Play button */}
            <button
              id="btn-play-pause-toggle"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-5 bg-indigo-500 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-0.5" fill="currentColor" />}
            </button>

            {/* Next track */}
            <button
              id="btn-next-track"
              onClick={nextTrack}
              className="p-3 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition-all"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* Playback mode (Repeat / Repeat-One) */}
            <button
              id="btn-toggle-repeat"
              onClick={() => {
                const nextMode =
                  playbackMode === 'repeat'
                    ? 'repeat-one'
                    : playbackMode === 'repeat-one'
                    ? 'shuffle'
                    : 'repeat';
                setPlaybackMode(nextMode);
              }}
              className={`p-2 rounded-full transition-all flex items-center gap-0.5 ${
                playbackMode === 'repeat' || playbackMode === 'repeat-one'
                  ? 'text-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Repeat className="w-5 h-5" />
              {playbackMode === 'repeat-one' && <span className="text-[9px] font-bold">1</span>}
            </button>
          </div>

          {/* Volume Control Row */}
          <div className="flex items-center gap-4 max-w-sm mx-auto w-full mt-2">
            <button
              id="btn-toggle-mute"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="text-slate-400 hover:text-white transition-all"
            >
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-lg cursor-pointer transition-all hover:h-1.5 focus:outline-none"
            />
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
