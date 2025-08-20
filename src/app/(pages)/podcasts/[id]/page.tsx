'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RSSService from '@/lib/rssService';
import { PodcastShow, PodcastEpisode } from '@/types/podcast';
import Image from 'next/image';
import Link from 'next/link';
import { IoArrowBack, IoPlay, IoCalendar, IoArrowForward } from 'react-icons/io5';
import PodcastsGridHome from '@/components/home/PodcastsGridHome';
import { usePlayer } from '@/lib/PlayerContext';

export default function PodcastDetailPage() {
  const params = useParams();
  const [podcast, setPodcast] = useState<PodcastShow | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playEpisode, playerState } = usePlayer();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState(0);
  const EPISODES_PER_PAGE = 7;

  const cleanHtml = (htmlString: string): string => {
    if (typeof window !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = htmlString;
      return div.textContent || div.innerText || '';
    }
    return htmlString.replace(/<[^>]*>/g, '');
  };

  const formatDate = (dateString: string): string => {
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
  };

  const formatTime = (duration: string): string => {
    if (!duration) return '00:00';
    if (duration.includes(':')) return duration;
    const totalSeconds = parseInt(duration);
    if (isNaN(totalSeconds)) return duration;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchPodcastData = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError(null);

        const podcastData = await RSSService.getPodcastById(params.id as string);
        if (!podcastData) {
          setError('Podcast no encontrado');
          return;
        }

        setPodcast(podcastData);

        const episodesData = await RSSService.getPodcastEpisodes(podcastData.rssUrl);
        setEpisodes(episodesData);

        document.title = `${podcastData.title} | Radio Columbia`;

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el podcast');
      } finally {
        setLoading(false);
      }
    };

    fetchPodcastData();
  }, [params.id]);

  const handlePlayEpisode = (episode: PodcastEpisode, index: number) => {
    if (podcast) {
      playEpisode(episode, podcast, episodes, index);
    }
  };

  const handlePlayFirstEpisode = () => {
    if (podcast && episodes.length > 0) {
      playEpisode(episodes[0], podcast, episodes, 0);
    }
  };

  const totalPages = Math.ceil(episodes.length / EPISODES_PER_PAGE);
  const paginatedEpisodes = episodes.slice(
    (currentPage - 1) * EPISODES_PER_PAGE,
    currentPage * EPISODES_PER_PAGE
  );

  if (loading) {
    return (
      <>
        <div className="min-h-screen">
          <Navbar />
          <div className="mx-2">
            <div className="max-w-7xl mx-auto relative flex flex-col lg:flex-row gap-4 ">
              <div className="w-full lg:w-[75%]">
                <div className='px-4 sm:px-6 py-8 bg-[#D4D5DD] rounded-2xl'>
                  <div className="p-8">
                    {/* Botón volver */}
                    <div className="animate-pulse mb-8">
                      <div className="h-4 bg-[#afafbe] rounded w-32"></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 justify-between">
                      <div className="flex-1">
                        {/* Título y autor */}
                        <div className="animate-pulse space-y-4 mb-6">
                          <div className="h-8 bg-[#afafbe] rounded w-3/4"></div>
                          <div className="h-4 bg-[#afafbe] rounded w-1/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-[#afafbe] rounded"></div>
                            <div className="h-4 bg-[#afafbe] rounded"></div>
                            <div className="h-4 bg-[#afafbe] rounded w-2/3"></div>
                          </div>
                        </div>
                        {/* Botón reproducir */}
                        <div className="animate-pulse">
                          <div className="h-10 bg-[#afafbe] rounded-full w-36"></div>
                        </div>
                      </div>
                      {/* Imagen */}
                      <div className="animate-pulse flex-shrink-0">
                        <div className="w-40 h-40 bg-[#afafbe] rounded-2xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Episodios */}
              <div className="w-full lg:w-[25%]">
                <div className="animate-pulse">
                  {/* Título y navegación */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-6 bg-[#D4D5DD] rounded w-32"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-6 bg-[#afafbe] rounded"></div>
                      <div className="h-6 w-6 bg-[#afafbe] rounded"></div>
                    </div>
                  </div>
                  {/* Línea separadora */}
                  <div className="h-0.5 w-full bg-[#afafbe] mb-3"></div>
                  {/* Lista de episodios */}
                  <div className="space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="bg-[#D4D5DD] rounded-xl p-3">
                        <div className="space-y-2">
                          <div className="h-5 bg-[#afafbe] rounded w-3/4"></div>
                          <div className="flex gap-4">
                            <div className="h-4 bg-[#afafbe] rounded w-24"></div>
                            <div className="h-4 bg-[#afafbe] rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !podcast) {
    return (
      <>
        <div className="min-h-screen">
          <Navbar />
          <div className="px-4 sm:px-8">
            <div className="max-w-7xl mx-auto relative mt-4">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-[#D71C31] mb-4">
                  {error || 'Podcast/Radionovela no encontrado'}
                </h2>
                <Link
                  href="/podcasts"
                  className="text-[#C7C7C7] hover:text-[#1E305F] transition-colors"
                >
                  Volver a podcasts/radionovelas
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isPlayingThisPodcast = playerState.currentShow?.id === podcast.id;

  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-2">
          <div className="max-w-7xl mx-auto relative flex flex-col lg:flex-row gap-4 ">
            <div className="w-full lg:w-[75%]">
              <div className='px-4 sm:px-6 py-8 bg-[#F8FBFF] rounded-2xl'>
                <Link
                  href="/podcasts"
                  className="inline-flex items-center gap-2 text-[#000000] hover:text-[#1E305F] transition-colors mb-2"
                >
                  <IoArrowBack className="w-4 h-4" />
                  Volver a podcasts
                </Link>

                <div className="flex flex-col md:flex-row gap-6 md:p-8 justify-between lg:mb-14">
                  <div className="flex-1 order-2 lg:order-1">
                    <h1 className=" font-medium text-3xl text-[#000000] mb-1">
                      {cleanHtml(podcast.title)}
                    </h1>
                    {podcast.author && (
                      <p className="text-[#000000]/50 mb-4 text-sm">
                        {podcast.author}
                      </p>
                    )}
                    <div
                      className="text-[#000000]/60 leading-tight max-w-lg"
                      dangerouslySetInnerHTML={{
                        __html: cleanHtml(podcast.description).replace(/\n/g, '<br>')
                      }}
                    />
                    <button
                      onClick={handlePlayFirstEpisode}
                      className='text-[#FFFFFF] bg-[#D51F2F] rounded-full px-4 py-2 text-sm mt-4 flex flex-row items-center gap-2 hover:bg-[#1E305F] transition-all duration-300 group'
                    >
                      Reproducir
                      <IoPlay className='w-6 h-6 text-[#D51F2F] bg-[#FFFFFF] rounded-full p-1 group-hover:text-[#1E305F] transition-all duration-300' />
                    </button>
                  </div>
                  <div className="flex-shrink-0 order-1 lg:order-2 border-[#B4B4B4]">
                    <Image
                      src={podcast.imageUrl || '/placeholder-podcast.jpg'}
                      alt={cleanHtml(podcast.title)}
                      width={100}
                      height={100}
                      className="rounded-2xl border border-[#D4D5DD] object-cover w-full lg:w-52 shadow-lg"
                    />
                  </div>
                </div>
              </div>
              <div className='px-4 sm:px-6 py-8 bg-[#F8FBFF] mt-4 rounded-2xl hidden lg:block'>
                <PodcastsGridHome />
              </div>
            </div>

            <div className='w-full lg:w-[25%] lg:overflow-y-auto lg:max-h-[90vh] scrollbar-hide px-4 sm:px-8 py-4 sm:py-8 bg-[#1E305F] rounded-2xl'>
              <div>
                <div className='flex flex-row items-center justify-between'>
                  <h2 className=" font-semibold text-xl text-[#D4D5DD]">Capítulos ({episodes.length})</h2>
                  <div className='flex flex-row items-center gap-2'>
                    <button
                      className={`text-[#D4D5DD] hover:bg-[#D51F2F] bg-[#FFFFFF]/15 rounded-full p-2 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <IoArrowBack className='w-4 h-4' />
                    </button>
                    <button
                      className={`text-[#D4D5DD] hover:bg-[#D51F2F] bg-[#D4D5DD]/15 rounded-full p-2 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <IoArrowForward className='w-4 h-4' />
                    </button>
                  </div>
                </div>
                <div className="h-[0.4px] w-full bg-[#D4D5DD] my-1 mb-3" />
                <div className="space-y-2">
                  {paginatedEpisodes.map((episode, index) => {
                    const globalIndex = (currentPage - 1) * EPISODES_PER_PAGE + index;
                    const isPlaying = isPlayingThisPodcast &&
                      playerState.currentEpisode?.id === episode.id &&
                      playerState.isPlaying;
                    return (
                      <button
                        key={episode.id}
                        onClick={() => handlePlayEpisode(episode, globalIndex)}
                        className={`rounded-xl p-3 transition-colors group w-full ${isPlaying
                            ? 'bg-[#D51F2F]'
                            : 'bg-[#FFFFFF]/15 hover:bg-[#D51F2F]'
                          }`}
                      >
                        <div className="flex items-start text-left gap-4">
                          <div className="flex flex-col w-full">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm mb-1 font-medium line-clamp-2 titlecase flex-1 group-hover:text-[#FFFFFF] ${isPlaying ? 'text-[#FFFFFF]' : 'text-[#FFFFFF]/40'
                                }`}>
                                {cleanHtml(episode.title)}
                              </h3>
                            </div>
                            <div className={`flex items-end gap-4 text-xs group-hover:text-[#FFFFFF]/80 ${isPlaying ? 'text-[#FFFFFF]/80' : 'text-[#FFFFFF]/30'
                              }`}>
                              <span className="flex items-center gap-1">
                                <IoCalendar className="w-4 h-4" />
                                {formatDate(episode.pubDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 