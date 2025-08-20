"use client";

import { useEffect, useState } from 'react';

type StandingRow = { pos: number; team: string; played: number; wins: number; draws: number; losses: number; points: number; next?: string };

export default function StandingsTable() {
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/standings');
        const data = await res.json();
        if (!ignore && data?.rows) setRows(data.rows);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => { ignore = true; clearInterval(id); };
  }, []);

  return (
    <div className="mb-8">
      {loading ? (
        <div className="text-[#D4D5DD] text-sm">Cargando tabla...</div>
      ) : rows.length === 0 ? (
        <div className="text-[#D4D5DD] text-sm">No hay datos disponibles.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#FFFFFF]/10">
          <table className="w-full text-sm text-[#D4D5DD]">
            <thead className="bg-[#FFFFFF]/10">
              <tr>
                <th className="px-3 py-2 text-left">P</th>
                <th className="px-3 py-2 text-left">Equipo</th>
                <th className="px-2 py-2">Pj</th>
                <th className="px-2 py-2">G</th>
                <th className="px-2 py-2">E</th>
                <th className="px-2 py-2">P</th>
                <th className="px-2 py-2">Pts</th>
                <th className="px-2 py-2">Next</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((r) => (
                <tr key={r.pos} className="odd:bg-transparent even:bg-[#FFFFFF]/5">
                  <td className="px-3 py-2">{r.pos}</td>
                  <td className="px-3 py-2">
                    <div className="leading-tight">{r.team}</div>
                  </td>
                  <td className="px-2 py-2 text-center">{r.played}</td>
                  <td className="px-2 py-2 text-center">{r.wins}</td>
                  <td className="px-2 py-2 text-center">{r.draws}</td>
                  <td className="px-2 py-2 text-center">{r.losses}</td>
                  <td className="px-2 py-2 text-center font-semibold">{r.points}</td>
                  <td className="px-2 py-2 text-center">{r.next || '?'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 