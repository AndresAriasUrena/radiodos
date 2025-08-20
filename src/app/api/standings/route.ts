import { NextResponse } from 'next/server';

export const revalidate = 900; // 15 minutos
export const dynamic = 'force-dynamic';

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

export async function GET() {
  try {
    const src = 'https://www.fctables.com/costa-rica/primera-division/iframe/?type=table&lang_id=4&country=49&template=57&team=&timezone=America/Costa_Rica&time=24&po=1&ma=1&wi=1&dr=1&los=1&gf=0&ga=0&gd=0&pts=1&ng=1&form=0&width=350&height=700&font=Arial&fs=14&lh=30&bg=FFFFFF&fc=333333&tlink=1&ths=1&thb=1&thba=FFFFFF&thc=000000&bc=dddddd&hob=f5f5f5&hobc=ebe7e7&lc=333333&sh=1&hfb=1&hbc=1b305d&hfc=FFFFFF';
    const res = await fetch(src, {
      // Evita cache agresivo en dev
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.fctables.com/'
      },
      next: { revalidate }
    });

    if (!res.ok) {
      return NextResponse.json({ rows: [] });
    }

    const html = await res.text();

    // Buscar la tabla. Si hay múltiples, tomar la que tenga cabecera con Equipo o similar
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
    let tableHtml = '';
    for (const t of tables) {
      if (/Equipo|Team|Pts/i.test(t)) { tableHtml = t; break; }
    }
    if (!tableHtml && tables.length > 0) tableHtml = tables[0] || '';
    if (!tableHtml) {
      return NextResponse.json({ rows: [] });
    }

    const rows: Array<{ pos: number; team: string; played: number; wins: number; draws: number; losses: number; points: number; next?: string; }> = [];

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    let sawHeader = false;
    while ((trMatch = trRegex.exec(tableHtml))) {
      const tr = trMatch[1];
      if (!sawHeader && /<th/i.test(tr)) { sawHeader = true; continue; }

      const tds: string[] = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(tr))) {
        tds.push(decodeEntities(stripTags(tdMatch[1])));
      }
      if (tds.length < 6) continue;

      const pos = parseInt(tds[0]) || rows.length + 1;
      const team = tds[1];
      const played = parseInt(tds[2]) || 0;
      const wins = parseInt(tds[3]) || 0;
      const draws = parseInt(tds[4]) || 0;
      const losses = parseInt(tds[5]) || 0;
      // Puntos puede venir en col 6 o 7 según plantilla
      const points = parseInt(tds[6] || tds[5]) || 0;
      const next = tds[7] || '';

      rows.push({ pos, team, played, wins, draws, losses, points, next });
    }

    return NextResponse.json({ rows });
  } catch (err: any) {
    // Evitar 500 hacia el cliente para no romper la UI
    return NextResponse.json({ rows: [] });
  }
} 