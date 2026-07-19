export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds: number;
  licenseUrl?: string;
  source: 'jamendo' | 'archive';
  genre?: string;
  searchTags?: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: number;
}

export type PlaybackMode = 'repeat' | 'repeat-one' | 'shuffle';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number; // 0 to 1
  progress: number; // current time in seconds
  queue: Track[];
  currentTrackIndex: number;
  playbackMode: PlaybackMode;
  favorites: string[]; // array of track IDs
  history: Track[]; // array of recently played tracks
  playlists: Playlist[];
  activeTab: 'home' | 'search' | 'library';
  searchQuery: string;
  selectedGenre: string;
  immersivePlayerOpen: boolean;
}
