import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, { url: string | null; ts: number }>();
const TTL = 1000 * 60 * 60 * 24; // 24 horas — el artwork de una canción no cambia

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  if (!title) return NextResponse.json({ url: null }, { status: 400 });

  const cached = cache.get(title);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ url: cached.url });
  }

  try {
    const term = encodeURIComponent(title.trim());
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&media=music&limit=1&entity=song`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    const url: string | null =
      data.results?.[0]?.artworkUrl100?.replace('100x100bb', '300x300bb') ?? null;

    cache.set(title, { url, ts: Date.now() });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
