// Configuración para el RSS Service
export const RSS_CONFIG = {
  // Timeout para peticiones (en milisegundos) - Reducido para fallas más rápidas
  REQUEST_TIMEOUT: 8000,
  
  // Duración del cache (en milisegundos) - Aumentado a 1 hora para mejor rendimiento
  CACHE_DURATION: 60 * 60 * 1000,
  
  // Número máximo de reintentos por feed - Reducido para evitar demoras
  MAX_RETRIES: 2,
  
  // Delay entre reintentos (en milisegundos) - Reducido
  RETRY_DELAY: 800,
  
  // Servicios proxy disponibles (en orden de preferencia)
  PROXY_SERVICES: [
    'https://corsproxy.io/?',  // Este parece funcionar mejor
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/get?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/'  // Este último por los certificados expirados
  ],
  
  // Headers para las peticiones
  REQUEST_HEADERS: {
    'User-Agent': 'Mozilla/5.0 (compatible; RSS-Reader/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  },
  
  // Configuración de procesamiento en lotes
  BATCH_SIZE: 5, // Aumentado de 3 a 5 para procesar más en paralelo
  BATCH_DELAY: 1000, // Reducido delay entre lotes
  MIN_REQUEST_INTERVAL: 300, // Reducido intervalo mínimo entre peticiones
}

// Función para delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para reintentar una operación
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = RSS_CONFIG.MAX_RETRIES,
  delayMs: number = RSS_CONFIG.RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Intento ${attempt} falló:`, error);
      
      if (attempt < maxRetries) {
        await delay(delayMs * attempt); // Backoff exponencial
      }
    }
  }
  
  throw lastError!;
} 