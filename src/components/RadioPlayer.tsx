'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Radio
} from 'lucide-react';
import { usePlayer } from '@/lib/PlayerContext';
import Image from 'next/image';

// Declarar YT de forma segura
declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

const RadioPlayer = () => {
  const { playerState, togglePlay, playNext, playPrevious, setIsPlaying } = usePlayer();
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const radioUrl = "https://streams.radio.co/s7e8f19c33/listen";
  const previousSourceRef = useRef<string>('');
  const progressBarRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytTimerRef = useRef<any>(null);

  const loadYouTubeAPI = async () => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) return;
    await new Promise<void>((resolve) => {
      const existing = document.getElementById('youtube-iframe-api');
      if (existing) {
        const check = () => {
          if (window.YT && window.YT.Player) { resolve(); }
          else setTimeout(check, 50);
        };
        check();
        return;
      }
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => resolve();
    });
  };

  const extractYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      // playlist entries in Atom usually provide direct watch?v=; handled above
      const m = url.match(/[?&]v=([^&]+)/);
      return m ? m[1] : null;
    } catch {
      const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
      return m ? m[1] : null;
    }
  };

  const isYouTubeUrl = (src: string) => /youtube\.com|youtu\.be/.test(src);

  const cleanHtml = (htmlString: string): string => {
    if (typeof window !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = htmlString;
      return div.textContent || div.innerText || '';
    }
    return htmlString.replace(/<[^>]*>/g, '');
  };

  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Sincronizar volumen con YouTube y audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume((isMuted ? 0 : volume) * 100);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioState = async () => {
      try {
        if (!playerState.isPlaying) {
          audio.pause();
          if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo?.();
          return;
        }

        let newSource = '';
        if (playerState.type === 'radio') {
          newSource = radioUrl + '?t=' + Date.now();
        } else if (playerState.currentEpisode) {
          newSource = playerState.currentEpisode.audioUrl;
        }
        if (!newSource) return;

        const isYT = isYouTubeUrl(newSource);
        if (isYT) {
          const videoId = extractYouTubeId(newSource);
          if (!videoId) {
            setIsPlaying(false);
            return;
          }
          setIsLoading(true);
          await loadYouTubeAPI();
          if (!ytPlayerRef.current) {
            ytPlayerRef.current = new window.YT.Player('yt-hidden-player', {
              height: '0',
              width: '0',
              videoId,
              playerVars: { autoplay: 1, controls: 0, modestbranding: 1 },
              events: {
                onReady: () => {
                  ytPlayerRef.current.setVolume((isMuted ? 0 : volume) * 100);
                  ytPlayerRef.current.playVideo();
                  setIsLoading(false);
                  // timer de progreso
                  if (ytTimerRef.current) clearInterval(ytTimerRef.current);
                  ytTimerRef.current = setInterval(() => {
                    const ct = ytPlayerRef.current?.getCurrentTime?.() || 0;
                    const du = ytPlayerRef.current?.getDuration?.() || 0;
                    setCurrentTime(ct);
                    setDuration(du);
                  }, 500);
                },
                onStateChange: (e: any) => {
                  // 0 ended, 1 playing, 2 paused
                  if (e.data === 0) setIsPlaying(false);
                }
              }
            });
          } else {
            ytPlayerRef.current.loadVideoById(videoId);
            ytPlayerRef.current.setVolume((isMuted ? 0 : volume) * 100);
            ytPlayerRef.current.playVideo();
            setIsLoading(false);
          }
          previousSourceRef.current = newSource;
          return;
        }

        // Reproducción estándar con <audio>
        // Limpiar YouTube si estaba en uso
        if (ytTimerRef.current) { clearInterval(ytTimerRef.current); ytTimerRef.current = null; }
        if (ytPlayerRef.current) { try { ytPlayerRef.current.stopVideo?.(); } catch {} }

        if (previousSourceRef.current !== newSource) {
          setIsLoading(true);
          audio.src = newSource;
          previousSourceRef.current = newSource;
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              audio.removeEventListener('canplay', handleCanPlay);
              resolve(true);
            };
            audio.addEventListener('canplay', handleCanPlay);
            audio.load();
          });
          await audio.play();
          setIsLoading(false);
        } else if (audio.paused) {
          await audio.play();
        }
      } catch (error) {
        console.error('Error al reproducir:', error);
        setIsPlaying(false);
        setIsLoading(false);
      }
    };

    handleAudioState();
    return () => {
      // nada aquí, limpieza se maneja al cambiar de fuente
    };
  }, [playerState.isPlaying, playerState.type, playerState.currentEpisode, setIsPlaying]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    if (playerState.type === 'radio') return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    if (isYouTubeUrl(previousSourceRef.current) && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo?.(newTime, true);
      setCurrentTime(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerState.type === 'radio') return;
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    if (isYouTubeUrl(previousSourceRef.current) && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo?.(newTime, true);
      setCurrentTime(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDragging, duration]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (isYouTubeUrl(previousSourceRef.current) && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume?.((isMuted ? 0 : newVolume) * 100);
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) setIsMuted(true); else setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      if (isYouTubeUrl(previousSourceRef.current) && ytPlayerRef.current) {
        ytPlayerRef.current.setVolume?.(volume * 100);
      } else if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      setIsMuted(false);
    } else {
      if (isYouTubeUrl(previousSourceRef.current) && ytPlayerRef.current) {
        ytPlayerRef.current.setVolume?.(0);
      } else if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      setIsMuted(true);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleError = () => {
    setIsLoading(false);
    setIsPlaying(false);
  };

  const getVolumeBackground = () => {
    const percent = ((isMuted ? 0 : volume) * 100);
    return {
      '--progress': `${percent}%`
    } as React.CSSProperties;
  };

  const getProgressBackground = () => {
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
    return {
      '--progress': `${percent}%`
    } as React.CSSProperties;
  };

  const canGoNext = playerState.type === 'podcast' && 
    playerState.currentIndex !== undefined && 
    playerState.episodesList && 
    playerState.currentIndex < playerState.episodesList.length - 1;

  const canGoPrevious = playerState.type === 'podcast' && 
    playerState.currentIndex !== undefined && 
    playerState.episodesList && 
    playerState.currentIndex > 0;

  return (
    <div className="fixed bottom-1 left-0 right-0 bg-[#2F3037] mx-1 rounded-xl rounded-t-none text-[#C7C7C7] z-50">
      {/* Contenedor oculto para YouTube */}
      <div id="yt-hidden-player" className="hidden" />
      <audio
        ref={audioRef}
        preload="none"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => {
          setIsLoading(false);
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration || 0);
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
        }}
        onError={handleError}
      />
      
      {playerState.type === 'podcast' && (
        <div className="w-full h-2 bg-white/30 rounded-full cursor-pointer">
          <div 
            ref={progressBarRef}
            className="relative h-full group"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
          >
            <div 
              className="h-full bg-[#D51F2F] relative radio-progress-bar"
              style={getProgressBackground()}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="flex items-center space-x-3">
            {playerState.type === 'radio' ? (
              <>
                <Radio className="w-5 h-5 text-[#D51F2F]" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">Radio en Vivo</p>
                  <p className="text-xs text-gray-400 truncate">
                    {playerState.isPlaying ? 'Transmisión en directo' : 'Pausado'}
                  </p>
                </div>
              </>
            ) : playerState.currentShow && playerState.currentEpisode ? (
              <>
                <Image
                  src={playerState.currentShow.imageUrl || '/placeholder-podcast.jpg'}
                  alt={cleanHtml(playerState.currentShow.title)}
                  width={40}
                  height={40}
                  className="rounded-lg lg:w-16 lg:h-16"
                />
                <div className="min-w-0 hidden lg:block max-w-[300px]">
                  <p className="font-medium text-sm lg:text-base truncate">{cleanHtml(playerState.currentEpisode.title)}</p>
                  <p className="text-xs text-gray-400 truncate">{cleanHtml(playerState.currentShow.title)}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {playerState.type === 'podcast' && (
          <div className="text-xs text-gray-400 mx-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button
            onClick={playNext}
            disabled={!canGoNext}
            className={`p-2 rounded-full transition-colors ${
              canGoNext 
                ? 'hover:bg-gray-700 hover:text-[#D51F2F]' 
                : 'text-gray-500 cursor-not-allowed'
            }`}
            title={playerState.type === 'radio' ? 'No disponible para radio en vivo' : 'Episodio anterior'}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="rounded-full hover:text-[#D51F2F] duration-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={playerState.isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : playerState.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={playPrevious}
            disabled={!canGoPrevious}
            className={`p-2 rounded-full transition-colors ${
              canGoPrevious 
                ? 'hover:bg-gray-700 hover:text-[#D51F2F]' 
                : 'text-gray-500 cursor-not-allowed'
            }`}
            title={playerState.type === 'radio' ? 'No disponible para radio en vivo' : 'Siguiente episodio'}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-3 min-w-0 flex-1 justify-end">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center space-x-2 w-24">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer radio-volume-slider"
              style={getVolumeBackground()}
              title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer; 