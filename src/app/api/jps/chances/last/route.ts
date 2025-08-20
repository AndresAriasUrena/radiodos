import { NextResponse } from 'next/server';

export const revalidate = 1800;
export const dynamic = 'force-dynamic';

async function fetchApi() {
  const url = 'https://integration.jps.go.cr/api/App/chances/last';
  const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' }, next: { revalidate } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

export async function GET() {
  try {
    let data: any = null;
    try { data = await fetchApi(); } catch { /* ignore */ }
    if (!data) return NextResponse.json({ fecha: '', premios: [] }, { status: 200 });

    const fecha = data?.fecha || data?.Fecha || data?.resultado?.fecha || '';
    const premios = [] as any[];
    const arr = data?.premios || data?.Premios || data?.resultado?.premios || [];
    if (Array.isArray(arr)) {
      for (let i = 0; i < Math.min(3, arr.length); i++) {
        const it = arr[i] || {};
        const premio = it.premio ?? it.Premio ?? it.monto ?? it.Monto ?? null;
        premios.push({
          rank: i + 1,
          numero: String(it.numero ?? it.Numero ?? ''),
          serie: String(it.serie ?? it.Serie ?? ''),
          premio
        });
      }
    }
    return NextResponse.json({ fecha, premios }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ fecha: '', premios: [] }, { status: 200 });
  }
} 