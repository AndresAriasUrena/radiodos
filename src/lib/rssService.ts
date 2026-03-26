import { RSSFeedData, PodcastShow, PodcastEpisode, Author } from '@/types/podcast';
import { RSS_CONFIG, retryOperation } from './rssConfig';

// Metadatos locales de podcasts
interface PodcastMetadata {
	rssUrl: string;
	title: string;
	description: string;
	imageUrl: string;
	author: string;
	schedule: string;
}

const PODCAST_METADATA: PodcastMetadata[] = [
	{
		rssUrl: 'https://feeds.captivate.fm/ride-on/',
		title: 'Ride On',
		description: 'Extrovertida, amena, y auténtica. Esa es Stella. Ella nos acompaña de Lunes a Viernes con noticias de actualidad, buena música, y humor, agregándole el ingrediente extra que alegra las tardes y noches, mientras nos alistamos para regresar a casa y terminar el día.',
		imageUrl: '/assets/programas/RideOn.avif',
		author: 'Stella Peralta',
		schedule: 'Lunes a Viernes | 5 PM - 7 PM'
	},
	{
		rssUrl: 'https://feeds.captivate.fm/rockandlocuras/',
		title: 'Rock and Locuras',
		description: '¡El espacio para los roqueros! Danilo Jiménez nos da la receta musical del fin de semana con Una hora llena de energía y buen rock. presentamos los mejores éxitos del hard rock que se consolidaron desde la década de 1970.',
		imageUrl: '/assets/programas/RockandLocuras.avif',
		author: 'DR. FEELGOOD',
		schedule: 'Sábados | 1 PM'
	},
	{
		rssUrl: '',
		title: 'Break de la Tarde',
		description: '¡Nos tomamos un break en compañía de Miguel Monge! la voz icónica de Radio 2 que nos informa sobre el mundo del entretenimiento con una actitud positiva y nuestros éxitos favoritos.\n\nEl "break" es una ventana a los oyentes de la Dos para vincularse con la radio por medio de WhatsApp y las redes, con una dinámica ágil e interactiva.',
		imageUrl: '/assets/programas/BreakdelaTarde.avif',
		author: 'Miguel Monge',
		schedule: 'Lunes a Viernes | 3 PM - 4 PM'
	},
	{
		rssUrl: '',
		title: 'Morning Sounds with Sammy',
		description: 'Sammy regresa nuevamente al equipo de Radio Dos con un nuevo programa para que te acompañe con buena energía en las mañanas. Sammy te llevará a una emocionante aventura musical explorando sonidos desde la década de 1960 hasta hoy. Sus géneros musicales favoritos son: rock, pop, new wave, post-punk, soul y funk.',
		imageUrl: '/assets/programas/programasR2.avif',
		author: 'SAMANTHA BLACK',
		schedule: 'Lunes a Viernes | 6 AM - 8 AM'
	},
	{
		rssUrl: 'https://feeds.captivate.fm/sunshine-reggae/',
		title: 'Sunshine Reggae',
		description: 'Lo mejor del reggae y roots tiene su espacio en radio dos con Óscar Ortiz los sábados a las 4 pm. presentamos los mejores éxitos del reggae clásico, roots, dance hall y más.',
		imageUrl: '/assets/programas/SunshineReggae.avif',
		author: 'ÓSCAR ORTIZ - MR. RASTA',
		schedule: 'Sábados | 4 PM'
	},
	{
		rssUrl: 'https://feeds.captivate.fm/los-anos-dorados/',
		title: 'Los Años Dorados',
		description: 'Programa de radio de éxitos de los 60s y los 70s',
		imageUrl: '/assets/programas/annos-dorados.avif',
		author: 'Eliecer Barrantes',
		schedule: 'Martes y Jueves | 7 PM - Repetición: Domingo | 10 AM'
	},
	{
		rssUrl: '',
		title: 'Ola Futura',
		description: 'Stella Peralta nos regala una dosis de lo mejor de la música alternativa. Ola futura es un micro informativo que se programa varias veces al día, con información de artistas y lanzamientos, y joyas de la música que a menudo no reciben suficiente atención.',
		imageUrl: '/assets/programas/OlaFutura.avif',
		author: 'STELLA PERALTA',
		schedule: 'MICROS'
	}
];

class RSSService {
	private static instance: RSSService;
	private cache: Map<string, { data: RSSFeedData; timestamp: number }> = new Map();
	private requestQueue: Map<string, Promise<RSSFeedData>> = new Map();
	private readonly CACHE_DURATION = RSS_CONFIG.CACHE_DURATION;

	static getInstance(): RSSService {
		if (!RSSService.instance) {
			RSSService.instance = new RSSService();
		}
		return RSSService.instance;
	}

	private async fetchRSSFeed(url: string): Promise<RSSFeedData> {
		// Deduplicate concurrent requests for the same URL
		const existingRequest = this.requestQueue.get(url);
		if (existingRequest) {
			return existingRequest;
		}

		// Client-side cache check
		const cached = this.cache.get(url);
		if (cached && Date.now() - cached.timestamp < RSS_CONFIG.CACHE_DURATION) {
			return cached.data;
		}

		const requestPromise = retryOperation(async () => {
			const apiUrl = `/api/rss?url=${encodeURIComponent(url)}`;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`Error HTTP: ${response.status}`);
			}
			const rssData: RSSFeedData = await response.json();
			if ((rssData as any).error) {
				throw new Error((rssData as any).error);
			}
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
		// Build list from local metadata instantly — no network requests needed for the list UI.
		const shows: PodcastShow[] = PODCAST_METADATA.map((metadata) => ({
			id: metadata.rssUrl
				? this.generateIdFromUrl(metadata.rssUrl)
				: this.generateIdFromTitle(metadata.title),
			title: metadata.title,
			description: metadata.description,
			imageUrl: metadata.imageUrl,
			link: metadata.rssUrl,
			rssUrl: metadata.rssUrl,
			language: 'es',
			author: metadata.author,
			category: undefined,
			lastBuildDate: undefined,
			authors: [],
			schedule: metadata.schedule
		}));

		if (shows.length === 0) {
			throw new Error('No se pudo cargar ningún podcast. Verifica tu conexión a internet.');
		}

		// Warm the RSS cache in background so episodes are ready when the user selects a podcast.
		// fetchRSSFeed deduplicates concurrent requests, so getPodcastEpisodes() will share the same fetch.
		for (const metadata of PODCAST_METADATA) {
			if (metadata.rssUrl) {
				this.fetchRSSFeed(metadata.rssUrl).catch(() => {});
			}
		}

		return shows;
	}

	async getPodcastEpisodes(rssUrl: string): Promise<PodcastEpisode[]> {
		try {
			// If no RSS URL, return empty array
			if (!rssUrl) {
				return [];
			}

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
		const exists = PODCAST_METADATA.some(p => p.rssUrl === rssUrl);
		if (!exists) {
			PODCAST_METADATA.push({
				rssUrl,
				title: 'New Podcast',
				description: '',
				imageUrl: '',
				author: '',
				schedule: 'Horario no disponible'
			});
		}
	}

	static getRSSFeeds(): string[] {
		return PODCAST_METADATA.map(p => p.rssUrl);
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