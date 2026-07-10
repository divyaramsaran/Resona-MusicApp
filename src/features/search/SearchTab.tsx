import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../player/playerStore';
import { fetchJamendoTracks, fetchInternetArchiveTracks, searchCuratedTracks, CURATED_REGIONAL_TRACKS, CURATED_FALLBACK_TRACKS, getLevenshteinDistance } from '../../lib/api';
import { Track } from '../../types';
import TrackRow from '../../components/TrackRow';
import { Search, Music, Sparkles, Loader2, Play } from 'lucide-react';

const POPULAR_GENRES = [
  { id: 'telugu', label: '🎥 Telugu Hits', color: 'border-orange-500/20 text-orange-300 bg-orange-500/5' },
  { id: 'hindi', label: '💖 Bollywood Hindi', color: 'border-red-500/20 text-red-300 bg-red-500/5' },
  { id: 'tamil', label: '🎵 Tamil Hits', color: 'border-blue-500/20 text-blue-300 bg-blue-500/5' },
  { id: 'malayalam', label: '🌿 Malayalam Melodies', color: 'border-emerald-500/20 text-emerald-300 bg-emerald-500/5' },
  { id: 'lofi', label: '💤 Lofi / Chill', color: 'border-amber-500/20 text-amber-300 bg-amber-500/5' },
  { id: 'ambient', label: '🌌 Ambient / Space', color: 'border-indigo-500/20 text-indigo-300 bg-indigo-500/5' },
  { id: 'electronic', label: '⚡ Synth / Electro', color: 'border-pink-500/20 text-pink-300 bg-pink-500/5' },
  { id: 'acoustic', label: '🎸 Acoustic / Folk', color: 'border-emerald-500/20 text-emerald-300 bg-emerald-500/5' },
  { id: 'soundtrack', label: '🎬 Orchestral / Film', color: 'border-rose-500/20 text-rose-300 bg-rose-500/5' },
];

