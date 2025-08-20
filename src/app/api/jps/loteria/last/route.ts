import { NextResponse } from 'next/server';

export const revalidate = 1800; // 30 min
export const dynamic = 'force-dynamic';

async function fetchApi() {
  const url = 'https://integration.jps.go.cr/api/App/loterianacional/last';
  const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' }, next: { revalidate } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function scrapeFallback() {
  const url = 'https://www.jps.go.cr/resultados/loteria-nacional';
  const res = await fetch(url, { cache: 'no-store', next: { revalidate } });
  if (!res.ok) return null;
  const html = await res.text();
  const fechaMatch = html.match(/(Domingo|Miércoles|Sábado)\s+\d{1,2}\s+de\s+\w+/i);
  const premios: any[] = [];
  for (const rank of ['1', '2', '3']) {
    const blockRe = new RegExp(`${rank}°([\s\S]{0,220})`, 'i');
    const block = blockRe.exec(html)?.[1] || '';
    const num = /Número[^0-9]*([0-9]{1,4})/i.exec(block)?.[1] || '';
    const serie = /Serie[^0-9]*([0-9]{1,3})/i.exec(block)?.[1] || '';
    const premio = /Premio[^0-9]*([0-9\.\,]+)/i.exec(block)?.[1] || '';
    if (num) premios.push({ rank: parseInt(rank), numero: num, serie, premio });
  }
  if (premios.length === 0) return null;
  return { fecha: fechaMatch?.[0] || '', premios };
}

function coalescePrize(obj: any) {
  const fecha = obj?.fecha || obj?.Fecha || obj?.sorteo?.fecha || obj?.resultado?.fecha || '';
  let premiosArr: any[] = [];
  for (const key of ['premios', 'Premios']) {
    if (Array.isArray(obj?.[key])) { premiosArr = obj[key]; break; }
    if (Array.isArray(obj?.resultado?.[key])) { premiosArr = obj.resultado[key]; break; }
  }
  if (!Array.isArray(premiosArr)) premiosArr = [];

  // Mapear por tipo principal 1,2,3
  const byTipo: Record<number, any> = {};
  for (const it of premiosArr) {
    const tipo = Number(it.tipo ?? it.Tipo ?? 0);
    if ([1,2,3].includes(tipo) && !byTipo[tipo]) {
      byTipo[tipo] = it;
    }
  }

  // Fallback: si falta alguno, escoger por mayor monto entre los que no estén elegidos
  const remaining = premiosArr
    .filter(it => !Object.values(byTipo).includes(it))
    .sort((a,b) => (Number(b.monto ?? b.Monto ?? b.premio ?? b.Premio ?? 0) - Number(a.monto ?? a.Monto ?? a.premio ?? a.Premio ?? 0)));

  for (const rank of [1,2,3]) {
    if (!byTipo[rank]) byTipo[rank] = remaining.shift();
  }

  const awards = [1,2,3].map(rank => {
    const it = byTipo[rank] || {};
    const numero = String(it.numero ?? it.Numero ?? '');
    const serie = String(it.serie ?? it.Serie ?? '');
    const premio = it.premio ?? it.Premio ?? it.monto ?? it.Monto ?? null;
    return { rank, numero, serie, premio };
  }).filter(p => p.numero);

  return { fecha, premios: awards };
}

export async function GET() {
  try {
    let data: any = null;
    try { data = await fetchApi(); } catch { /* ignore */ }
    if (!data) {
      const scraped = await scrapeFallback();
      if (scraped) return NextResponse.json(scraped, { status: 200 });
      return NextResponse.json({ fecha: '', premios: [] }, { status: 200 });
    }
    const mapped = coalescePrize(data);
    return NextResponse.json(mapped, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ fecha: '', premios: [] }, { status: 200 });
  }
} 