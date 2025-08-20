import { RSSFeedData, PodcastShow, PodcastEpisode, Author } from '@/types/podcast';
import { RSS_CONFIG, retryOperation } from './rssConfig';
import * as xml2js from 'xml2js';

const PODCAST_RSS_FEEDS = [
	// PODCASTS (Programas) - YouTube Playlists
	{ url: 'https://www.youtube.com/watch?v=WUPkfxstdlI&list=PLR6ilCH2z2UjB_B9UxjHbyt4uZQzN1UhL', status: 'podcast' as const },
	{ url: 'https://www.youtube.com/watch?v=u2wiG9Tv5I4&list=PLR6ilCH2z2UijukrGdUfzpF449rv7pBkJ', status: 'podcast' as const },
	{ url: 'https://www.youtube.com/watch?v=qjZAFkSQr8c&list=PLR6ilCH2z2UiBetZbuboVsDZAfbauo-5B', status: 'podcast' as const },

	// RADIONOVELAS (Captivate)
	{ url: 'https://feeds.captivate.fm/la-voluntad-de-la-pampa/', status: 'radionovela' as const },
	{ url: 'https://feeds.captivate.fm/polvora-en-abril/', status: 'radionovela' as const },
	{ url: 'https://feeds.captivate.fm/libertad-al-amanecer/', status: 'radionovela' as const },
];

// Configuración personalizada para podcasts de YouTube
const YOUTUBE_PODCAST_CONFIG: { [url: string]: { description?: string; imageUrl?: string; title?: string } } = {
	// Podcast 1
	'https://www.youtube.com/watch?v=WUPkfxstdlI&list=PLR6ilCH2z2UjB_B9UxjHbyt4uZQzN1UhL': {
		title: 'Columbia Deportiva',
		description: 'Cobertura de los partidos de Columbia Deportiva',
		imageUrl: '/assets/LogoColumbiaDeportes.svg'
	},
	
	// Podcast 2
	'https://www.youtube.com/watch?v=u2wiG9Tv5I4&list=PLR6ilCH2z2UijukrGdUfzpF449rv7pBkJ': {
		title: 'Por Tres Razones',
		description: 'Descripción personalizada del segundo podcast de YouTube',
		imageUrl: '/assets/PorTresRazones.avif'
	},
	
	// Podcast 3
	'https://www.youtube.com/watch?v=qjZAFkSQr8c&list=PLR6ilCH2z2UiBetZbuboVsDZAfbauo-5B': {
		title: 'Voces',
		description: 'Descripción personalizada del tercer podcast de YouTube',
		imageUrl: '/assets/LogoColumbiaDeportes.svg'
	},
};

// Sin autores por ahora
const PODCAST_AUTHORS: { [podcastUrl: string]: Author[] } = {};

class RSSService {
	private static instance: RSSService;
	private cache: Map<string, { data: RSSFeedData; timestamp: number }> = new Map();
	private requestQueue: Map<string, Promise<RSSFeedData>> = new Map();
	private lastRequestTime: number = 0;
	private readonly MIN_REQUEST_INTERVAL = RSS_CONFIG.MIN_REQUEST_INTERVAL;
	private readonly CACHE_DURATION = RSS_CONFIG.CACHE_DURATION;

	static getInstance(): RSSService {
		if (!RSSService.instance) {
			RSSService.instance = new RSSService();
		}
		return RSSService.instance;
	}

