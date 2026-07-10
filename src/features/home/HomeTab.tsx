import React, { useState, useEffect } from "react";
import { usePlayerStore } from "../player/playerStore";
import { fetchJamendoTracks, fetchInternetArchiveTracks } from "../../lib/api";
import { Track } from "../../types";
import TrackRow from "../../components/TrackRow";
import { Sparkles, Play, Music, Flame, Loader2, Film } from "lucide-react";

const REGIONAL_STATIONS = [
  {
    id: "telugu",
    title: "Tollywood Hits",
    subtitle: "Telugu movie blockbusters & melodies",
    color: "from-orange-500/10 to-amber-600/25 border-orange-500/20",
    tags: "telugu",
    cover:
      "https://images.unsplash.com/photo-1513829096999-4978602297a7?w=400&q=80",
  },
  {
    id: "hindi",
    title: "Bollywood Hits",
    subtitle: "Hindi film classics & romantic hits",
    color: "from-red-500/10 to-rose-600/25 border-rose-500/20",
    tags: "hindi",
    cover:
      "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80",
  },
  {
    id: "tamil",
    title: "Kollywood Hits",
    subtitle: "Tamil cinema rhythm & orchestrations",
    color: "from-blue-500/10 to-indigo-600/25 border-blue-500/20",
    tags: "tamil",
    cover:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80",
  },
  {
    id: "malayalam",
    title: "Mollywood Tunes",
    subtitle: "Malayalam acoustic unplugged & melodies",
    color: "from-emerald-500/10 to-teal-600/25 border-emerald-500/20",
    tags: "malayalam",
    cover:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80",
  },
];

const MOOD_PLAYLISTS = [
  {
    id: "lofi",
    title: "Lofi Dreams",
    subtitle: "Warm beats & vinyl noise",
    color: "from-amber-600/30 to-rose-600/30 border-amber-500/20",
    tags: "lofi",
    cover:
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&q=80",
  },
  {
    id: "ambient",
    title: "Deep Space Focus",
    subtitle: "Cosmic drones & soundscapes",
    color: "from-indigo-600/30 to-purple-600/30 border-indigo-500/20",
    tags: "ambient",
    cover:
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80",
  },
  {
    id: "electronic",
    title: "Retro Synthwave",
    subtitle: "Neon grids & analog drive",
    color: "from-pink-600/30 to-fuchsia-600/30 border-pink-500/20",
    tags: "synthwave",
    cover:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
  },
  {
    id: "acoustic",
    title: "Acoustic Sunrise",
    subtitle: "Gentle strings & clean morning air",
    color: "from-emerald-600/30 to-teal-600/30 border-emerald-500/20",
    tags: "acoustic",
    cover:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
  },
];

export default function HomeTab() {
  const [trending, setTrending] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, setActiveTab, setSelectedGenre, setSearchQuery } =
    usePlayerStore();

  useEffect(() => {
    async function loadTrending() {
      try {
        const topTracks = await fetchJamendoTracks({
          limit: 10,
          order: "popularity_total",
        });
        setTrending(topTracks);
      } catch (error) {
        console.warn("Failed to load trending tracks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTrending();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleMoodPlay = async (tag: string) => {
    setLoading(true);
    try {
      let moodTracks: Track[] = [];
      const isRegional = ["telugu", "hindi", "tamil", "malayalam"].includes(
        tag.toLowerCase(),
      );
      if (isRegional) {
        moodTracks = await fetchInternetArchiveTracks(tag);
      } else {
        moodTracks = await fetchJamendoTracks({ genre: tag, limit: 15 });
      }

      if (moodTracks.length > 0) {
        playTrack(moodTracks[0], moodTracks);
      }
    } catch (e) {
      console.warn("Could not auto-play mood:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExploreGenre = (tag: string) => {
    setSearchQuery("");
    setSelectedGenre(tag);
    setActiveTab("search");
  };

  return (
    <div
      id="home-tab-view"
      className="space-y-8 w-full max-w-4xl mx-auto pb-28"
    >
      {/* Header Greeting */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>{getGreeting()}</span>
          <span className="animate-pulse">✨</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans">
          Welcome to Resona. Tap any card below to dive straight into licensed,
          ad-free ambient sound streams.
        </p>
      </div>

      {/* Featured Mood Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Curated Mood Stations
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOOD_PLAYLISTS.map((mood) => (
            <div
              key={mood.id}
              id={`mood-card-${mood.id}`}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${mood.color} p-5 flex flex-col justify-between h-44 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-300`}
              onClick={() => handleExploreGenre(mood.tags)}
            >
              {/* Background Cover Image overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                style={{ backgroundImage: `url(${mood.cover})` }}
              />

              <div className="relative z-10">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-full text-zinc-200">
                  Moodpack
                </span>
                <h4 className="text-lg font-bold text-white mt-3 tracking-tight">
                  {mood.title}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">
                  {mood.subtitle}
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-4">
                <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-300 transition-colors">
                  Explore tags
                </span>

                <button
                  id={`btn-play-mood-${mood.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoodPlay(mood.tags);
                  }}
                  className="p-3 bg-white hover:bg-indigo-400 text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 flex items-center justify-center hover:rotate-12"
                  title="Play Mood Instantly"
                >
                  <Play className="w-4 h-4 fill-currentColor ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regional Cinema Stations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Indian Cinema Stations
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REGIONAL_STATIONS.map((station) => (
            <div
              key={station.id}
              id={`station-card-${station.id}`}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${station.color} p-5 flex flex-col justify-between h-44 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-300`}
              onClick={() => handleExploreGenre(station.tags)}
            >
              {/* Background Cover Image overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                style={{ backgroundImage: `url(${station.cover})` }}
              />

              <div className="relative z-10">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full text-indigo-200">
                  Regional Radio
                </span>
                <h4 className="text-lg font-bold text-white mt-3 tracking-tight">
                  {station.title}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">
                  {station.subtitle}
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-4">
                <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-300 transition-colors">
                  Explore playlist
                </span>

                <button
                  id={`btn-play-station-${station.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoodPlay(station.tags);
                  }}
                  className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 flex items-center justify-center hover:rotate-12"
                  title="Play Radio Instantly"
                >
                  <Play className="w-4 h-4 fill-currentColor ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Today */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Trending on Jamendo
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            POPULAR LICENSES
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            <span className="text-xs font-mono">
              Curating popular legal tracks...
            </span>
          </div>
        ) : trending.length > 0 ? (
          <div className="space-y-1.5 glass p-4 rounded-3xl">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-slate-400 px-4 pb-2 border-b border-white/10 mb-2">
              <span className="flex-1"># Title / Artist</span>
              <span className="hidden sm:block flex-1 max-w-[150px] pr-4">
                Album
              </span>
              <span className="w-16 text-right">Time</span>
            </div>
            {trending.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                tracksList={trending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 glass rounded-3xl">
            Failed to load hot charts. Explore via search bar instead!
          </div>
        )}
      </section>
    </div>
  );
}
