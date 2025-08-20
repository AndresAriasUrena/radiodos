"use client";

import { useEffect, useState } from 'react';

interface QuakeItem { title: string; dateText: string; magnitudeText: string; magnitude: number | null; url: string }

export default function EarthquakesBlock() {
  const [items, setItems] = useState<QuakeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/earthquakes');
        const data = await res.json();
        if (!ignore && data?.items) setItems(data.items);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { ignore = true; clearInterval(id); };
  }, []);

  return (
    <div className="mb-8">
      {loading ? (
        <div className="text-[#D4D5DD] text-sm">Cargando sismos...</div>
      ) : items.length === 0 ? (
        <div className="text-[#D4D5DD] text-sm">No hay sismos recientes.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.slice(0, 3).map((q, idx) => {
            const magText = (q.magnitudeText || (q.magnitude !== null ? String(q.magnitude) : '')).replace('.', ',');
            return (
              <a key={idx} href={q.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="bg-[#FFFFFF]/10 rounded-xl px-4 py-2 flex items-center gap-3 text-[#D4D5DD]">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#01A299]">SISMO</span>
                  <span className="text-sm">{q.dateText}</span>
                </div>
                <div className="bg-[#FFFFFF]/10 rounded-xl px-4 py-6 mt-2 text-center text-[#D4D5DD]">
                  <div className="text-2xl font-semibold">{magText} Mw</div>
                  <div className="text-xs opacity-80 mt-1">Magnitud</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
} 