'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { PodcastShow } from '@/types/podcast';
import RSSService from '@/lib/rssService';
import { IoReload } from 'react-icons/io5';
import PodcastCard from '@/components/UI/PodcastCard';

export default function PodcastsGridHome() {
  const [podcasts, setPodcasts] = useState<PodcastShow[]>([]);
  const [radionovelas, setRadionovelas] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPodcasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [podcastShows, radioshows] = await Promise.all([
        RSSService.getPodcasts(),
        RSSService.getRadionovelas()
      ]);
      
      setPodcasts(podcastShows);
      setRadionovelas(radioshows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar podcasts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPodcasts();
  }, [fetchPodcasts]);

  const handleRetry = () => {
    setError(null);
    fetchPodcasts();
  };

  // Componente de skeleton mejorado
  const PodcastSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-[#D4D5DD] aspect-[16/16] rounded-2xl mb-4 shadow-sm"></div>
      <div className="space-y-3">
        <div className="h-5 bg-[#D4D5DD] rounded w-3/4"></div>
        <div className="h-4 bg-[#D4D5DD] rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-[#D4D5DD] rounded"></div>
          <div className="h-3 bg-[#D4D5DD] rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <section className="w-full max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between">
          <h2 className=" font-semibold text-xl text-black">Error al cargar los podcasts</h2>
        </div>
        <div className="h-0.5 w-full bg-[#D4D5DD] my-3" />
        <div className="text-center py-8">
          <p className="text-[#C7C7C7] mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="text-white bg-[#1E305F] px-4 py-2 rounded-md flex items-center gap-2 mx-auto hover:bg-[#D51F2F] transition-colors"
          >
            <IoReload className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  const recentPodcasts = podcasts
    .sort((a, b) => {
      const dateA = new Date(a.lastBuildDate || '');
      const dateB = new Date(b.lastBuildDate || '');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  const recentRadionovelas = radionovelas
    .sort((a, b) => {
      const dateA = new Date(a.lastBuildDate || '');
      const dateB = new Date(b.lastBuildDate || '');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  return (
    <section className="w-full max-w-7xl mx-auto px-8 space-y-12">
      <div>
        <div className="flex items-center justify-between">
          <h2 className=" font-semibold text-xl text-black">Podcasts</h2>
          <Link href="/podcasts" className="text-black/60 hover:text-[#1E305F] text-sm flex items-center gap-1 transition-colors">
            Ver todos <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="h-0.5 w-full bg-[#D4D5DD] my-3" />
        
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <PodcastSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && recentPodcasts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}

        {!loading && recentPodcasts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#C7C7C7] text-lg">
              No se encontraron podcasts
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className=" font-semibold text-xl text-black">Radionovelas</h2>
          <Link href="/podcasts#radionovelas" className="text-black/60 hover:text-[#1E305F] text-sm flex items-center gap-1 transition-colors">
            Ver todos <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="h-0.5 w-full bg-[#D4D5DD] my-3" />
        
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <PodcastSkeleton key={`radio-${index}`} />
            ))}
          </div>
        )}

        {!loading && recentRadionovelas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentRadionovelas.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}

        {!loading && recentRadionovelas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#C7C7C7] text-lg">
              No se encontraron radionovelas
            </p>
          </div>
        )}
      </div>
    </section>
  );
} 