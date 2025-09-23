'use client';

import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/home/Hero';
import Footer from '@/components/Footer';
import CategoryNewsGrid from '@/components/home/CategoryNewsGrid';

export const dynamic = 'force-dynamic';

function HomeContent() {

  return (
    <>
      <div className="min-h-screen overflow-hidden">
        <div className="flex flex-col lg:flex-row -my-4 md:pr-4">
          <div className="flex-1">
            <Hero/>
            <CategoryNewsGrid
              title="últimas Noticias"
              tagSlug=""
              showCategories={true}
            />
              <div className='w-full h-[2px] bg-[#141414]'/>
            <CategoryNewsGrid
              title="Destacados"
              tagSlug="destacados"
              showCategories={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <Suspense fallback={<div />}> 
          <HomeContent />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
