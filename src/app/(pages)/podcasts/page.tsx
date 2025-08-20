'use client';

import { useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PodcastGrid from '@/components/podcasts/PodcastGrid';

function PodcastsContent() {
  useEffect(() => {
    document.title = 'Podcasts | Radio Columbia - Nuestros Podcasts y Radionovelas';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Descubre nuestros podcasts y radionovelas en Radio Columbia. Escucha programas de entretenimiento, música y más contenido exclusivo de Costa Rica.'
      );
    } else {
      const newMeta = document.createElement('meta');
      newMeta.setAttribute('name', 'description');
      newMeta.setAttribute('content', 'Descubre nuestros podcasts y radionovelas en Radio Columbia. Escucha programas de entretenimiento, música y más contenido exclusivo de Costa Rica.');
      document.head.appendChild(newMeta);
    }
  }, []);

  return (
    <div className="px-4 sm:px-8">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex">
          <Suspense>
            <PodcastGrid />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function PodcastsPage() {
  return (
    <>
      <div className="min-h-screen  ">
        <Navbar />
        <div className="mx-2">
        <PodcastsContent />
        </div>
      </div>
      <Footer />
    </>
  );
} 