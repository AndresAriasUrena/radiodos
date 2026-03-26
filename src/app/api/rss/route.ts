import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import * as xml2js from 'xml2js';
import { RSS_CONFIG } from '@/lib/rssConfig';
import type { RSSFeedData } from '@/types/podcast';

async function fetchAndParse(url: string): Promise<RSSFeedData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RSS_CONFIG.REQUEST_TIMEOUT);

  let xmlText: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: RSS_CONFIG.REQUEST_HEADERS,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    xmlText = await response.text();
    if (!xmlText || xmlText.trim() === '') throw new Error('Respuesta vacía del feed');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }

  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, mergeAttrs: true });
    parser.parseString(xmlText, (err, result) => {
      if (err) { reject(new Error(`Error parsing XML: ${err.message}`)); return; }
      try {
        if (!result?.rss?.channel) { reject(new Error('Formato de feed no soportado')); return; }
        const channel = result.rss.channel;
        let image = '';
        if (channel['itunes:image']?.href) image = channel['itunes:image'].href;
        else if (channel.image?.url) image = channel.image.url;

        const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);
        const episodes = items.map((item: any) => {
          let audioUrl = '';
          if (item.enclosure?.url) audioUrl = item.enclosure.url;
          else if (item['media:content']?.url) audioUrl = item['media:content'].url;

          let duration = '00:00';
          const raw = item['itunes:duration'];
          if (raw) {
            if (!raw.includes(':')) {
              const secs = parseInt(raw);
              if (!isNaN(secs)) {
                const h = Math.floor(secs / 3600);
                const m = Math.floor((secs % 3600) / 60);
                const s = secs % 60;
                duration = h > 0
                  ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                  : `${m}:${String(s).padStart(2, '0')}`;
              }
            } else {
              duration = raw;
            }
          }

          return {
            title: item.title || '',
            description: item.description || '',
            audioUrl,
            duration,
            pubDate: item.pubDate || '',
            guid: item.guid || '',
          };
        });

        resolve({
          title: channel.title || '',
          description: channel.description || '',
          image,
          link: channel.link || '',
          language: channel.language,
          author: channel.author || channel['itunes:author'],
          category: channel.category || channel['itunes:category']?.text,
          lastBuildDate: channel.lastBuildDate,
          episodes,
        });
      } catch (e) {
        reject(new Error(`Error processing RSS: ${(e as Error).message}`));
      }
    });
  });
}

// Persistent server-side cache — survives across requests and cold starts
function getCachedFeed(url: string) {
  return unstable_cache(
    () => fetchAndParse(url),
    [`rss-feed-${url}`],
    { revalidate: 3600 }
  )();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const feedData = await getCachedFeed(url);
    return NextResponse.json(feedData, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    console.error('❌ Error fetching RSS:', error);
    return NextResponse.json(
      { error: `Failed to fetch RSS feed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
