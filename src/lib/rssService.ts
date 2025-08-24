import { RSSFeedData, PodcastShow, PodcastEpisode, Author } from '@/types/podcast';
import { RSS_CONFIG, retryOperation } from './rssConfig';
import * as xml2js from 'xml2js';

const PODCAST_RSS_FEEDS = [
	'https://feeds.captivate.fm/la-voluntad-de-la-pampa/',
	'https://feeds.captivate.fm/polvora-en-abril/',
	'https://feeds.captivate.fm/libertad-al-amanecer/',
	'https://feeds.captivate.fm/rockandlocuras/',
	'https://feeds.captivate.fm/ride-on/',
];

// Configuración de horarios para podcasts
const PODCAST_SCHEDULES: { [url: string]: string } = {
	'https://feeds.captivate.fm/la-voluntad-de-la-pampa/': 'Lunes a Viernes | 6 AM - 8 AM',
	'https://feeds.captivate.fm/polvora-en-abril/': 'Lunes a Viernes | 8 AM - 10 AM',
	'https://feeds.captivate.fm/libertad-al-amanecer/': 'Sábados | 10 AM - 12 PM',
	'https://feeds.captivate.fm/rockandlocuras/': 'Sábados | 1 PM',
	'https://feeds.captivate.fm/ride-on/': 'Lunes a Viernes | 5 PM - 7 PM',
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

					reject(new Error('Formato de feed no soportado'));
				} catch (error) {
					reject(new Error(`Error processing RSS data: ${(error as Error).message}`));
				}
			});
		});
	}

	private async fetchRSSFeed(url: string): Promise<RSSFeedData> {
		// Verificar si ya hay una petición en curso para esta URL
		const existingRequest = this.requestQueue.get(url);
		if (existingRequest) {
			return existingRequest;
		}

		// Verificar caché
		const cached = this.cache.get(url);
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
			const apiUrl = `/api/rss?url=${encodeURIComponent(url)}`;
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
			this.cache.set(url, { data: rssData, timestamp: Date.now() });
			return rssData;
		}, RSS_CONFIG.MAX_RETRIES, RSS_CONFIG.RETRY_DELAY);

		this.requestQueue.set(url, requestPromise);
		try {
			const result = await requestPromise;
			return result;
		} finally {
			this.requestQueue.delete(url);
		}
	}

	async getPodcasts(): Promise<PodcastShow[]> {
		return this.getAllPodcasts();
	}

	async getAllPodcasts(): Promise<PodcastShow[]> {
		const shows: PodcastShow[] = [];
		const BATCH_SIZE = RSS_CONFIG.BATCH_SIZE;
		for (let i = 0; i < PODCAST_RSS_FEEDS.length; i += BATCH_SIZE) {
			const batch = PODCAST_RSS_FEEDS.slice(i, i + BATCH_SIZE);
			const batchPromises = batch.map(async (rssUrl) => {
				try {
					const feedData = await this.fetchRSSFeed(rssUrl);
					const schedule = PODCAST_SCHEDULES[rssUrl] || 'Horario no disponible';
					
					const show: PodcastShow = {
						id: this.generateIdFromUrl(rssUrl),
						title: feedData.title,
						description: feedData.description,
						imageUrl: feedData.image,
						link: feedData.link,
						rssUrl: rssUrl,
						language: feedData.language,
						author: feedData.author,
						category: feedData.category,
						lastBuildDate: feedData.lastBuildDate,
						authors: [],
						schedule: schedule
					};
					return show;
				} catch (error) {
					console.error(`Error al procesar podcast ${rssUrl}:`, error);
					const fallbackShow: PodcastShow = {
						id: this.generateIdFromUrl(rssUrl),
						title: 'Podcast',
						description: 'Información temporalmente no disponible',
						imageUrl: '/assets/autores/EmmaTristan.jpeg',
						link: rssUrl,
						rssUrl: rssUrl,
						language: 'es',
						author: undefined,
						category: undefined,
						lastBuildDate: undefined,
						authors: [],
						schedule: 'Horario no disponible'
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
		if (!PODCAST_RSS_FEEDS.includes(rssUrl)) {
			PODCAST_RSS_FEEDS.push(rssUrl);
		}
	}

	static getRSSFeeds(): string[] {
		return [...PODCAST_RSS_FEEDS];
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