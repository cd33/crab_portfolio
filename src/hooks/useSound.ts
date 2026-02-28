import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Hook for managing HTML5 audio playback
 *
 * @param src - Path to audio file
 * @param options - Audio configuration
 * @returns Audio control methods and state
 */
export function useSound(
  src: string,
  options: {
    volume?: number;
    loop?: boolean;
    playbackRate?: number;
    enabled?: boolean;
  } = {}
) {
  const { volume = 1, loop = false, playbackRate = 1, enabled = true } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize audio element (only when src, enabled, or loop changes)
  useEffect(() => {
    if (!enabled || !src?.trim()) {
      if (!src?.trim()) console.error('useSound: Invalid src provided:', src);
      return;
    }

    const audio = new Audio(src);
    audio.loop = loop;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlay = () => setIsLoaded(true);
    const handleError = (e: ErrorEvent) => console.error('useSound: Failed to load audio:', src, e);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError as EventListener);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError as EventListener);
      audio.pause();
      audio.src = '';
    };
  }, [src, enabled, loop]);

  // Update volume and playback rate without recreating audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Pause audio when window loses focus or tab is hidden
  useEffect(() => {
    const wasPlayingRef = { current: false };
    const audio = audioRef.current;
    if (!audio) return;

    const pauseIfPlaying = () => {
      wasPlayingRef.current = !audio.paused;
      if (wasPlayingRef.current) audio.pause();
    };

    const resumeIfWasPlaying = () => {
      if (wasPlayingRef.current && enabled) {
        audio.play().catch(() => {});
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pauseIfPlaying();
      } else {
        resumeIfWasPlaying();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', pauseIfPlaying);
    window.addEventListener('focus', resumeIfWasPlaying);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', pauseIfPlaying);
      window.removeEventListener('focus', resumeIfWasPlaying);
    };
  }, [enabled]);

  const play = useCallback(() => {
    if (!enabled || !audioRef.current || !isLoaded) return;

    // Only restart if not already playing (for loops)
    if (!isPlaying) {
      audioRef.current.currentTime = 0;
    }

    audioRef.current.play().catch((error) => {
      // Silently ignore autoplay policy errors (expected on page load)
      if (error.name !== 'NotAllowedError') {
        console.warn('Audio playback failed:', error);
      }
    });
  }, [enabled, isLoaded, isPlaying]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
  }, []);

  return useMemo(
    () => ({
      play,
      pause,
      stop,
      setVolume,
      isPlaying,
      isLoaded,
    }),
    [play, pause, stop, setVolume, isPlaying, isLoaded]
  );
}
