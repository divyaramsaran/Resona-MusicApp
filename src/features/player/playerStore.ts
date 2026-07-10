import { create } from 'zustand';
import { PlayerState, Track, Playlist, PlaybackMode } from '../../types';

interface PlayerStoreActions {
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setQueue: (queue: Track[]) => void;
  playTrack: (track: Track, customQueue?: Track[]) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleFavorite: (trackId: string) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  addToHistory: (track: Track) => void;
  createPlaylist: (name: string, description: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setActiveTab: (tab: 'home' | 'search' | 'library') => void;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setImmersivePlayerOpen: (open: boolean) => void;
}

export const usePlayerStore = create<PlayerState & PlayerStoreActions>((set, get) => {
  // Safe parsing of LocalStorage items
  const safeGetItem = (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  };

  const safeSetItem = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing localStorage key "${key}":`, e);
    }
  };

  // Initial persisted state
  const initialFavorites = safeGetItem('harmony_favorites', []) as string[];
  const initialHistory = safeGetItem('harmony_history', []) as Track[];
  const initialPlaylists = safeGetItem('harmony_playlists', []) as Playlist[];
  const initialVolume = safeGetItem('harmony_volume', 0.8) as number;

  return {
    // State
    currentTrack: null,
    isPlaying: false,
    volume: initialVolume,
    progress: 0,
    queue: [],
    currentTrackIndex: -1,
    playbackMode: 'repeat',
    favorites: initialFavorites,
    history: initialHistory,
    playlists: initialPlaylists,
    activeTab: 'home',
    searchQuery: '',
    selectedGenre: '',
    immersivePlayerOpen: false,

    // Actions
    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setVolume: (volume) => {
      set({ volume });
      safeSetItem('harmony_volume', volume);
    },
    setProgress: (progress) => set({ progress }),
    setQueue: (queue) => set({ queue }),

    playTrack: (track, customQueue) => {
      const state = get();
      let activeQueue = customQueue || state.queue;

      // If the track is not in the active queue, insert it after current index or replace queue
      let trackIndex = activeQueue.findIndex((t) => t.id === track.id);
      if (trackIndex === -1) {
        if (customQueue) {
          activeQueue = customQueue;
          trackIndex = activeQueue.findIndex((t) => t.id === track.id);
        } else {
          // Append to queue and play
          activeQueue = [...state.queue, track];
          trackIndex = activeQueue.length - 1;
        }
      }

      set({
        currentTrack: track,
        isPlaying: true,
        queue: activeQueue,
        currentTrackIndex: trackIndex,
        progress: 0,
      });

      // Add to history
      get().addToHistory(track);
    },

    pauseTrack: () => set({ isPlaying: false }),
    
    resumeTrack: () => {
      const state = get();
      if (state.currentTrack) {
        set({ isPlaying: true });
      }
    },

    nextTrack: () => {
      const state = get();
      if (state.queue.length === 0) return;

      let nextIndex = state.currentTrackIndex;

      if (state.playbackMode === 'repeat-one' && state.currentTrack) {
        set({ progress: 0 }); // reset progress to restart
        return;
      }

      if (state.playbackMode === 'shuffle') {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      } else {
        nextIndex = (state.currentTrackIndex + 1) % state.queue.length;
      }

      const nextTrack = state.queue[nextIndex];
      if (nextTrack) {
        set({
          currentTrack: nextTrack,
          currentTrackIndex: nextIndex,
          isPlaying: true,
          progress: 0,
        });
        get().addToHistory(nextTrack);
      }
    },

    prevTrack: () => {
      const state = get();
      if (state.queue.length === 0) return;

      let prevIndex = state.currentTrackIndex;

      if (state.playbackMode === 'shuffle') {
        prevIndex = Math.floor(Math.random() * state.queue.length);
      } else {
        prevIndex = state.currentTrackIndex - 1;
        if (prevIndex < 0) {
          prevIndex = state.queue.length - 1; // wrap to end
        }
      }

      const prevTrack = state.queue[prevIndex];
      if (prevTrack) {
        set({
          currentTrack: prevTrack,
          currentTrackIndex: prevIndex,
          isPlaying: true,
          progress: 0,
        });
        get().addToHistory(prevTrack);
      }
    },

    toggleFavorite: (trackId) => {
      const state = get();
      const updated = state.favorites.includes(trackId)
        ? state.favorites.filter((id) => id !== trackId)
        : [...state.favorites, trackId];

      set({ favorites: updated });
      safeSetItem('harmony_favorites', updated);
    },

    addToQueue: (track) => {
      const state = get();
      if (state.queue.some((t) => t.id === track.id)) return; // No duplicates in queue

      const updatedQueue = [...state.queue, track];
      set({ queue: updatedQueue });

      // If nothing is playing, set this as the active index
      if (state.currentTrackIndex === -1) {
        set({ currentTrackIndex: 0, currentTrack: track });
      }
    },

    removeFromQueue: (trackId) => {
      const state = get();
      const updatedQueue = state.queue.filter((t) => t.id !== trackId);
      let newIndex = state.currentTrackIndex;

      if (state.currentTrack?.id === trackId) {
        // If we are removing the active track, play the next one
        if (updatedQueue.length > 0) {
          newIndex = state.currentTrackIndex % updatedQueue.length;
          set({
            queue: updatedQueue,
            currentTrack: updatedQueue[newIndex],
            currentTrackIndex: newIndex,
            progress: 0,
          });
        } else {
          set({
            queue: [],
            currentTrack: null,
            currentTrackIndex: -1,
            isPlaying: false,
            progress: 0,
          });
        }
      } else {
        // Recalculate index of current track in the smaller queue
        newIndex = updatedQueue.findIndex((t) => t.id === state.currentTrack?.id);
        set({ queue: updatedQueue, currentTrackIndex: newIndex });
      }
    },

    clearQueue: () => {
      set({
        queue: [],
        currentTrack: null,
        currentTrackIndex: -1,
        isPlaying: false,
        progress: 0,
      });
    },

    addToHistory: (track) => {
      const state = get();
      // Filter out this track from previous history spots to push it to the top
      const filtered = state.history.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50); // limit history to 50 items

      set({ history: updated });
      safeSetItem('harmony_history', updated);
    },

    createPlaylist: (name, description) => {
      const state = get();
      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name,
        description,
        trackIds: [],
        createdAt: Date.now(),
      };

      const updated = [...state.playlists, newPlaylist];
      set({ playlists: updated });
      safeSetItem('harmony_playlists', updated);
    },

    deletePlaylist: (id) => {
      const state = get();
      const updated = state.playlists.filter((p) => p.id !== id);
      set({ playlists: updated });
      safeSetItem('harmony_playlists', updated);
    },

    addTrackToPlaylist: (playlistId, trackId) => {
      const state = get();
      const updated = state.playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          if (playlist.trackIds.includes(trackId)) return playlist; // No duplicates
          return {
            ...playlist,
            trackIds: [...playlist.trackIds, trackId],
          };
        }
        return playlist;
      });

      set({ playlists: updated });
      safeSetItem('harmony_playlists', updated);
    },

    removeTrackFromPlaylist: (playlistId, trackId) => {
      const state = get();
      const updated = state.playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            trackIds: playlist.trackIds.filter((id) => id !== trackId),
          };
        }
        return playlist;
      });

      set({ playlists: updated });
      safeSetItem('harmony_playlists', updated);
    },

    setPlaybackMode: (playbackMode) => set({ playbackMode }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedGenre: (selectedGenre) => set({ selectedGenre }),
    setImmersivePlayerOpen: (immersivePlayerOpen) => set({ immersivePlayerOpen }),
  };
});
