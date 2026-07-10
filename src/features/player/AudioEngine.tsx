import { useEffect, useRef } from 'react';
import { usePlayerStore } from './playerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    setIsPlaying,
    setProgress,
    nextTrack,
    prevTrack,
  } = usePlayerStore();

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Handle audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    const handleEnded = () => {
      nextTrack();
    };
    const handleError = (e: any) => {
      console.warn('Audio play error, auto skipping to next track...', e);
      // Skip if playing and fails
      if (isPlaying) {
        setTimeout(() => {
          nextTrack();
        }, 1500);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setIsPlaying, setProgress, nextTrack]);

  // Sync track source and isPlaying state together to avoid play-promise race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Sync URL
      if (audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.load();
      }

      // Sync playback state
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Playback request was deferred or interrupted:', err);
          });
        }
      } else {
        audio.pause();
      }
    } else {
      audio.src = '';
      audio.pause();
      if (isPlaying) {
        setIsPlaying(false);
      }
    }
  }, [currentTrack, isPlaying, setIsPlaying]);

  // Sync volume state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Setup OS Media Session controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName,
      artwork: [
        {
          src: currentTrack.coverUrl,
          sizes: '256x256',
          type: 'image/jpeg',
        },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      }
    };
  }, [currentTrack, nextTrack, prevTrack, setIsPlaying]);

  // We provide a way for components to seek by attaching a callback or checking a custom state
  // We can subscribe to playerStore's progressive seek actions if needed
  // Instead of an active listener for seek, we can listen for window events or a ref on window
  useEffect(() => {
    const handleCustomSeek = (e: Event) => {
      const customEvent = e as CustomEvent<{ time: number }>;
      if (audioRef.current && customEvent.detail) {
        audioRef.current.currentTime = customEvent.detail.time;
      }
    };

    window.addEventListener('harmony-seek', handleCustomSeek);
    return () => window.removeEventListener('harmony-seek', handleCustomSeek);
  }, []);

  return null; // Invisible core engine
}

// Global utility for easy manual seeking across the app
export function seekAudio(time: number) {
  window.dispatchEvent(new CustomEvent('harmony-seek', { detail: { time } }));
}
