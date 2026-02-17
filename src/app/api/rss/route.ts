import { NextRequest, NextResponse } from 'next/server';
import { RSS_CONFIG } from '@/lib/rssConfig';

// Cache en memoria para el API
const cache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = RSS_CONFIG.CACHE_DURATION;

async function fetchRSSDirect(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RSS_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: RSS_CONFIG.REQUEST_HEADERS,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('Respuesta vacía del feed');
    }

    return responseText;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Verificar cache primero
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ 
      content: cached.content,
      cached: true,
      timestamp: cached.timestamp
    });
  }

  try {
    const rssContent = await fetchRSSDirect(url);
    
    if (!rssContent || rssContent.trim() === '') {
      throw new Error('No se pudo obtener contenido del RSS feed');
    }
    
    // Guardar en cache
    cache.set(url, { content: rssContent, timestamp: Date.now() });
    
    // Limpiar cache viejo cada 100 peticiones
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          cache.delete(key);
        }
      }
    }
    
    return NextResponse.json({ 
      content: rssContent,
      cached: false,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error fetching RSS:', error);
    return NextResponse.json(
      { error: `Failed to fetch RSS feed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 