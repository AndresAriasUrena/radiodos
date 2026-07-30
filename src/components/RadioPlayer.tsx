'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX,
  SkipBack, SkipForward,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  List, X,
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

/* ─── Visualizer helpers ─────────────────────────────────── */
// 3 brand palettes — all red-spectrum, progressing to different complementary accents
const VIZ_PALETTES: [number,number,number][][] = [
  // 0 · Brasa — deep crimson → brand red → warm red glow
  [[60,0,8],[140,15,20],[217,42,52],[255,100,70]],
  // 1 · Fuego — brand red → orange-red → amber (analogous warm)
  [[150,0,10],[217,42,52],[255,80,0],[255,180,40]],
  // 2 · Carmín — deep red → crimson → magenta (split-complementary)
  [[100,0,20],[180,10,40],[200,0,100],[130,0,160]],
];
function vizLerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function neonColor(t: number, alpha = 1, p: [number,number,number][] = VIZ_PALETTES[0]): string {
  const seg = t * (p.length - 1);
  const i = Math.min(Math.floor(seg), p.length - 2);
  const f = seg - i;
  const r = Math.round(vizLerp(p[i][0], p[i+1][0], f));
  const g = Math.round(vizLerp(p[i][1], p[i+1][1], f));
  const b = Math.round(vizLerp(p[i][2], p[i+1][2], f));
  return `rgba(${r},${g},${b},${alpha})`;
}
function neonHex(t: number, p: [number,number,number][] = VIZ_PALETTES[0]): string {
  const seg = t * (p.length - 1);
  const i = Math.min(Math.floor(seg), p.length - 2);
  const f = seg - i;
  return `rgb(${Math.round(vizLerp(p[i][0],p[i+1][0],f))},${Math.round(vizLerp(p[i][1],p[i+1][1],f))},${Math.round(vizLerp(p[i][2],p[i+1][2],f))})`;
}
const VIZ_PALETTE_LABELS = ['Brasa', 'Fuego', 'Carmín'] as const;