	private async parseRSSXML(xmlString: string): Promise<RSSFeedData> {
		return new Promise((resolve, reject) => {
			const parser = new xml2js.Parser({
				explicitArray: false,
				ignoreAttrs: false,
				mergeAttrs: true
			});

			parser.parseString(xmlString, (err, result) => {
				if (err) {
					reject(new Error(`Error parsing XML: ${err.message}`));
					return;
				}

				try {
					// Soporte RSS clásico
					if (result.rss && result.rss.channel) {
						const rss = result.rss;
						const channel = rss.channel;
						const title = channel.title || '';
						const description = channel.description || '';
						const link = channel.link || '';
						const language = channel.language || undefined;
						const author = channel.author || channel['itunes:author'] || undefined;
						const category = channel.category || (channel['itunes:category'] && channel['itunes:category'].text) || undefined;
						const lastBuildDate = channel.lastBuildDate || undefined;

						let image = '';
						if (channel['itunes:image'] && channel['itunes:image'].href) {
							image = channel['itunes:image'].href;
						} else if (channel.image && channel.image.url) {
							image = channel.image.url;
						}

						const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);
						const episodes = items.map((item: any) => {
							const episodeTitle = item.title || '';
							const episodeDescription = item.description || '';
							const pubDate = item.pubDate || '';
							const guid = item.guid || '';
							let audioUrl = '';
							if (item.enclosure && item.enclosure.url) {
								audioUrl = item.enclosure.url;
							} else if (item['media:content'] && item['media:content'].url) {
								audioUrl = item['media:content'].url;
							}
							let duration = '';
							if (item['itunes:duration']) {
								const durationText = item['itunes:duration'];
								if (durationText && !durationText.includes(':')) {
									const totalSeconds = parseInt(durationText);
									if (!isNaN(totalSeconds)) {
										const hours = Math.floor(totalSeconds / 3600);
										const minutes = Math.floor((totalSeconds % 3600) / 60);
										const seconds = totalSeconds % 60;
										if (hours > 0) {
											duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
										} else {
											duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
										}
									} else {
										duration = durationText;
									}
								} else {
									duration = durationText || '00:00';
								}
							}

							return {
								title: episodeTitle,
								description: episodeDescription,
								audioUrl,
								duration: duration || '00:00',
								pubDate,
								guid
							};
						});

						resolve({
							title,
							description,
							image,
							link,
							language,
							author,
							category,
							lastBuildDate,
							episodes
						});
						return;
					}

					// Soporte Atom (YouTube playlists)
					if (result.feed) {
						const feed = result.feed;
						const title = feed.title || '';
						const description = (feed.subtitle && feed.subtitle._) || '';
						const link = Array.isArray(feed.link) ? (feed.link.find((l: any) => l.rel === 'alternate')?.href || feed.link[0]?.href || '') : (feed.link?.href || '');
						const language = feed['language'] || undefined;
						const author = (feed.author && (feed.author.name || feed.author)) || undefined;
						const category = undefined;
						const lastBuildDate = feed.updated || undefined;
						let image = '';
						if (feed['media:thumbnail'] && feed['media:thumbnail'].url) {
							image = feed['media:thumbnail'].url;
						}
						const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry].filter(Boolean);
						const episodes = entries.map((entry: any) => {
							const eTitle = entry.title || '';
							const pubDate = entry.published || entry.updated || '';
							let videoUrl = '';
							if (Array.isArray(entry.link)) {
								videoUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || entry.link[0]?.href || '';
							} else if (entry.link && entry.link.href) {
								videoUrl = entry.link.href;
							}
							let thumb = '';
							if (entry['media:group'] && entry['media:group']['media:thumbnail'] && entry['media:group']['media:thumbnail'].url) {
								thumb = entry['media:group']['media:thumbnail'].url;
							}
							return {
								title: eTitle,
								description: '',
								audioUrl: videoUrl, // usamos el enlace del video como URL
								duration: '00:00',
								pubDate,
								guid: entry.id || videoUrl
							};
						});

						resolve({
							title,
							description: description || '',
							image: image || '',
							link,
							language,
							author,
							category,
							lastBuildDate,
							episodes
						});
						return;
					}

					reject(new Error('Formato de feed no soportado'));
				} catch (error) {
					reject(new Error(`Error processing RSS/Atom data: ${(error as Error).message}`));
				}
			});
		});
	}

	private async fetchRSSFeed(url: string): Promise<RSSFeedData> {
		// Normalizar YouTube playlist a feed Atom
		let sourceUrl = url;
		try {
			const isYouTube = /youtube\.com/.test(url);
			if (isYouTube) {
				const listMatch = url.match(/[?&]list=([^&]+)/);
				if (listMatch && listMatch[1]) {
					const playlistId = decodeURIComponent(listMatch[1]);
					sourceUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
				}
			}
		} catch {
			// mantener url original en caso de fallo
		}

		// Verificar si ya hay una petición en curso para esta URL normalizada
		const existingRequest = this.requestQueue.get(sourceUrl);
		if (existingRequest) {
			return existingRequest;
		}

		// Verificar caché
		const cached = this.cache.get(sourceUrl);
		if (cached && Date.now() - cached.timestamp < RSS_CONFIG.CACHE_DURATION) {
			return cached.data;
		}

		// Rate limiting
		const now = Date.now();
		const timeSinceLastRequest = now - this.lastRequestTime;
		if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
			const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
			await new Promise(resolve => setTimeout(resolve, waitTime));
		}
		this.lastRequestTime = Date.now();

		const requestPromise = retryOperation(async () => {
			const apiUrl = `/api/rss?url=${encodeURIComponent(sourceUrl)}`;
			const response = await fetch(apiUrl, {
				headers: { 'Content-Type': 'application/json' },
				next: { revalidate: 300 }
			});
			if (!response.ok) {
				throw new Error(`Error HTTP: ${response.status}`);
			}
			const data = await response.json();
			if (data.error) {
				throw new Error(data.error);
			}
			const rssData = await this.parseRSSXML(data.content);
			this.cache.set(sourceUrl, { data: rssData, timestamp: Date.now() });
			return rssData;
		}, RSS_CONFIG.MAX_RETRIES, RSS_CONFIG.RETRY_DELAY);

		this.requestQueue.set(sourceUrl, requestPromise);
		try {
			const result = await requestPromise;
			return result;
		} finally {
			this.requestQueue.delete(sourceUrl);
		}
	}

	async getPodcasts(): Promise<PodcastShow[]> {
		const allPodcasts = await this.getAllPodcasts();
		return allPodcasts.filter(podcast => podcast.status === 'podcast');
	}

	async getRadionovelas(): Promise<PodcastShow[]> {
		const allPodcasts = await this.getAllPodcasts();
		return allPodcasts.filter(podcast => podcast.status === 'radionovela');
	}

	async getAllPodcasts(): Promise<PodcastShow[]> {
		const shows: PodcastShow[] = [];
		const BATCH_SIZE = RSS_CONFIG.BATCH_SIZE;
		for (let i = 0; i < PODCAST_RSS_FEEDS.length; i += BATCH_SIZE) {
			const batch = PODCAST_RSS_FEEDS.slice(i, i + BATCH_SIZE);
			const batchPromises = batch.map(async (rssUrl) => {
				try {
					const feedData = await this.fetchRSSFeed(rssUrl.url);
					const customConfig = YOUTUBE_PODCAST_CONFIG[rssUrl.url] || {};
					
					const show: PodcastShow = {
						id: this.generateIdFromUrl(rssUrl.url),
						title: customConfig.title || feedData.title,
						description: customConfig.description || feedData.description,
						imageUrl: customConfig.imageUrl || feedData.image,
						link: feedData.link,
						rssUrl: rssUrl.url,
						language: feedData.language,
						author: feedData.author,
						category: feedData.category,
						lastBuildDate: feedData.lastBuildDate,
						authors: [],
						status: rssUrl.status
					};
					return show;
				} catch (error) {
					console.error(`Error al procesar podcast ${rssUrl.url}:`, error);
					const fallbackShow: PodcastShow = {
						id: this.generateIdFromUrl(rssUrl.url),
						title: 'Podcast',
						description: 'Información temporalmente no disponible',
						imageUrl: '/assets/autores/EmmaTristan.jpeg',
						link: rssUrl.url,
						rssUrl: rssUrl.url,
						language: 'es',
						author: undefined,
						category: undefined,
						lastBuildDate: undefined,
						authors: [],
						status: rssUrl.status
					};
					return fallbackShow;
				}
			});
			const results = await Promise.allSettled(batchPromises);
			results.forEach(result => {
				if (result.status === 'fulfilled' && result.value) {
					shows.push(result.value);
				}
			});
			if (i + BATCH_SIZE < PODCAST_RSS_FEEDS.length) {
				await new Promise(resolve => setTimeout(resolve, RSS_CONFIG.BATCH_DELAY));
			}
		}
		if (shows.length === 0) {
			throw new Error('No se pudo cargar ningún podcast. Verifica tu conexión a internet.');
		}
		return shows;
	}

	async getPodcastEpisodes(rssUrl: string): Promise<PodcastEpisode[]> {
		try {
			const feedData = await this.fetchRSSFeed(rssUrl);
			const showId = this.generateIdFromUrl(rssUrl);
			return feedData.episodes.map(episode => ({
				id: episode.guid || this.generateIdFromTitle(episode.title),
				title: episode.title,
				description: episode.description,
				audioUrl: episode.audioUrl,
				duration: episode.duration,
				pubDate: episode.pubDate,
				guid: episode.guid,
				showId
			}));
		} catch (error) {
			console.error(`Error al obtener episodios para ${rssUrl}:`, error);
			return [];
		}
	}

	async getPodcastById(id: string): Promise<PodcastShow | null> {
		const shows = await this.getAllPodcasts();
		return shows.find(show => show.id === id) || null;
	}

	private generateIdFromUrl(url: string): string {
		return btoa(url).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	}

	private generateIdFromTitle(title: string): string {
		return title.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	}

	static cleanHtml(htmlString: string): string {
		const div = document.createElement('div');
		div.innerHTML = htmlString;
		return div.textContent || div.innerText || '';
	}

	static formatDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('es-ES', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			return dateString;
		}
	}

	static addPodcastRSS(rssUrl: string) {
		if (!PODCAST_RSS_FEEDS.some(feed => feed.url === rssUrl)) {
			PODCAST_RSS_FEEDS.push({ url: rssUrl, status: 'podcast' });
		}
	}

	static getRSSFeeds(): string[] {
		return [...PODCAST_RSS_FEEDS.map(feed => feed.url)];
	}

	// Funciones de autores: no-op / sin autores
	static addPodcastAuthors(_rssUrl: string, _authors: Author[]): void { /* no-op */ }
	static getPodcastAuthors(): Author[] { return []; }
	static updateAuthorConfig(_podcastId: string, _authors: Author[]): void { /* no-op */ }
	static getAllAuthorConfigs(): { [podcastId: string]: Author[] } { return {}; }
	static getCurrentAuthors(): Author[] { return []; }
}

export { RSSService };
export default RSSService.getInstance(); 