'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX,
  SkipBack, SkipForward,
  ChevronUp, ChevronDown,
  List,
} from 'lucide-react';
import { usePlayer } from '@/lib/PlayerContext';
import Image from 'next/image';

/* ─── Radio.co API ─────────────────────────────────────── */
interface RadioTrack {
  title: string;
  start_time: string;
  artwork_url: string | null;
  artwork_url_large: string | null;
}
interface RadioStatus {
  status: string;
  current_track: RadioTrack;
  history: RadioTrack[];
  logo_url: string | null;
}

const RADIO_STREAM = 'https://s5.radio.co/sd515b7b34/listen';
const STATUS_API = 'https://public.radio.co/stations/sd515b7b34/status';
const FILTER_KW = ['PISTA', 'JINGLE', 'SELLO', 'INTRO', 'NEWS'];
const SMALL_WORDS = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is']);

function toTitleCase(str: string) {
  return str.toLowerCase().split(' ')
    .map((w, i) => (i === 0 || !SMALL_WORDS.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
}

function parseTitle(title: string) {
  const idx = title.indexOf(' - ');
  if (idx !== -1) return { artist: toTitleCase(title.slice(0, idx).trim()), song: toTitleCase(title.slice(idx + 3).trim()) };
  return { artist: '', song: toTitleCase(title.trim()) };
}

function filterTrack(title: string) {
  return FILTER_KW.some(k => title.toUpperCase().includes(k));
}

function elapsed(startTime: string) {
  if (!startTime) return '0:00';
  const s = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* ─── Component ─────────────────────────────────────────── */
export default function RadioPlayer() {
  const { playerState, togglePlay, playRadio, playNext, playPrevious, setIsPlaying } = usePlayer();

  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContainerFull, setIsContainerFull] = useState(false);
  const [mobileView, setMobileView] = useState<'player' | 'tracklist'>('player');

  const openExpanded = useCallback(() => { setIsContainerFull(true); setIsExpanded(true); }, []);
  const closeExpanded = useCallback(() => { setIsExpanded(false); }, []);
  const toggleExpanded = useCallback(() => { isExpanded ? closeExpanded() : openExpanded(); }, [isExpanded, openExpanded, closeExpanded]);

  const [radioStatus, setRadioStatus] = useState<RadioStatus | null>(null);
  const [elapsedStr, setElapsedStr] = useState('0:00');
  const [historyArtworks, setHistoryArtworks] = useState<Record<string, string>>({});
  const artworkCacheRef = useRef<Map<string, string | null>>(new Map());

  /* Dos elementos separados: la radio se liga al grafo de Web Audio (visualizador);
     los podcasts reproducen directo. Esto evita que el grafo "tainted" silencie los podcasts. */
  const radioRef = useRef<HTMLAudioElement>(null);
  const podcastRef = useRef<HTMLAudioElement>(null);
  const prevSrcRef = useRef('');
  const prevTypeRef = useRef<'radio' | 'podcast' | ''>('');
  const progressBarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef<Float32Array | null>(null);

  const activeAudio = () => (playerState.type === 'radio' ? radioRef.current : podcastRef.current);

  /* ── Radio status polling ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(STATUS_API);
      const data: RadioStatus = await res.json();
      setRadioStatus(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 15000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    const startTime = radioStatus?.current_track?.start_time;
    if (!startTime) return;
    const tick = () => setElapsedStr(elapsed(startTime));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [radioStatus?.current_track?.start_time]);

  /* ── iTunes artwork fallback ── */
  const fetchArtwork = useCallback(async (title: string): Promise<string | null> => {
    if (artworkCacheRef.current.has(title)) return artworkCacheRef.current.get(title) ?? null;
    try {
      const res = await fetch(`/api/artwork?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      artworkCacheRef.current.set(title, data.url ?? null);
      return data.url ?? null;
    } catch {
      artworkCacheRef.current.set(title, null);
      return null;
    }
  }, []);

  useEffect(() => {
    const missing = (radioStatus?.history ?? []).filter(t => !t.artwork_url && !artworkCacheRef.current.has(t.title));
    if (!missing.length) return;
    Promise.all(missing.map(async t => {
      const url = await fetchArtwork(t.title);
      return url ? { title: t.title, url } : null;
    })).then(results => {
      const entries = results.filter(Boolean) as { title: string; url: string }[];
      if (entries.length) {
        setHistoryArtworks(prev => {
          const next = { ...prev };
          entries.forEach(({ title, url }) => { next[title] = url; });
          return next;
        });
      }
    });
  }, [radioStatus?.history, fetchArtwork]);

  /* Construye el grafo de audio UNA vez. createMediaElementSource enruta el audio por el
     AudioContext; por eso DEBEMOS reconectar analyser → destination o el audio se silencia.
     Solo se llama desde un gesto del usuario (click en play) para que el contexto arranque. */
  const ensureGraph = useCallback(() => {
    if (audioCtxRef.current || !radioRef.current) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const actx: AudioContext = new AC();
      const source = actx.createMediaElementSource(radioRef.current);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(actx.destination);
      audioCtxRef.current = actx;
      analyserRef.current = analyser;
    } catch { /* no soportado — animación */ }
  }, []);

  /* Helper para botones de play y expand: inicializa el grafo y reanuda el contexto
     de forma awaitable antes de llamar a la acción. resume() devuelve una Promise —
     sin await puede que el contexto siga suspendido cuando la acción corra. */
  const handlePlay = useCallback(async (action: () => void) => {
    ensureGraph();
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume().catch(() => {});
    }
    action();
  }, [ensureGraph]);

  /* ── Visualizer ── */
  const drawViz = useCallback(() => {
    // Cancelar cualquier loop previo antes de arrancar uno nuevo
    cancelAnimationFrame(rafRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BAR_COUNT = 80;
    if (!smoothedRef.current || smoothedRef.current.length !== BAR_COUNT)
      smoothedRef.current = new Float32Array(BAR_COUNT);

    let phase = 0;
    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      phase += 0.035;
      const smoothed = smoothedRef.current!;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const gap = Math.round(3 * dpr);
      // floor para que bw sea entero — evita sub-pixel blur en los bordes
      const bw = Math.floor((W - gap * (BAR_COUNT - 1)) / BAR_COUNT);

      const analyser = analyserRef.current;
      let freqData: Uint8Array<ArrayBuffer> | null = null;
      if (analyser) {
        freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        if (!freqData.some(v => v > 8)) freqData = null;
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        let raw: number;
        if (freqData) {
          const t = Math.abs(i - (BAR_COUNT - 1) / 2) / (BAR_COUNT / 2);
          raw = freqData[Math.min(Math.floor(Math.pow(t, 0.6) * freqData.length * 0.7), freqData.length - 1)] / 255;
        } else {
          const norm = (i / (BAR_COUNT - 1)) * 2 - 1;
          raw = Math.exp(-norm * norm * 2.5) * (0.25 + Math.sin(phase + i * 0.3) * 0.1 + Math.sin(phase * 0.7 + i * 0.5) * 0.07);
        }
        smoothed[i] = raw > smoothed[i] ? smoothed[i] * 0.2 + raw * 0.8 : smoothed[i] * 0.88;
        const bh = Math.max(Math.round(2 * dpr), Math.round(smoothed[i] * H * 0.95));
        const x = Math.round(i * (bw + gap));
        ctx.fillStyle = '#D92A34';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, H - bh, bw, bh, Math.round(2 * dpr));
        else ctx.rect(x, H - bh, bw, bh);
        ctx.fill();
      }
    };
    frame();
  }, []);

  useEffect(() => {
    if (!isExpanded) return; // canvas solo existe en el DOM cuando isExpanded es true
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(canvas.offsetWidth * dpr);
      const h = Math.round(canvas.offsetHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    setSize();
    let rafId = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(setSize);
    });
    ro.observe(canvas);
    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded && playerState.isPlaying) {
      drawViz();
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isExpanded, playerState.isPlaying, drawViz]);

  /* ── Audio playback ── */
  useEffect(() => {
    // Token de cancelación: si el efecto vuelve a correr antes de que run() termine,
    // la invocación anterior detecta cancelled=true y sale sin tocar el DOM.
    let cancelled = false;

    const audio = activeAudio();
    const inactive = playerState.type === 'radio' ? podcastRef.current : radioRef.current;
    if (inactive) inactive.pause();
    if (!audio) return;

    const run = async () => {
      try {
        if (!playerState.isPlaying) { audio.pause(); return; }
        if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();

        let src = '';
        if (playerState.type === 'radio') src = RADIO_STREAM;
        else if (playerState.currentEpisode) src = playerState.currentEpisode.audioUrl;
        if (!src) return;

        const typeChanged = prevTypeRef.current !== playerState.type;
        prevTypeRef.current = playerState.type;

        if (prevSrcRef.current !== src || typeChanged) {
          if (cancelled) return;
          setIsLoading(true);
          audio.src = src;
          prevSrcRef.current = src;
          // canplay con timeout de 10s para evitar que isLoading quede bloqueado
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('canplay timeout')), 10000);
            const h = () => {
              clearTimeout(timeout);
              audio.removeEventListener('canplay', h);
              resolve();
            };
            audio.addEventListener('canplay', h);
            audio.load();
          });
          if (cancelled) return;
          await audio.play();
          if (!cancelled) setIsLoading(false);
        } else if (audio.paused) {
          if (cancelled) return;
          await audio.play();
        }
      } catch {
        if (!cancelled) {
          prevSrcRef.current = '';
          setIsPlaying(false);
          setIsLoading(false);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [playerState.isPlaying, playerState.type, playerState.currentEpisode, setIsPlaying]);

  useEffect(() => {
    const v = isMuted ? 0 : volume;
    if (radioRef.current) radioRef.current.volume = v;
    if (podcastRef.current) podcastRef.current.volume = v;
  }, [volume, isMuted]);

  /* ── Progress seek ── */
  const seek = (clientX: number) => {
    if (!progressBarRef.current || playerState.type === 'radio') return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1)) * duration;
    if (podcastRef.current) podcastRef.current.currentTime = t;
    setCurrentTime(t);
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => seek(e.clientX);
    const up = () => setIsDragging(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [isDragging, duration]);

  const formatTime = (t: number) => {
    if (!isFinite(t) || isNaN(t)) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const cleanHtml = (s: string) => {
    if (typeof window !== 'undefined') { const d = document.createElement('div'); d.innerHTML = s; return d.textContent || ''; }
    return s.replace(/<[^>]*>/g, '');
  };

  /* ── Derived ── */
  const isLive = radioStatus?.status === 'online';
  const ct = radioStatus?.current_track;
  const parsedCurrent = ct && !filterTrack(ct.title) ? parseTitle(ct.title) : { song: 'Radio en Vivo', artist: '' };
  const artworkUrl = ct?.artwork_url || radioStatus?.logo_url || null;
  const history = (radioStatus?.history || []).filter(t => !filterTrack(t.title)).slice(0, 6);
  const canGoNext = playerState.type === 'podcast' && playerState.currentIndex !== undefined && playerState.episodesList && playerState.currentIndex < playerState.episodesList.length - 1;
  const canGoPrev = playerState.type === 'podcast' && playerState.currentIndex !== undefined && playerState.episodesList && playerState.currentIndex > 0;
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const songLabel = playerState.type === 'radio' ? parsedCurrent.song : (playerState.currentEpisode ? cleanHtml(playerState.currentEpisode.title) : 'Radio en Vivo');
  const artistLabel = playerState.type === 'radio' ? parsedCurrent.artist : (playerState.currentShow ? cleanHtml(playerState.currentShow.title) : '');
  const coverImg = playerState.type === 'radio' ? artworkUrl : (playerState.currentShow?.imageUrl || null);

  const LiveBadge = () => isLive ? (
    <div className="inline-flex items-center gap-1.5 bg-[#D92A34] rounded-lg px-2 py-1 w-fit shrink-0">
      <span className="text-white font-semibold text-sm tracking-[0.28px]">En vivo</span>
      <div className="size-2 rounded-full bg-white animate-pulse" />
    </div>
  ) : null;

  /* ════════════════════════════════════════════════════════ */
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col text-white"
      style={{ height: isContainerFull ? '100dvh' : 'auto' }}
    >
      {/* Radio — ligado al grafo de Web Audio. crossOrigin para que el analizador lea datos reales */}
      <audio
        ref={radioRef}
        preload="none"
        crossOrigin="anonymous"
        onLoadStart={() => playerState.type === 'radio' && setIsLoading(true)}
        onCanPlay={() => playerState.type === 'radio' && setIsLoading(false)}
        onPlaying={() => playerState.type === 'radio' && setIsLoading(false)}
        onError={() => { if (playerState.type === 'radio') { prevSrcRef.current = ''; setIsLoading(false); setIsPlaying(false); } }}
      />
      {/* Podcast — reproducción directa, nunca pasa por Web Audio */}
      <audio
        ref={podcastRef}
        preload="none"
        onLoadStart={() => playerState.type === 'podcast' && setIsLoading(true)}
        onCanPlay={() => playerState.type === 'podcast' && setIsLoading(false)}
        onPlaying={() => playerState.type === 'podcast' && setIsLoading(false)}
        onTimeUpdate={e => { if (playerState.type === 'podcast') { setCurrentTime(e.currentTarget.currentTime); setDuration(e.currentTarget.duration || 0); } }}
        onLoadedMetadata={e => { if (playerState.type === 'podcast') setDuration(e.currentTarget.duration || 0); }}
        onError={() => { if (playerState.type === 'podcast') { prevSrcRef.current = ''; setIsLoading(false); setIsPlaying(false); } }}
      />

      {/* ══ EXPANDED ══════════════════════════════════════════ */}
      <AnimatePresence onExitComplete={() => setIsContainerFull(false)}>
      {isExpanded && (
        <motion.div
          key="expanded-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.85 }}
          className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0a0a0a]"
        >
          {/* ── Desktop expanded (lg+) ── */}
          <div className="hidden lg:flex flex-1 min-h-0 border-b border-[#262626] overflow-hidden">

            {/* Left panel */}
            <div className="relative flex-1 flex flex-col items-center border-r border-[#262626] overflow-hidden">
              {coverImg && (
                <div className="absolute inset-0 pointer-events-none">
                  <img src={coverImg} alt="" className="w-full h-full object-cover scale-110 blur-sm opacity-25" />
                  <div className="absolute inset-0 bg-black/75" />
                </div>
              )}
              <div className="relative flex flex-col items-center justify-center gap-8 p-16 flex-1 w-full">
                <div className="relative shrink-0">
                  <svg className="absolute -inset-3 size-[calc(100%+24px)] opacity-40" viewBox="0 0 290 290">
                    <circle cx="145" cy="145" r="141" fill="none" stroke="#D92A34" strokeWidth="1.5" strokeDasharray="4 8" />
                  </svg>
                  <div className="size-[230px] rounded-full border-4 border-[#2a2a2a] overflow-hidden shadow-2xl">
                    {coverImg ? <img src={coverImg} alt={songLabel} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1a1a]" />}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="font-semibold text-2xl text-white/80 tracking-[0.48px]">{songLabel}</p>
                  <p className="font-medium text-base text-white/50 tracking-[0.32px]">{artistLabel}</p>
                </div>
              </div>
              <canvas ref={canvasRef} className="relative w-full shrink-0" style={{ height: 120 }} />
            </div>

            {/* Right sidebar */}
            <div className="w-[496px] flex flex-col shrink-0 overflow-hidden">
              <div className="p-4 flex items-center gap-4 border-b border-[#262626] bg-white/[0.08] shrink-0 cursor-pointer hover:bg-white/[0.12] transition-colors" onClick={() => handlePlay(playRadio)}>
                <div className="relative shrink-0 size-[84px] rounded border border-[#262626] overflow-hidden">
                  {artworkUrl ? <img src={artworkUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1a1a]" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex items-end gap-[2px]">
                      {[9,16,20,12].map((h,i) => <div key={i} className="bg-white rounded-sm w-[3px]" style={{ height: h, opacity: playerState.isPlaying ? 1 : 0.5 }} />)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <LiveBadge />
                  <p className="font-semibold text-base text-white leading-tight truncate">{parsedCurrent.song}</p>
                  <div className="flex items-center gap-1 text-white/40">
                    <span className="text-sm font-medium truncate">{parsedCurrent.artist}</span>
                    {parsedCurrent.artist && elapsedStr && <><span className="size-[3px] rounded-full bg-white/40 shrink-0" /><span className="text-sm font-medium shrink-0">{elapsedStr}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/35">
                {history.map((track, i) => {
                  const p = parseTitle(track.title);
                  const img = track.artwork_url || historyArtworks[track.title] || radioStatus?.logo_url;
                  return (
                    <div key={i} className="p-4 flex items-center gap-4 border-b border-[#262626] hover:bg-white/[0.04] transition-colors">
                      <div className="shrink-0 size-[84px] rounded border border-[#262626] overflow-hidden">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1a1a]" />}
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <p className="font-semibold text-base text-white/70 leading-tight truncate">{p.song}</p>
                        <p className="font-medium text-sm text-white/40 truncate">{p.artist}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Mobile expanded (< lg) ── */}
          <div className="flex lg:hidden flex-1 min-h-0 flex-col overflow-hidden">
            {mobileView === 'player' ? (
              /* Mobile player view */
              <div className="relative flex-1 flex flex-col items-center overflow-hidden">
                {coverImg && (
                  <div className="absolute inset-0 pointer-events-none">
                    <img src={coverImg} alt="" className="w-full h-full object-cover opacity-10" />
                    <div className="absolute inset-0 bg-black/60" />
                  </div>
                )}
                <div className="relative flex flex-col items-center justify-center gap-8 flex-1 w-full px-8 pt-8">
                  {/* Song + artist at top */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="font-semibold text-2xl text-white/80 tracking-[0.48px]">{songLabel}</p>
                    <p className="font-medium text-base text-white/50 tracking-[0.32px]">{artistLabel}</p>
                  </div>
                  {/* Circular artwork */}
                  <div className="relative shrink-0">
                    <svg className="absolute -inset-3 size-[calc(100%+24px)] opacity-40" viewBox="0 0 290 290">
                      <circle cx="145" cy="145" r="141" fill="none" stroke="#D92A34" strokeWidth="1.5" strokeDasharray="4 8" />
                    </svg>
                    <div className="size-[260px] rounded-full border-4 border-[#2a2a2a] overflow-hidden shadow-2xl">
                      {coverImg ? <img src={coverImg} alt={songLabel} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1a1a]" />}
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-8">
                    <button onClick={playPrevious} disabled={!canGoPrev} className={`transition-colors ${canGoPrev ? 'text-white' : 'text-white/30 cursor-not-allowed'}`}>
                      <SkipBack className="size-5" />
                    </button>
                    <button onClick={() => handlePlay(togglePlay)} disabled={isLoading} className="text-white disabled:opacity-50">
                      {isLoading ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : playerState.isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
                    </button>
                    <button onClick={playNext} disabled={!canGoNext} className={`transition-colors ${canGoNext ? 'text-white' : 'text-white/30 cursor-not-allowed'}`}>
                      <SkipForward className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile tracklist view */
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Current track */}
                <div className="p-4 flex items-center gap-4 border-b border-[#262626] bg-white/[0.08]">
                  <div className="relative shrink-0 size-[84px] rounded overflow-hidden">
                    {artworkUrl ? <img src={artworkUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1a1a]" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex items-end gap-[2px]">
                        {[9,16,20,12].map((h,i) => <div key={i} className="bg-white rounded-sm w-[3px]" style={{ height: h }} />)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <LiveBadge />
                    <p className="font-semibold text-base text-white leading-tight truncate">{parsedCurrent.song}</p>
                    <div className="flex items-center gap-1 text-white/40">
                      <span className="text-sm font-medium truncate">{parsedCurrent.artist}</span>
                      {parsedCurrent.artist && elapsedStr && <><span className="size-[3px] rounded-full bg-white/40 shrink-0" /><span className="text-sm font-medium shrink-0">{elapsedStr}</span></>}
                    </div>
                  </div>
                </div>
                {history.map((track, i) => {
                  const p = parseTitle(track.title);
                  const img = track.artwork_url || historyArtworks[track.title] || radioStatus?.logo_url;
                  return (
                    <div key={i} className="p-4 flex items-center gap-4 border-b border-[#262626]">
                      <div className="shrink-0 size-[84px] rounded border border-[#262626] overflow-hidden">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1a1a]" />}
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <p className="font-semibold text-base text-white/70 leading-tight truncate">{p.song}</p>
                        <p className="font-medium text-sm text-white/40 truncate">{p.artist}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ══ BOTTOM BAR ════════════════════════════════════════ */}
      <div className="border-t border-[#2a2a2a] shrink-0 relative bg-[#0a0a0a]">
        <style>{`
          @keyframes bounce-hint {
            0%, 55%  { transform: translateY(0); }
            60%      { transform: translateY(-10px); }
            65%      { transform: translateY(0); }
            70%      { transform: translateY(-6px); }
            75%      { transform: translateY(0); }
            80%      { transform: translateY(-3px); }
            83%      { transform: translateY(0); }
            100%     { transform: translateY(0); }
          }
        `}</style>
        {/* Floating expand button — centered on the top border, bounces periodically */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => handlePlay(toggleExpanded)}
            style={{ animation: 'bounce-hint 4s ease-in-out infinite' }}
            className="size-9 rounded-full bg-[#D92A34] flex items-center justify-center shadow-[0_0_14px_rgba(217,42,52,0.55)] hover:bg-[#b91c27] transition-colors"
            aria-label={isExpanded ? 'Contraer player' : 'Expandir player'}
          >
            {isExpanded ? <ChevronDown className="size-5 text-white" /> : <ChevronUp className="size-5 text-white" />}
          </button>
        </div>
        {playerState.type === 'podcast' && (
          <div ref={progressBarRef} className="w-full h-[2px] bg-white/20 cursor-pointer group relative"
            onClick={e => seek(e.clientX)} onMouseDown={e => { setIsDragging(true); seek(e.clientX); }}>
            <div className="h-full bg-[#D92A34]" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {/* Mobile bar — 4 icons (< lg) */}
        <div className="flex lg:hidden items-center justify-between px-8 py-4">

          <button
            onClick={() => handlePlay(togglePlay)}
            disabled={isLoading}
            className="size-10 bg-[#D92A34] rounded-full flex items-center justify-center text-white disabled:opacity-50"
          >
            {isLoading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : playerState.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button onClick={() => { setMobileView(v => v === 'player' ? 'tracklist' : 'player'); if (!isExpanded) openExpanded(); }}
            className={`transition-colors ${mobileView === 'tracklist' && isExpanded ? 'text-white' : 'text-white/60 hover:text-white'}`}>
            <List className="size-5" />
          </button>
        </div>

        {/* Desktop bar — full controls (lg+) */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-3">
          {/* Artwork + info */}
          <div className="flex items-center gap-4 w-[320px] shrink-0">
            <div className="relative shrink-0 size-[56px] rounded overflow-hidden shadow-lg">
              {coverImg ? (
                playerState.type === 'radio'
                  ? <img src={coverImg} alt="" className="w-full h-full object-cover" />
                  : <Image src={coverImg} alt={artistLabel} width={56} height={56} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full bg-[#1a1a1a]" />}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              {playerState.type === 'radio' && <LiveBadge />}
              <p className="font-semibold text-sm text-[#c7c7c7] leading-tight truncate">{songLabel}</p>
              <p className="font-medium text-xs text-white/40 truncate">{artistLabel}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="flex items-center gap-6">
              <button onClick={playPrevious} disabled={!canGoPrev} className={canGoPrev ? 'text-white hover:text-white/80' : 'text-white/30 cursor-not-allowed'}>
                <SkipBack className="size-[18px]" />
              </button>
              <button onClick={() => handlePlay(togglePlay)} disabled={isLoading} className="text-white hover:text-white/80 disabled:opacity-50">
                {isLoading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : playerState.isPlaying ? <Pause className="size-[18px]" /> : <Play className="size-[18px]" />}
              </button>
              <button onClick={playNext} disabled={!canGoNext} className={canGoNext ? 'text-white hover:text-white/80' : 'text-white/30 cursor-not-allowed'}>
                <SkipForward className="size-[18px]" />
              </button>
            </div>
            <div className="flex items-center gap-3 w-full max-w-[600px]">
              <span className="text-xs text-white/50 tabular-nums w-9 text-right shrink-0">
                {playerState.type === 'radio' ? elapsedStr : formatTime(currentTime)}
              </span>
              <div className="relative flex-1 h-[2px] bg-white/30 rounded-full cursor-pointer"
                onClick={e => seek(e.clientX)}
                onMouseDown={e => { if (playerState.type !== 'radio') { setIsDragging(true); seek(e.clientX); } }}>
                <div className="h-full bg-[#D92A34] rounded-full" style={{ width: playerState.type === 'radio' ? '0%' : `${progressPct}%` }} />
              </div>
              <span className="text-xs text-white/50 tabular-nums w-9 shrink-0">
                {playerState.type === 'radio' ? '' : formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume + expand */}
          <div className="flex items-center gap-4 w-[200px] justify-end shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMuted(m => !m)} className="text-white/80 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
              <div className="relative w-20 h-[3px] bg-white/30 rounded-full">
                <div className="h-full bg-[#D92A34] rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                  onChange={e => { const v = parseFloat(e.target.value); setVolume(v); setIsMuted(v === 0); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