type VizMode = 'barras' | 'espejo' | 'fluido';

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
  const [historyOpen, setHistoryOpen] = useState(true);

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
  // Visualizer mode
  const [vizMode, setVizMode] = useState<VizMode>('espejo');
  const vizModeRef = useRef<VizMode>('espejo');
  const changeVizMode = useCallback((m: VizMode) => { vizModeRef.current = m; setVizMode(m); }, []);

  const [vizPalette, setVizPalette] = useState(0);
  const vizPaletteRef = useRef(0);
  const changeVizPalette = useCallback((i: number) => { vizPaletteRef.current = i; setVizPalette(i); }, []);

  // Fluid mode state (persistent across frames)
  const fluidPhaseRef = useRef(0);
  type FluidParticle = { x:number; y:number; vx:number; vy:number; life:number; size:number; t:number };
  const fluidParticlesRef = useRef<FluidParticle[]>([]);

  // Mirror mode state
  const beatFlashRef = useRef(0);
  const mirrorPrevEnergyRef = useRef(0);

  // Mobile circular visualizer
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const mobileRafRef = useRef<number>(0);
  const demoPhaseMobileRef = useRef(0);
  const mobileArtworkImgRef = useRef<HTMLImageElement | null>(null);
  const mobileArtworkUrlRef = useRef<string | null>(null);

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
    cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const S = 1.0;
    const applyS = (v: number) => Math.min(1, v * S);

    // Init fluid particles once
    if (fluidParticlesRef.current.length === 0) {
      for (let i = 0; i < 100; i++) {
        fluidParticlesRef.current.push({
          x: Math.random()*1920, y: Math.random()*1080,
          vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
          life: Math.random(), size: 1.5+Math.random()*3, t: Math.random(),
        });
      }
    }

    let demoPhase = 0;
    const getDemoFreq = (): Uint8Array => {
      demoPhase += 0.025;
      const buf = new Uint8Array(512);
      for (let i = 0; i < buf.length; i++) {
        const f = i / buf.length;
        buf[i] = Math.max(0, Math.min(255,
          130*Math.exp(-f*4)*(0.5+0.5*Math.sin(demoPhase*1.9+i*0.25))
          + 80*Math.exp(-f*1.8)*(0.5+0.5*Math.sin(demoPhase*3.1+i*0.1))
          + 40*Math.sin(demoPhase*0.7+i*0.4)*(1-f) + Math.random()*6
        ));
      }
      return buf;
    };

    const getFreq = (): Uint8Array => {
      const an = analyserRef.current;
      if (!an) return getDemoFreq();
      const d = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(d);
      // Analyser silent (e.g. podcast playing, radio paused) → use demo
      let sum = 0;
      for (let i = 0; i < d.length; i++) sum += d[i];
      if (sum / d.length < 2) return getDemoFreq();
      return d;
    };

    // ── BARRAS ──────────────────────────────────────────────
    const drawBars = (freq: Uint8Array, W: number, H: number, nc: (t:number,a?:number)=>string, _nh: (t:number)=>string) => {
      ctx.clearRect(0, 0, W, H);
      const bars = 160, bw = W / bars;
      for (let i = 0; i < bars; i++) {
        const v  = Math.pow(applyS(freq[Math.floor(i*freq.length/bars)] / 255), 1.1);
        const bh = Math.max(2, v * (H - 8));
        const x  = i * bw;
        const t  = i / bars;
        ctx.fillStyle = nc(t, 0.9);
        ctx.fillRect(x, H - bh, bw - 1, bh);
        ctx.fillStyle = nc(t, 1);
        ctx.fillRect(x, H - bh - 2, bw - 1, 2);
      }
    };

    // ── ESPEJO ──────────────────────────────────────────────
    const drawMirror = (freq: Uint8Array, W: number, H: number, nc: (t:number,a?:number)=>string, P: [number,number,number][]) => {
      const bars = 160, bw = W / bars, mid = H / 2;
      let energy = 0;
      for (let i = 0; i < 16; i++) energy += applyS(freq[i] / 255);
      energy /= 16;
      beatFlashRef.current = Math.max(0, beatFlashRef.current - 0.04);
      if (energy > 0.55 && energy > mirrorPrevEnergyRef.current * 1.15) beatFlashRef.current = 1;
      mirrorPrevEnergyRef.current = energy;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < bars; i++) {
        const v  = Math.pow(applyS(freq[Math.floor(i*freq.length/bars)] / 255), 1.3);
        const bh = Math.max(2, v*(mid-8));
        const x  = i*bw, t = i/bars;
        ctx.fillStyle = nc(t, 0.9);
        ctx.fillRect(x, mid-bh, bw-1, bh);
        ctx.fillStyle = nc(t, 0.18);
        ctx.fillRect(x, mid, bw-1, bh);
        ctx.fillStyle = nc(t, 1);
        ctx.fillRect(x, mid-bh-2, bw-1, 2);
      }
      const bf = beatFlashRef.current;
      if (bf > 0) {
        const gf = ctx.createLinearGradient(0, 0, W, 0);
        P.forEach((c, i) => gf.addColorStop(i/(P.length-1),
          `rgba(${c[0]},${c[1]},${c[2]},${bf*0.8})`));
        ctx.fillStyle = gf;
        ctx.fillRect(0, mid-(1+bf*4), W, 2+bf*8);
      }
    };

    // ── FLUIDO ──────────────────────────────────────────────
    const drawFluid = (freq: Uint8Array, W: number, H: number, nc: (t:number,a?:number)=>string) => {
      fluidPhaseRef.current += 0.018;
      const fp = fluidPhaseRef.current;
      let energy = 0;
      for (let i = 0; i < 32; i++) energy += applyS(freq[i] / 255);
      energy /= 32;

      ctx.clearRect(0, 0, W, H);

      // 4 layers, step=10 → ~4x fewer path ops than before
      const STEP = 10, layers = 4;
      for (let l = 0; l < layers; l++) {
        const lt     = l / layers;
        const amp    = (60 + energy * 160 * S) * (1 - lt * 0.4);
        const freq2  = 2.5 + l * 1.2;
        const speed  = fp * (0.8 + l * 0.35);
        const yBase  = H * (0.25 + lt * 0.5);
        const tColor = (lt + fp * 0.04) % 1;

        // Compute sampled y values once, reuse for fill + stroke
        const xs: number[] = [], ys: number[] = [];
        for (let x = 0; x <= W; x += STEP) {
          const nx   = x / W;
          const fIdx = Math.floor(nx * freq.length * 0.6 + l * 12) % freq.length;
          const fv   = applyS(freq[fIdx] / 255);
          xs.push(x);
          ys.push(yBase
            + Math.sin(nx * Math.PI * freq2 + speed) * amp
            + Math.sin(nx * Math.PI * freq2 * 1.7 + speed * 1.3 + l) * amp * 0.35
            + fv * 60 * Math.sin(nx * Math.PI * 6 + fp * 2));
        }
        const n = xs.length;

        // Smooth path helper using quadratic curves
        const buildCurve = () => {
          ctx.moveTo(xs[0], ys[0]);
          for (let p = 1; p < n - 1; p++) {
            ctx.quadraticCurveTo(xs[p], ys[p], (xs[p] + xs[p+1]) / 2, (ys[p] + ys[p+1]) / 2);
          }
          ctx.lineTo(xs[n-1], ys[n-1]);
        };

        // Fill (closed shape)
        ctx.beginPath(); buildCurve();
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        const grd = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp + 60);
        grd.addColorStop(0, nc(tColor, 0.20));
        grd.addColorStop(0.5, nc((tColor + 0.3) % 1, 0.08));
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd; ctx.fill();

        // Stroke edge only
        ctx.beginPath(); buildCurve();
        ctx.strokeStyle = nc(tColor, 0.40 + energy * 0.50);
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Particles — solid arc instead of radialGradient (major speedup)
      for (const p of fluidParticlesRef.current) {
        const fIdx = Math.floor((p.x / W) * freq.length * 0.5) % freq.length;
        const fv   = applyS(freq[fIdx] / 255);
        p.vx += (Math.sin(fp * 1.1 + p.y * 0.01) * 0.06 + fv * 0.3) * (Math.random() - 0.5);
        p.vy += Math.cos(fp * 0.9 + p.x * 0.008) * 0.06 + energy * 0.2 * (Math.random() - 0.5);
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx; p.y += p.vy;
        p.life += 0.006 + energy * 0.01;
        if (p.life > 1) p.life = 0;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const a = Math.sin(p.life * Math.PI) * (0.45 + fv * 0.45);
        const r = p.size * (1 + fv + energy * 0.5);
        ctx.fillStyle = nc(p.t, a * 0.65);
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2); ctx.fill();
      }
    };

    // ── Main loop ────────────────────────────────────────────
    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      const W = canvas.width;
      const H = canvas.height;
      const freq = getFreq();
      const P = VIZ_PALETTES[vizPaletteRef.current];
      const nc = (t: number, a = 1) => neonColor(t, a, P);
      const nh = (t: number) => neonHex(t, P);
      ctx.save();
      switch (vizModeRef.current) {
        case 'barras': drawBars(freq, W, H, nc, nh); break;
        case 'espejo': drawMirror(freq, W, H, nc, P); break;
        case 'fluido': drawFluid(freq, W, H, nc); break;
      }
      ctx.restore();
    };
    frame();
  }, []);

  const drawMobileCircle = useCallback(() => {
    cancelAnimationFrame(mobileRafRef.current);
    const canvas = mobileCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getMobileFreq = (): Uint8Array => {
      const an = analyserRef.current;
      if (an) {
        const d = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(d);
        let sum = 0;
        for (let i = 0; i < d.length; i++) sum += d[i];
        if (sum / d.length >= 2) return d;
      }
      demoPhaseMobileRef.current += 0.025;
      const ph = demoPhaseMobileRef.current;
      const buf = new Uint8Array(512);
      for (let i = 0; i < buf.length; i++) {
        const f = i / buf.length;
        buf[i] = Math.max(0, Math.min(255,
          130*Math.exp(-f*4)*(0.5+0.5*Math.sin(ph*1.9+i*0.25))
          + 80*Math.exp(-f*1.8)*(0.5+0.5*Math.sin(ph*3.1+i*0.1))
          + 40*Math.sin(ph*0.7+i*0.4)*(1-f) + Math.random()*6
        ));
      }
      return buf;
    };

    const frame = () => {
      mobileRafRef.current = requestAnimationFrame(frame);
      const W = canvas.width, H = canvas.height;
      const cx = W/2, cy = H/2;
      const freq = getMobileFreq();
      const P = VIZ_PALETTES[vizPaletteRef.current];

      ctx.clearRect(0, 0, W, H);

      const bars = 80;
      const innerR = Math.min(W, H) * 0.30;
      const maxLen = Math.min(W, H) * 0.22;

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const fIdx = Math.floor(i * freq.length / bars);
        const v = Math.pow(Math.min(1, freq[fIdx] / 255), 1.1);
        const len = Math.max(2, v * maxLen);
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * (innerR + len);
        const y2 = cy + Math.sin(angle) * (innerR + len);
        ctx.strokeStyle = neonColor(i / bars, 0.65 + v * 0.35, P);
        ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.007);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Inner circle with artwork
      if (innerR <= 2) return;
      const r = innerR - 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      const artImg = mobileArtworkImgRef.current;
      if (artImg && artImg.complete && artImg.naturalWidth > 0) {
        ctx.drawImage(artImg, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
      }
      ctx.restore();
      // Ring border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = neonColor(0, 0.35, P);
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    frame();
  }, []);

  useEffect(() => {
    if (!isExpanded || mobileView !== 'player') {
      cancelAnimationFrame(mobileRafRef.current);
      return;
    }
    const canvas = mobileCanvasRef.current;
    if (!canvas) return;

    let started = false;
    const tryStart = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(canvas.offsetWidth * dpr);
      const h = Math.round(canvas.offsetHeight * dpr);
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      if (!started) { started = true; drawMobileCircle(); }
    };

    const ro = new ResizeObserver(tryStart);
    ro.observe(canvas);
    tryStart();

    return () => { ro.disconnect(); cancelAnimationFrame(mobileRafRef.current); };
  }, [isExpanded, mobileView, drawMobileCircle]);


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
    if (isExpanded) {
      drawViz();
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isExpanded, drawViz]);

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

  useEffect(() => {
    if (coverImg === mobileArtworkUrlRef.current) return;
    mobileArtworkUrlRef.current = coverImg;
    if (!coverImg) { mobileArtworkImgRef.current = null; return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { mobileArtworkImgRef.current = img; };
    img.onerror = () => { mobileArtworkImgRef.current = null; };
    img.src = coverImg;
  }, [coverImg]);

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
          className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0a0a0a] relative"
        >
          <button
            onClick={closeExpanded}
            className="absolute top-4 right-4 z-20 size-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/60 hover:text-white transition-colors"
            aria-label="Cerrar player"
          >
            <X className="size-4" />
          </button>
          {/* ── Desktop expanded (lg+) ── */}
          <div className="hidden lg:flex flex-1 min-h-0 border-b border-[#262626] overflow-hidden">

            {/* Left panel */}
            <div className="relative flex-1 flex flex-col border-r border-[#262626] overflow-hidden">
              {coverImg && (
                <div className="absolute inset-0 pointer-events-none">
                  <img src={coverImg} alt="" className="w-full h-full object-cover scale-110 blur-sm opacity-25" />
                  <div className="absolute inset-0 bg-black/75" />
                </div>
              )}
              {/* Song info + viz mode buttons */}
              <div className="relative flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-xl text-white/80 tracking-[0.48px]">{songLabel}</p>
                  <p className="font-medium text-sm text-white/50 tracking-[0.32px]">{artistLabel}</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Viz mode buttons */}
                  <div className="flex items-center gap-1.5">
                    {(['espejo', 'barras', 'fluido'] as VizMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => changeVizMode(m)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                          vizMode === m
                            ? 'bg-[#D92A34] border-[#D92A34] text-white'
                            : 'bg-transparent border-white/15 text-white/40 hover:border-[#D92A34]/50 hover:text-white/70'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  {/* Palette swatches */}
                  <div className="flex items-center gap-1.5">
                    {VIZ_PALETTE_LABELS.map((label, idx) => {
                      const P = VIZ_PALETTES[idx];
                      const mid = P[Math.floor(P.length / 2)];
                      const active = vizPalette === idx;
                      return (
                        <button
                          key={label}
                          onClick={() => changeVizPalette(idx)}
                          title={label}
                          className={`size-5 rounded-full transition-all duration-200 ${active ? 'ring-2 ring-white/60 scale-110' : 'opacity-60 hover:opacity-90'}`}
                          style={{ background: `rgb(${mid[0]},${mid[1]},${mid[2]})` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Visualizer canvas — fills remaining space */}
              <canvas ref={canvasRef} className="relative w-full flex-1 min-h-0 z-10" />
            </div>

            {/* Right sidebar */}
            <div className="flex flex-row shrink-0 transition-all duration-300" style={{ width: historyOpen ? 496 + 40 : 40 }}>
              {/* Toggle strip */}
              <div className={`w-10 shrink-0 flex items-center justify-center border-r-2 transition-colors duration-300 ${historyOpen ? 'border-[#262626]' : 'border-[#D92A34]'}`}>
                <button
                  onClick={() => setHistoryOpen(o => !o)}
                  className="h-14 w-10 bg-[#0a0a0a] rounded-l-xl flex items-center justify-center hover:bg-[#1a1a1a] transition-colors border-y-2 border-l-2 border-[#D92A34]"
                  title={historyOpen ? 'Ocultar historial' : 'Ver historial'}
                >
                  {historyOpen
                    ? <ChevronRight className="size-5 text-[#D92A34]" />
                    : <ChevronLeft className="size-5 text-[#D92A34]" />
                  }
                </button>
              </div>
              {/* Collapsible content */}
              <div className={`w-[496px] flex flex-col overflow-hidden transition-all duration-300 ${historyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {playerState.type === 'podcast' ? (
                  <>
                    {/* Podcast: current episode header */}
                    <div className="p-4 flex items-center gap-4 border-b border-[#262626] bg-white/[0.08] shrink-0">
                      <div className="shrink-0 size-[84px] rounded border border-[#262626] overflow-hidden">
                        {playerState.currentShow?.imageUrl
                          ? <img src={playerState.currentShow.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-[#1a1a1a]" />}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#D92A34] uppercase tracking-wider truncate">{playerState.currentShow?.title}</p>
                        <p className="font-semibold text-base text-white leading-snug line-clamp-2">{cleanHtml(playerState.currentEpisode?.title || '')}</p>
                        <p className="text-xs text-white/30">{playerState.currentEpisode?.duration}</p>
                      </div>
                    </div>
                    {/* Podcast episode list */}
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/35">
                      {playerState.episodesList?.map((ep, i) => {
                        const isCurrent = i === playerState.currentIndex;
                        return (
                          <div key={ep.id || i} className={`p-4 flex items-center gap-4 border-b border-[#262626] transition-colors ${isCurrent ? 'bg-[#D92A34]/10' : 'hover:bg-white/[0.04]'}`}>
                            <div className="relative shrink-0 size-[84px] rounded border border-[#262626] overflow-hidden">
                              {playerState.currentShow?.imageUrl
                                ? <img src={playerState.currentShow.imageUrl} alt="" className="w-full h-full object-cover opacity-60" />
                                : <div className="w-full h-full bg-[#1a1a1a]" />}
                              {isCurrent && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <div className="flex items-end gap-[2px]">
                                    {[9,16,20,12].map((h,j) => <div key={j} className="bg-[#D92A34] rounded-sm w-[3px]" style={{ height: h, opacity: playerState.isPlaying ? 1 : 0.5 }} />)}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                              {isCurrent && (
                                <div className="flex items-center gap-1">
                                  <div className="size-1.5 rounded-full bg-[#D92A34]" />
                                  <span className="text-xs text-[#D92A34] font-semibold">Reproduciendo</span>
                                </div>
                              )}
                              <p className={`font-semibold text-sm leading-snug line-clamp-2 ${isCurrent ? 'text-white' : 'text-white/60'}`}>{cleanHtml(ep.title)}</p>
                              <p className="font-medium text-xs text-white/30">{ep.duration}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Radio: current track header */}
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
                    {/* Radio history */}
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
                  </>
                )}
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
                {/* Palette + mode switcher — top center */}
                <div className="relative flex items-center justify-center gap-3 pt-16 shrink-0">
                  {VIZ_PALETTE_LABELS.map((label, idx) => {
                    const P = VIZ_PALETTES[idx];
                    const mid = P[Math.floor(P.length / 2)];
                    return (
                      <button
                        key={label}
                        onClick={() => changeVizPalette(idx)}
                        title={label}
                        className={`size-4 rounded-full transition-all duration-200 ${vizPalette === idx ? 'ring-2 ring-white/60 scale-125' : 'opacity-50 hover:opacity-80'}`}
                        style={{ background: `rgb(${mid[0]},${mid[1]},${mid[2]})` }}
                      />
                    );
                  })}
                </div>
                <div className="relative flex flex-col items-center justify-center gap-6 flex-1 w-full px-8">
                  {/* Circular music visualizer */}
                  <canvas ref={mobileCanvasRef} className="w-44 h-44 shrink-0" />
                  {/* Song + artist */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <p className="font-semibold text-xl text-white/80 tracking-[0.48px]">{songLabel}</p>
                    <p className="font-medium text-sm text-white/50 tracking-[0.32px]">{artistLabel}</p>
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
      <div className={`border-t-2 shrink-0 relative bg-[#0a0a0a] transition-colors duration-300 ${isExpanded ? 'border-[#2a2a2a]' : 'border-[#D92A34]'}`}>
        {/* Tab expand button — right side, protrudes upward */}
        <div className="absolute top-0 right-8 -translate-y-full z-10">
          <button
            onClick={() => handlePlay(toggleExpanded)}
            className="px-6 h-8 bg-[#0a0a0a] rounded-t-xl flex items-center justify-center hover:bg-[#1a1a1a] transition-colors border-t-2 border-x-2 border-[#D92A34]"
            aria-label={isExpanded ? 'Contraer player' : 'Expandir player'}
          >
            {isExpanded ? <ChevronDown className="size-5 text-[#D92A34]" /> : <ChevronUp className="size-5 text-[#D92A34]" />}
          </button>
        </div>
        {playerState.type === 'podcast' && (
          <div ref={progressBarRef} className="w-full h-[2px] bg-white/20 cursor-pointer group relative"
            onClick={e => seek(e.clientX)} onMouseDown={e => { setIsDragging(true); seek(e.clientX); }}>
            <div className="h-full bg-[#D92A34]" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {/* Mobile bar (< lg) */}
        <div className="flex lg:hidden items-center gap-3 px-4 py-3 relative">
          {/* Artwork + song info — tap to expand */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => { if (!isExpanded) openExpanded(); else if (mobileView !== 'player') setMobileView('player'); }}
          >
            <div className="relative size-10 shrink-0 rounded-full overflow-hidden border border-[#D92A34]/40 bg-[#1a1a1a]">
              {coverImg
                ? <img src={coverImg} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <div className="flex items-end gap-[1px]">
                      {[4,7,5,8,4].map((h,i) => (
                        <div key={i} className={`bg-[#D92A34] rounded-sm w-[2px]`} style={{ height: h }} />
                      ))}
                    </div>
                  </div>
              }
              {playerState.isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex items-end gap-[1px]">
                    {[4,7,5,8,4].map((h,i) => (
                      <div key={i} className="bg-white rounded-sm w-[2px] animate-bounce"
                        style={{ height: h, animationDelay: `${i*0.12}s`, animationDuration: '0.8s' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{songLabel}</p>
              <p className="text-white/40 text-xs truncate">{artistLabel}</p>
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={playPrevious} disabled={!canGoPrev}
              className={`size-8 flex items-center justify-center transition-colors ${canGoPrev ? 'text-white/70 hover:text-white' : 'text-white/20'}`}>
              <SkipBack className="size-4" />
            </button>
            <button onClick={() => handlePlay(togglePlay)} disabled={isLoading}
              className="size-10 bg-[#D92A34] rounded-full flex items-center justify-center text-white disabled:opacity-50 shrink-0">
              {isLoading
                ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : playerState.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button onClick={playNext} disabled={!canGoNext}
              className={`size-8 flex items-center justify-center transition-colors ${canGoNext ? 'text-white/70 hover:text-white' : 'text-white/20'}`}>
              <SkipForward className="size-4" />
            </button>
            <button
              onClick={() => { setMobileView(v => v === 'player' ? 'tracklist' : 'player'); if (!isExpanded) openExpanded(); }}
              className={`size-8 flex items-center justify-center transition-colors ${mobileView === 'tracklist' && isExpanded ? 'text-white' : 'text-white/40 hover:text-white'}`}>
              <List className="size-4" />
            </button>
          </div>
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
            <img src="/assets/LogoRadio2.svg" alt="Radio 2" className="h-8 shrink-0" />
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
