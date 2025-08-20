import { NextRequest, NextResponse } from 'next/server';
import { RSS_CONFIG } from '@/lib/rssConfig';

// Cache en memoria para el API
const cache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = RSS_CONFIG.CACHE_DURATION;

async function fetchWithProxy(url: string, proxyIndex: number = 0): Promise<string> {
  if (proxyIndex >= RSS_CONFIG.PROXY_SERVICES.length) {
    throw new Error('Todos los servicios proxy fallaron');
  }

  const proxyUrl = RSS_CONFIG.PROXY_SERVICES[proxyIndex] + encodeURIComponent(url);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RSS_CONFIG.REQUEST_TIMEOUT);
    
    
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: RSS_CONFIG.REQUEST_HEADERS,
      // Ignorar errores de certificados para ciertos proxies
      ...(proxyUrl.includes('thingproxy.freeboard.io') ? { rejectUnauthorized: false } : {})
    });
    
    clearTimeout(timeoutId);
    
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Obtener el contenido como texto primero
    const responseText = await response.text();
    
    // Verificar si el contenido está vacío
    if (!responseText || responseText.trim() === '') {
      throw new Error('Respuesta vacía del proxy');
    }
    
    // Verificar si es XML directo o JSON
    if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<rss')) {
      return responseText;
    } else {
      // Intentar parsear como JSON
      try {
        const data = JSON.parse(responseText);
        const content = data.contents || data;
        if (!content || (typeof content === 'string' && content.trim() === '')) {
          throw new Error('Contenido vacío en respuesta JSON');
        }
        return content;
      } catch (jsonError) {
        return responseText;
      }
    }
  } catch (error) {
    console.warn(`❌ Proxy ${proxyIndex + 1} falló para ${url}:`, error);
    // Intentar con el siguiente proxy
    return fetchWithProxy(url, proxyIndex + 1);
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
    const rssContent = await fetchWithProxy(url);
    
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