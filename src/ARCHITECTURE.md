# Resona: Architecture & Design

## 1. Screens & Navigation Map

Resona uses a single-screen layout with fluid tab-based navigation for a high-performance, seamless experience (no page refreshes, instant transitions, and continuous music playback):

- **Home**: Discover curated playlists, featured free/legal tracks, and daily genres (e.g., Chill, Lo-Fi, Ambient, Electronic, Acoustic).
- **Search**: Real-time searching of Jamendo tracks with options to filter by genre, tags, or mood.
- **Library**: Access favorites, custom playlists, and listening history (all safely saved in `localStorage`).
- **Now Playing (Drawer/Overlay)**: A fully immersive, beautiful visualization screen featuring a rotating vinyl-style art disc, custom progress bars, volume controls, and track details.
- **Bottom Playback Bar**: A persistent player that remains visible across all screens so playback is never interrupted.

---

## 2. Data Flow & TypeScript Schema

The Jamendo API returns track lists with varying shapes. We will map all raw responses to a strict, clean internal `Track` schema:

```typescript
export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds: number;
  licenseUrl?: string;
  source: "jamendo" | "internet_archive";
}
```

### Zustand State Store (`usePlayerStore`)

Playback and queue state are centralized in a reactive Zustand store for high-fidelity sync:

- **State**: `currentTrack`, `isPlaying`, `volume`, `progress`, `queue` (list of active tracks), `history` (previously played), `favorites` (starred track IDs), `customPlaylists`.
- **Actions**: `play(track)`, `pause()`, `next()`, `prev()`, `setVolume(v)`, `seek(time)`, `addToQueue(track)`, `toggleFavorite(track)`.

---

## 3. Folder Structure

We organize code modularly for safety and token limit management:

```text
/src
├── /components         # Universal UI elements (Buttons, Sliders, Cards)
├── /features
│   ├── /player         # HTML5 Audio engine, PlayerBar, ImmersivePlayer
│   ├── /search         # Jamendo search, filter panels, search state
│   ├── /library        # Playlist management, Favorite lists, History
│   └── /home           # Curated recommendations, moods, tags
├── /lib
│   └── /api.ts         # Client wrapper for Jamendo / Internet Archive APIs
├── App.tsx             # Entry layout and Navigation Container
├── index.css           # Global custom theme & font styling
├── main.tsx            # App bootstrap
└── types.ts            # Common type definitions
```

---

## 4. Error, Empty, and Loading States

- **API Failures / Missing Key**: If the Jamendo Client ID is missing or fails, we fall back gracefully to a curated public client ID or provide a list of high-quality preloaded public-domain tracks.
- **Track Load Errors (404/Timeout)**: If a streaming URL fails to load, the UI displays a subtle error banner and offers to skip to the next track automatically rather than crashing.
- **Empty Library / No Search Results**: Display clean, illustrative states with direct action buttons (e.g., "Search for songs to add to your library" or "Try searching for Chill").

---

## 5. Explicitly Out of Scope for v1

- Multi-user remote synchronization (no custom server databases in v1 to ensure absolute rock-solid reliability).
- Premium music platforms (Spotify/SoundCloud integrations), as we strictly abide by the Free/Creative Commons legal guidelines.
- Social sharing feeds or messaging.
