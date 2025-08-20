"use client";

import { useEffect, useState } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';

interface Prize { rank: number; numero: string; serie: string; premio?: any }
interface LotteryResp { fecha: string; premios: Prize[] }

type Kind = 'loteria' | 'chances';

const logos: Record<Kind, string> = {
  loteria: '/assets/LtNacional.png',
  chances: '/assets/chances.png'
};

function formatColones(value: any): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
  if (!isFinite(num)) return '—';
  if (num >= 1_000_000) {
    const m = Math.round(num / 1_000_000);
    return `₡${m}M`;
  }
  return `₡${num.toLocaleString('es-CR')}`;
}

function formatFecha(fecha?: string): string {
  if (!fecha) return '—';
  // Si ya viene human-readable, devolver tal cual
  if (/\b(Domingo|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado)\b/i.test(fecha)) return fecha;
  const d = new Date(fecha);
  if (!isNaN(d.getTime())) {
    const fmt = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
    const out = fmt.format(d);
    // Capitalizar primera letra
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  // Intento de parseo simple yyyy-mm-dd
  const m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d2 = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d2.getTime())) {
      const fmt = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
      const out = fmt.format(d2);
      return out.charAt(0).toUpperCase() + out.slice(1);
    }
  }
  return fecha;
}

function Block({ kind, title }: { kind: Kind; title: string }) {
  const [data, setData] = useState<LotteryResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jps/${kind}/last`);
        const json = await res.json();
        if (!ignore) setData(json);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => { ignore = true; clearInterval(id); };
  }, [kind]);

  return (
    <div className="mb-10 flex flex-col items-center justify-center ">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logos[kind]} alt={title} className="bg-contain" />
      </div>
      <div className="flex items-center justify-center mt-4">
        <div className="inline-flex items-center gap-2 text-sm text-[#D4D5DD] bg-[#FFFFFF]/10 rounded-full px-4 py-2">
          <IoCalendarOutline className="w-4 h-4" />
          {formatFecha(data?.fecha)}
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {(loading ? [1,2,3] : (data?.premios || [])).slice(0,3).map((p, idx) => (
          <div key={idx} className="bg-[#FFFFFF]/10 rounded-2xl px-5 py-5 flex items-center gap-4">
            <div className={`w-14 h-14 flex items-center justify-center rounded-full ${idx===0?'bg-[#D51F2F] text-white':idx===1?'bg-[#9AA7BD]':'bg-[#5B6B93]'} font-bold text-lg`}>{idx+1}º</div>
            {loading ? (
              <div className="flex-1 h-6 bg-[#FFFFFF]/20 rounded"></div>
            ) : (
              <div className="flex-1 grid grid-cols-4 gap-3 text-[#D4D5DD] text-sm">
                <div>
                  <div className="opacity-70">Número</div>
                  <div className="font-semibold text-xl">{(p as Prize).numero}</div>
                </div>
                <div>
                  <div className="opacity-70">Serie</div>
                  <div className="font-semibold text-xl">{(p as Prize).serie}</div>
                </div>
                <div className="col-span-2">
                  <div className="opacity-70">Premio</div>
                  <div className="font-semibold text-xl">{formatColones((p as Prize).premio)}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LotteryResults() {
  return (
    <div>
      <Block kind="loteria" title="Lotería Nacional" />
      <div className="h-[0.4px] w-full bg-[#FFFFFF]/20 my-6" />
      <Block kind="chances" title="Chances" />
    </div>
  );
} 