function rankTracks(tracks: Track[], queryStr: string): Track[] {
  const query = queryStr.toLowerCase().trim();
  if (!query) return tracks;

  const queryWords = query.split(/\s+/).filter(w => w.length > 0);
  if (queryWords.length === 0) return tracks;

  const scored = tracks.map(track => {
    let score = 0;
    const title = track.title.toLowerCase();
    const artist = track.artistName.toLowerCase();
    const album = track.albumName.toLowerCase();
    
    const cleanQuery = query.replace(/\s+/g, '');
    const cleanTitle = title.replace(/\s+/g, '');
    const cleanAlbum = album.replace(/\s+/g, '');
    
    // 1. Exact or Substring Matches (album match is weighted VERY high for movie searches!)
    if (album === query || cleanAlbum === cleanQuery) {
      score += 300; // Perfect album/movie match
    } else if (album.includes(query) || cleanAlbum.includes(cleanQuery)) {
      score += 200; // Substring album/movie match
    }
    
    if (title === query || cleanTitle === cleanQuery) {
      score += 250; // Perfect title match
    } else if (title.includes(query) || cleanTitle.includes(cleanQuery)) {
      score += 150; // Substring title match
    }
    
    if (artist.includes(query)) {
      score += 80;
    }
    
    // 2. Fuzzy Levenshtein matching on album/movie name (handles typos in movie names!)
    if (cleanQuery.length >= 4) {
      const albumDistance = getLevenshteinDistance(cleanQuery, cleanAlbum);
      if (albumDistance <= 2) {
        score += 180; // Fuzzy album match (high priority for minor movie name typos!)
      }
      
      const titleDistance = getLevenshteinDistance(cleanQuery, cleanTitle);
      if (titleDistance <= 2) {
        score += 120; // Fuzzy title match
      }
    }

    // 3. Word token matching (handles words in different orders)
    const trackWords = `${title} ${artist} ${album}`.split(/\s+/).filter(w => w.length > 0);
    let matchedWords = 0;
    for (const qWord of queryWords) {
      for (const tWord of trackWords) {
        if (tWord === qWord) {
          matchedWords++;
          break;
        } else if (tWord.includes(qWord) || qWord.includes(tWord)) {
          matchedWords += 0.5;
          break;
        } else if (qWord.length >= 3 && getLevenshteinDistance(qWord, tWord) <= 1) {
          matchedWords += 0.3;
          break;
        }
      }
    }
    score += (matchedWords / queryWords.length) * 100;

    // 4. Boost for Archive.org tracks when doing movie searches, because they contain real film audio
    if (track.source === 'archive' && (album.includes('movie') || album.includes('songs') || album.includes('soundtrack') || album.includes('collection'))) {
      score += 30;
    }

    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.track);
}

export default function SearchTab() {
  const { searchQuery, setSearchQuery, selectedGenre, setSelectedGenre } = usePlayerStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'jamendo' | 'archive'>('all');

  const executeSearch = async (queryStr: string, genreStr: string) => {
    setLoading(true);
    try {
      let localMatches: Track[] = [];
      if (queryStr.trim()) {
        localMatches = searchCuratedTracks(queryStr);
      } else if (genreStr.trim()) {
        const targetGenre = genreStr.toLowerCase().trim();
        localMatches = [...CURATED_REGIONAL_TRACKS, ...CURATED_FALLBACK_TRACKS].filter(
          t => (t.genre || '').toLowerCase().includes(targetGenre)
        );
      }

      let externalResults: Track[] = [];

      if (sourceFilter === 'jamendo') {
        externalResults = await fetchJamendoTracks({
          search: queryStr,
          genre: genreStr,
          limit: 40,
        });
      } else if (sourceFilter === 'archive') {
        const searchTerm = queryStr || genreStr || 'telugu';
        externalResults = await fetchInternetArchiveTracks(searchTerm);
      } else {
        // Query BOTH in parallel when source filter is 'all'
        const searchVal = queryStr.trim() || genreStr.trim() || 'telugu';

        const [jamendoResults, archiveResults] = await Promise.all([
          fetchJamendoTracks({
            search: queryStr,
            genre: genreStr,
            limit: 30,
          }).catch(() => []),
          fetchInternetArchiveTracks(searchVal).catch(() => [])
        ]);

        externalResults = [...jamendoResults, ...archiveResults];
      }

      // Rank all external results based on query relevance
      const rankedResults = rankTracks(externalResults, queryStr || genreStr);

      // Merge local matches at the top, removing duplicates
      const merged = [...localMatches];
      const seenIds = new Set(localMatches.map(t => t.id));
      
      for (const track of rankedResults) {
        if (!seenIds.has(track.id)) {
          merged.push(track);
          seenIds.add(track.id);
        }
      }

      setTracks(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run search when query, genre, or source filter updates
  useEffect(() => {
    executeSearch(searchQuery, selectedGenre);
  }, [searchQuery, selectedGenre, sourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedGenre(''); // Clear genre when manually searching text
    setSearchQuery(localQuery.trim());
  };

  const handleGenreClick = (genreId: string) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(''); // Toggle off
    } else {
      setLocalQuery(''); // Clear text search
      setSearchQuery('');
      setSelectedGenre(genreId);
    }
  };

  const handleClearAll = () => {
    setLocalQuery('');
    setSearchQuery('');
    setSelectedGenre('');
    setTracks([]);
  };

  return (
    <div id="search-tab-view" className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-28">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Explore Free Music</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Search over 600,000 legal Creative Commons & Public Domain audio archives.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-music-search"
            type="text"
            placeholder="Search tracks, artists, genres..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans placeholder-slate-400"
          />
        </div>
        <button
          id="btn-search-submit"
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </form>

      {/* Filter Tabs & Quick Genre Pills */}
      <div className="space-y-3">
        {/* Source filtering */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex gap-2 text-xs">
            <button
              id="filter-source-all"
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-mono transition-all ${
                sourceFilter === 'all'
                  ? 'bg-white/10 text-indigo-300 border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Sources
            </button>
            <button
              id="filter-source-jamendo"
              onClick={() => setSourceFilter('jamendo')}
              className={`px-3 py-1.5 rounded-lg font-mono transition-all flex items-center gap-1 ${
                sourceFilter === 'jamendo'
                  ? 'bg-white/10 text-indigo-300 border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3 h-3 text-indigo-400" /> Jamendo
            </button>
            <button
              id="filter-source-archive"
              onClick={() => setSourceFilter('archive')}
              className={`px-3 py-1.5 rounded-lg font-mono transition-all flex items-center gap-1 ${
                sourceFilter === 'archive'
                  ? 'bg-white/10 text-indigo-300 border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-400" /> Archive.org
            </button>
          </div>

          {(searchQuery || selectedGenre) && (
            <button
              id="btn-clear-search-filters"
              onClick={handleClearAll}
              className="text-xs font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Genre pills */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_GENRES.map((genre) => (
            <button
              key={genre.id}
              id={`genre-pill-${genre.id}`}
              onClick={() => handleGenreClick(genre.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
                selectedGenre === genre.id
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25 font-bold'
                  : `hover:bg-white/5 ${genre.color}`
              }`}
            >
              {genre.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Workspace */}
      <div className="mt-2 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-mono">Querying legal sound databases...</span>
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-1.5 glass p-4 rounded-3xl">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-slate-400 px-4 pb-2 border-b border-white/10 mb-2">
              <span className="flex-1"># Title / Artist</span>
              <span className="hidden sm:block flex-1 max-w-[150px] pr-4">Album</span>
              <span className="w-16 text-right">Time</span>
            </div>
            {tracks.map((track, index) => (
              <TrackRow
                key={`${track.id}-${index}`}
                track={track}
                index={index}
                tracksList={tracks}
              />
            ))}
          </div>
        ) : (
          /* Empty / Initial State */
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <div className="p-4 rounded-full bg-white/5 text-slate-400 mb-4 border border-white/10">
              <Search className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Find Your Perfect Vibe</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
              Use the search bar above to query specific artists, or click on a quick-browse genre pill to discover ambient background moods.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
