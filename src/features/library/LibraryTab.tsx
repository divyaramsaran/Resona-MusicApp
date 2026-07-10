import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../player/playerStore';
import { fetchJamendoTracks } from '../../lib/api';
import { Track, Playlist } from '../../types';
import TrackRow from '../../components/TrackRow';
import { Heart, ListMusic, History, Plus, Trash2, Play, Music, FolderHeart } from 'lucide-react';

export default function LibraryTab() {
  const {
    favorites,
    playlists,
    history,
    playTrack,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = usePlayerStore();

  const [subTab, setSubTab] = useState<'favorites' | 'playlists' | 'history'>('favorites');
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  // Modal / Form state for new playlist
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');

  // Fetch full track metadata for favorites (since we store only track IDs)
  useEffect(() => {
    async function loadFavoriteMetadata() {
      if (favorites.length === 0) {
        setFavoriteTracks([]);
        return;
      }

      // We can load them directly. For robust offline/cache playback,
      // let's fetch matching items or look them up in our current queue, history, or fallback sets.
      // If we cannot find them locally, we can trigger a bulk Jamendo tracks lookup!
      const fetchedTracks: Track[] = [];
      const localPool = [...history, ...usePlayerStore.getState().queue];
      
      const missingIds: string[] = [];

      for (const id of favorites) {
        const found = localPool.find((t) => t.id === id);
        if (found) {
          fetchedTracks.push(found);
        } else {
          missingIds.push(id);
        }
      }

      if (missingIds.length > 0) {
        try {
          // Fetch missing items from Jamendo API
          // For simple bulk fetch, we can query by IDs
          const idQuery = missingIds.join(',');
          const res = await fetch(
            `https://api.jamendo.com/v3.0/tracks/?client_id=${
              (import.meta as any).env.VITE_JAMENDO_CLIENT_ID || '56d30c95'
            }&format=json&id=${idQuery}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.results) {
              const mapped = data.results.map((item: any) => ({
                id: item.id,
                title: item.name,
                artistName: item.artist_name,
                albumName: item.album_name || 'Single',
                coverUrl: item.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
                audioUrl: item.audio,
                durationSeconds: parseInt(item.duration, 10) || 180,
                licenseUrl: item.license_ccurl || 'https://creativecommons.org/',
                source: 'jamendo',
                genre: item.musicinfo?.tags?.genres?.[0] || 'Unknown',
              }));
              fetchedTracks.push(...mapped);
            }
          }
        } catch (e) {
          console.warn('Could not query bulk favorite track details:', e);
        }
      }

      // Clean duplicates & set
      const unique = fetchedTracks.filter(
        (track, index, self) => self.findIndex((t) => t.id === track.id) === index
      );
      setFavoriteTracks(unique);
    }

    loadFavoriteMetadata();
  }, [favorites, history]);

  const handlePlayAllFavorites = () => {
    if (favoriteTracks.length > 0) {
      playTrack(favoriteTracks[0], favoriteTracks);
    }
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    createPlaylist(playlistName.trim(), playlistDesc.trim() || 'My personal legal mix');
    setPlaylistName('');
    setPlaylistDesc('');
    setShowCreateModal(false);
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Load actual Track objects in the selected playlist
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (!selectedPlaylist) {
      setPlaylistTracks([]);
      return;
    }

    const tracks: Track[] = [];
    const localPool = [...history, ...favoriteTracks, ...usePlayerStore.getState().queue];

    selectedPlaylist.trackIds.forEach((id) => {
      const found = localPool.find((t) => t.id === id);
      if (found) tracks.push(found);
    });

    setPlaylistTracks(tracks);
  }, [selectedPlaylistId, playlists, favoriteTracks, history]);

  const handlePlayPlaylist = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  return (
    <div id="library-tab-view" className="space-y-6 w-full max-w-4xl mx-auto pb-28">
      
      {/* Main title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Your Sound Library</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your favorites, custom mixtapes, and recently streamed legal tracks.
          </p>
        </div>

        {subTab === 'playlists' && !selectedPlaylistId && (
          <button
            id="btn-trigger-create-playlist-modal"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        )}
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 pb-px text-sm">
        <button
          id="lib-subtab-favorites"
          onClick={() => {
            setSubTab('favorites');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${
            subTab === 'favorites' && !selectedPlaylistId
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Starred ({favorites.length})</span>
        </button>

        <button
          id="lib-subtab-playlists"
          onClick={() => {
            setSubTab('playlists');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${
            subTab === 'playlists' || selectedPlaylistId
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Mixtapes ({playlists.length})</span>
        </button>

        <button
          id="lib-subtab-history"
          onClick={() => {
            setSubTab('history');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${
            subTab === 'history'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Recent History</span>
        </button>
      </div>

      {/* Inner sub-views */}
      <div className="mt-4 flex-1">
        
        {/* Playlists Detail View (When a mixtape is clicked) */}
        {selectedPlaylistId && selectedPlaylist ? (
          <div className="space-y-4">
            {/* Mixtape Header Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl glass">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/10 text-indigo-400">
                  <ListMusic className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPlaylist.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedPlaylist.description}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {playlistTracks.length} tracks • Created {new Date(selectedPlaylist.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-play-mixtape-all"
                  disabled={playlistTracks.length === 0}
                  onClick={handlePlayPlaylist}
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  <Play className="w-4 h-4 fill-currentColor" />
                  <span>Play Mix</span>
                </button>
                
                <button
                  id="btn-delete-mixtape"
                  onClick={() => {
                    deletePlaylist(selectedPlaylist.id);
                    setSelectedPlaylistId(null);
                  }}
                  className="p-2 border border-white/10 hover:bg-white/5 text-rose-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                  title="Delete Mixtape"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Track rows in selected playlist */}
            {playlistTracks.length > 0 ? (
              <div className="space-y-1.5 glass p-4 rounded-3xl">
                {playlistTracks.map((track, index) => (
                  <div key={track.id} className="relative group">
                    <TrackRow
                      track={track}
                      index={index}
                      tracksList={playlistTracks}
                    />
                    <button
                      id={`btn-remove-track-from-playlist-${track.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                      }}
                      className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-rose-500 hidden group-hover:block transition-all"
                      title="Remove from mixtape"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 border border-dashed border-white/10 rounded-3xl bg-white/5">
                <p className="text-sm">This mixtape is empty.</p>
                <p className="text-xs text-slate-500 mt-1">To add songs, search for tracks and click "+" inside the Now Playing overlay.</p>
              </div>
            )}
            
            <button
              id="btn-back-to-mixtapes"
              onClick={() => setSelectedPlaylistId(null)}
              className="text-xs text-slate-400 hover:text-white font-mono mt-2 cursor-pointer"
            >
              ← Back to all mixtapes
            </button>
          </div>
        ) : (
          /* Normal Library Sub-tabs */
          <>
            {/* Favorites Subtab */}
            {subTab === 'favorites' && (
              <>
                {favoriteTracks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-mono text-slate-500">
                        CONTINUOUS STARRED STATION
                      </span>
                      <button
                        id="btn-play-all-favorites"
                        onClick={handlePlayAllFavorites}
                        className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/20"
                      >
                        <Play className="w-4.5 h-4.5 fill-currentColor ml-0.5" />
                        <span>Play All</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 glass p-4 rounded-3xl">
                      {favoriteTracks.map((track, index) => (
                        <TrackRow
                          key={track.id}
                          track={track}
                          index={index}
                          tracksList={favoriteTracks}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="p-4 rounded-full bg-white/5 text-slate-400 mb-4 border border-white/10">
                      <FolderHeart className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No Stars Yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                      Tap the heart icon next to any song in Search or the Featured cards to build up your offline-cached favorites mix.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Playlists Subtab (Mixtapes index) */}
            {subTab === 'playlists' && (
              <>
                {playlists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        id={`mixtape-card-${playlist.id}`}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        className="group p-5 glass hover:bg-white/10 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 shadow-lg hover:shadow-2xl"
                      >
                        <div>
                          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/10 text-indigo-400 w-10 h-10 flex items-center justify-center">
                            <ListMusic className="w-5 h-5" />
                          </div>
                          <h4 className="text-base font-bold text-white mt-4 group-hover:text-indigo-300 transition-colors">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{playlist.description}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-4 border-t border-white/10 mt-4">
                          <span>{playlist.trackIds.length} tracks</span>
                          <span className="text-indigo-400 group-hover:underline">Open mix →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="p-4 rounded-full bg-white/5 text-slate-400 mb-4 border border-white/10">
                      <ListMusic className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Create Custom Mixtapes</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                      Organize your creative commons downloads into specific audio themes or workout mixes. Tap the button in the top right to start.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Recent History Subtab */}
            {subTab === 'history' && (
              <>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-mono text-slate-500">
                        RECENT AUDIO STREAMS
                      </span>
                    </div>

                    <div className="space-y-1.5 glass p-4 rounded-3xl">
                      {history.map((track, index) => (
                        <TrackRow
                          key={`${track.id}-${index}`}
                          track={track}
                          index={index}
                          tracksList={history}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="p-4 rounded-full bg-white/5 text-slate-400 mb-4 border border-white/10">
                      <History className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No Playback Log</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                      Start exploring and playing songs to see your listening history populate here automatically.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Playlist Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white">Create Mixtape</h3>
            <p className="text-xs text-slate-400 mt-1">Setup a new custom themed CC playlist.</p>

            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Mixtape Name</label>
                <input
                  id="input-playlist-name"
                  type="text"
                  required
                  placeholder="e.g. Focus Chill, Coding Beats"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Short Description</label>
                <textarea
                  id="input-playlist-desc"
                  placeholder="e.g. Ambient background loops for work"
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="btn-cancel-playlist-create"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-playlist-create"
                  type="submit"
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
