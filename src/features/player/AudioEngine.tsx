import { useEffect, useRef } from "react";
import { usePlayerStore } from "./playerStore";

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const skipTimeoutRef = useRef<any>(null);

  // Destructure reactive states from store to trigger correct sync effects
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);

  // Create audio element ONCE on mount and hook up stable handlers
  useEffect(() => {
    const audio = new Audio();
    audio.loop = false; // ensure standard progression
    audioRef.current = audio;

    // Handle audio events using fresh state lookups directly from store
    const handlePlay = () => usePlayerStore.getState().setIsPlaying(true);
    const handlePause = () => {
      // Ignore pause events that happen during track loading/transitions (where currentTime is 0)
      if (audio.currentTime === 0) return;
      usePlayerStore.getState().setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      usePlayerStore.getState().setProgress(audio.currentTime);
    };

    const handleEnded = () => {
      const store = usePlayerStore.getState();
      const oldTrackId = store.currentTrack?.id;

      // Advance store queue to next track
      store.nextTrack();

      const newState = usePlayerStore.getState();
      const newTrackId = newState.currentTrack?.id;

      // Safety/Repeat Mode: If the track is the same (e.g., repeat-one or queue length 1),
      // we must manually restart playback since the URL sync won't trigger a reload.
      if (oldTrackId === newTrackId) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => console.warn("Auto-replay failed:", err));
        }
      }
    };

    const handleError = (e: any) => {
      const error = audio.error;
      // Code 1 is MEDIA_ERR_ABORTED. Triggered when source resets or load is aborted.
      // This is expected normal behavior during track transitions, so we must ignore it!
      if (error && error.code === 1) {
        return;
      }

      console.warn("Audio play error, auto skipping to next track...", error);
      const store = usePlayerStore.getState();
      if (store.isPlaying) {
        // Clear any previous timeout to avoid scheduling multiple parallel skips
        if (skipTimeoutRef.current) {
          clearTimeout(skipTimeoutRef.current);
        }

        skipTimeoutRef.current = setTimeout(() => {
          const currentStore = usePlayerStore.getState();
          if (currentStore.isPlaying) {
            currentStore.nextTrack();
          }
        }, 1500);
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      
      // Clear timeout on unmount
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures audio instance is stable

  // Sync track source and isPlaying state together to avoid play-promise race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Clear any pending error skip timeouts since we are loading/playing a new track
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = null;
      }

      // Sync URL using unique track ID instead of URL string comparison
      if (loadedTrackIdRef.current !== currentTrack.id) {
        loadedTrackIdRef.current = currentTrack.id;
        audio.src = currentTrack.audioUrl;
        audio.load();
      }

      // Sync playback state
      if (isPlaying) {
        // If the audio was ended or near the end and we start playing, reset to 0
        if (audio.ended || audio.currentTime >= audio.duration) {
          audio.currentTime = 0;
        }
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Playback request was deferred or interrupted:", err);
          });
        }
      } else {
        audio.pause();
      }
    } else {
      // Clear skip timeout if track is cleared
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = null;
      }
      loadedTrackIdRef.current = null;
      audio.src = "";
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  // Sync volume state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Setup OS Media Session controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName,
      artwork: [
        {
          src: currentTrack.coverUrl,
          sizes: "256x256",
          type: "image/jpeg",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () =>
      usePlayerStore.getState().setIsPlaying(true),
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      usePlayerStore.getState().setIsPlaying(false),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      usePlayerStore.getState().nextTrack(),
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      usePlayerStore.getState().prevTrack(),
    );

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
      }
    };
  }, [currentTrack]);

  // Handle custom seek requests
  useEffect(() => {
    const handleCustomSeek = (e: Event) => {
      const customEvent = e as CustomEvent<{ time: number }>;
      if (audioRef.current && customEvent.detail) {
        audioRef.current.currentTime = customEvent.detail.time;
      }
    };

    window.addEventListener("Resona-seek", handleCustomSeek);
    return () => window.removeEventListener("Resona-seek", handleCustomSeek);
  }, []);

  return null; // Invisible core engine
}

// Global utility for easy manual seeking across the app
export function seekAudio(time: number) {
  window.dispatchEvent(new CustomEvent("Resona-seek", { detail: { time } }));
}
