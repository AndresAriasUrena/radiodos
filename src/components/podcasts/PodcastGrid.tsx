'use client';

import { useState, useEffect, useCallback } from 'react';
import PodcastCard from '../UI/PodcastCard';
import { IoFilter, IoClose, IoReload } from 'react-icons/io5';
import { useRouter, useSearchParams } from 'next/navigation';
import RSSService from '@/lib/rssService';
import { PodcastShow } from '@/types/podcast';

interface PodcastGridProps {
  onOpenFilters?: () => void;
}

export default function PodcastGrid() {
  const [podcasts, setPodcasts] = useState<PodcastShow[]>([]);
  const [radionovelas, setRadionovelas] = useState<PodcastShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadPodcasts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [podcastShows, radioShows] = await Promise.all([
        RSSService.getPodcasts(),
        RSSService.getRadionovelas()
      ]);
      
      setPodcasts(podcastShows);
      setRadionovelas(radioShows);
      setRetryCount(0);
    } catch (err) {
      console.error('❌ Error loading podcasts:', err);
      setError('Error al cargar los podcasts. Por favor, intenta nuevamente.');
      
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadPodcasts();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    loadPodcasts();
  }, [loadPodcasts]);

  const handleRetry = () => {
    setError(null);
    loadPodcasts();
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
      <div className="flex-1">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-[#D51F2F] mb-2">
              Error al cargar podcasts
            </h3>
            <p className="text-[#C7C7C7] mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="text-white bg-[#1E305F] px-4 py-2 rounded-md flex items-center gap-2 mx-auto hover:bg-[#D51F2F] transition-colors"
            >
              <IoReload className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalShows = podcasts.length + radionovelas.length;

  return (
    <div className="flex-1">
      {/* Sección de Podcasts */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className=" font-semibold text-xl text-black">Podcasts</h2>
            </div>
            <div className="h-0.5 w-full bg-[#D4D5DD] my-4" />
            
            <p className="text-black/60 mt-1">
              {isLoading && podcasts.length === 0 
                ? 'Cargando podcasts...' 
                : `${podcasts.length} podcast${podcasts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {isLoading && podcasts.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <PodcastSkeleton key={index} />
            ))}
          </div>
        )}

        {podcasts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}

        {!isLoading && podcasts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#C7C7C7] text-lg">
              No se encontraron podcasts
            </p>
          </div>
        )}
      </div>

      {/* Sección de Radionovelas */}
      <div>
        <div id="radionovelas" className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className=" font-semibold text-xl text-black">Radionovelas</h2>
            </div>
            <div className="h-0.5 w-full bg-[#D4D5DD] my-4" />
            
            <p className="text-black/60 mt-1">
              {isLoading && radionovelas.length === 0 
                ? 'Cargando radionovelas...' 
                : `${radionovelas.length} radionovela${radionovelas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {isLoading && radionovelas.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <PodcastSkeleton key={`radio-${index}`} />
            ))}
          </div>
        )}

        {radionovelas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {radionovelas.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}

        {!isLoading && radionovelas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#C7C7C7] text-lg">
              No se encontraron radionovelas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}