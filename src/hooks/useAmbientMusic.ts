import { useStore } from '@/store/useStore';
import { useEffect, useRef } from 'react';

/**
 * Hook pour gérer la musique d'ambiance
 * Respecte les contraintes des navigateurs concernant la lecture automatique :
 * - La lecture automatique nécessite que l'utilisateur ait interagi avec la page
 * - Ou que le média soit muet (muted)
 *
 * La musique démarre au chargement. Si la lecture automatique est bloquée,
 * la musique se lancera à la première interaction de l'utilisateur.
 */
export function useAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasUserInteracted = useRef(false);
  const { ambientMusicEnabled, ambientMusicVolume, setAmbientMusicPlaying } = useStore();

  // Créer l'élément audio et attacher les listeners d'événements audio
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio('/sounds/velvet-office-hours-442544_trim.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      audioRef.current = audio;

      const onPlay = () => setAmbientMusicPlaying(true);
      const onPause = () => setAmbientMusicPlaying(false);

      audio.addEventListener('play', onPlay);
      audio.addEventListener('playing', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onPause);

      return () => {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('playing', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onPause);
        try {
          audio.pause();
        } catch {
          // ignore cleanup errors
        }
      };
    }
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attacher des listeners d'interaction utilisateur (clic, touche, clavier)
  // pour lancer la musique si la lecture automatique a été bloquée.
  useEffect(() => {
    const tryPlayOnInteraction = async () => {
      if (hasUserInteracted.current) return;
      hasUserInteracted.current = true;
      const audio = audioRef.current;
      if (audio && ambientMusicEnabled) {
        try {
          await audio.play();
          setAmbientMusicPlaying(true);
        } catch {
          // play failed after interaction
          setAmbientMusicPlaying(false);
        }
      }
    };

    document.addEventListener('click', tryPlayOnInteraction, { once: true });
    document.addEventListener('keydown', tryPlayOnInteraction, { once: true });
    document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });

    return () => {
      document.removeEventListener('click', tryPlayOnInteraction);
      document.removeEventListener('keydown', tryPlayOnInteraction);
      document.removeEventListener('touchstart', tryPlayOnInteraction);
    };
  }, [ambientMusicEnabled, setAmbientMusicPlaying]);

  // Gérer uniquement le volume (sans toucher à la lecture)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = ambientMusicVolume;
  }, [ambientMusicVolume]);

  // Gérer la lecture/pause selon la préférence (séparé du volume)
  // Ne réagit qu'à ambientMusicEnabled car les événements de visibilité
  // sont gérés directement par les handlers blur/focus/visibility
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (ambientMusicEnabled) {
      // La musique doit jouer
      audio
        .play()
        .then(() => {
          setAmbientMusicPlaying(true);
        })
        .catch(() => {
          // Lecture automatique bloquée, on attend l'interaction
          setAmbientMusicPlaying(false);
        });
    } else {
      // La musique ne doit pas jouer
      audio.pause();
      audio.currentTime = 0;
      setAmbientMusicPlaying(false);
    }
  }, [ambientMusicEnabled, setAmbientMusicPlaying]);

  // Mettre la musique en pause si l'onglet perd le focus / devient caché
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pauseAudio = () => {
      try {
        audio.pause();
      } catch {
        // ignore pause errors
      }
    };

    const resumeAudio = () => {
      if (ambientMusicEnabled) {
        audio.play().catch(() => {});
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pauseAudio();
      } else {
        resumeAudio();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', pauseAudio);
    window.addEventListener('blur', pauseAudio);
    window.addEventListener('focus', resumeAudio);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', pauseAudio);
      window.removeEventListener('blur', pauseAudio);
      window.removeEventListener('focus', resumeAudio);
    };
  }, [ambientMusicEnabled]);

  // Retourner une fonction pour essayer de jouer manuellement
  // (utile en cas de blocage de lecture automatique)
  return {
    tryPlay: async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setAmbientMusicPlaying(true);
          return true;
        } catch (error) {
          console.error('Erreur lors de la lecture de la musique:', error);
          return false;
        }
      }
      return false;
    },
  };
}
