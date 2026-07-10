import React from 'react';
import { Track } from '../types';
import { usePlayerStore } from '../features/player/playerStore';
import { Play, Pause, Heart, Music, Sparkles } from 'lucide-react';

interface TrackRowProps {
  key?: React.Key;
  track: Track;
  index: number;
  tracksList: Track[];
}

export default function TrackRow({ track, index, tracksList }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, favorites, toggleFavorite } = usePlayerStore();

  const isCurrent = currentTrack?.id === track.id;
  const isFav = favorites.includes(track.id);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePlayClick = () => {
    if (isCurrent) {
      if (isPlaying) {
        usePlayerStore.getState().pauseTrack();
      } else {
        usePlayerStore.getState().resumeTrack();
      }
    } else {
      playTrack(track, tracksList);
    }
  };

  return (
    <div
      id={`track-row-${track.id}`}
      className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
        isCurrent
          ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
          : 'hover:bg-white/5 border border-transparent'
      }`}
      onClick={handlePlayClick}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Track position or animated play wave */}
        <div className="w-6 flex-shrink-0 flex items-center justify-center font-mono text-xs text-slate-400">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.75 bg-indigo-400 h-3 animate-pulse" />
              <div className="w-0.75 bg-indigo-400 h-1.5 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-0.75 bg-indigo-400 h-2.5 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : (
            <span className="group-hover:hidden">{index + 1}</span>
          )}
          
          <button
            id={`btn-play-row-${track.id}`}
            className="hidden group-hover:flex text-indigo-400"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayClick();
            }}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            )}
          </button>
        </div>

        {/* Cover Art */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-white/5 relative">
          <img
            src={track.coverUrl}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Track Title and Artist */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold truncate ${
              isCurrent ? 'text-indigo-300 font-bold' : 'text-slate-100'
            }`}
          >
            {track.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-400 truncate max-w-[120px] sm:max-w-none font-mono">
              {track.artistName}
            </p>
            <span className="text-[9px] px-1.5 py-0.25 rounded bg-white/5 border border-white/10 text-slate-300 flex items-center gap-0.5 font-mono uppercase tracking-wide">
              {track.source === 'jamendo' ? (
                <>
                  <Music className="w-2 h-2 text-indigo-400" /> Jamendo
                </>
              ) : (
                <>
                  <Sparkles className="w-2 h-2 text-indigo-400" /> Archive
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Album name - Hidden on small mobile */}
      <div className="hidden sm:block text-xs text-slate-400 max-w-[150px] truncate pr-4 flex-1">
        {track.albumName}
      </div>

      {/* Action panel (Favorite & Duration) */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          id={`btn-fav-row-${track.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track.id);
          }}
          className={`p-2 rounded-full hover:bg-white/5 transition-all ${
            isFav ? 'text-rose-500' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
        </button>

        <span className="text-xs font-mono text-slate-400 w-10 text-right">
          {formatDuration(track.durationSeconds)}
        </span>
      </div>
    </div>
  );
}
