// src/app/(pages)/news/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/news/FilterSidebar';
import NewsGrid from '@/components/news/NewsGrid';
import { FilterData } from '@/types/wordpress';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

function NewsContent({ title }: { title: string }) {
  const [filters, setFilters] = useState<FilterData>({ categories: [] });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = 'Noticias | Radio Columbia - Últimas Noticias de Costa Rica';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Descubre las últimas noticias y actualidad de Costa Rica en Radio Columbia. Mantente informado con nuestras noticias de música, entretenimiento, política y más.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Descubre las últimas noticias y actualidad de Costa Rica en Radio Columbia. Mantente informado con nuestras noticias de música, entretenimiento, política y más.';
      document.head.appendChild(meta);
    }

    if (filters.categories.length > 0) {
    }
  }, [filters]);

  const handleFilterChange = (newFilters: FilterData) => {
    setFilters(newFilters);
  };

  return (
    <>
      <div className="min-h-screen overflow-hidden">        
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="bg-[#1E305F] hover:bg-[#D51F2F] text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row -my-4 md:pr-4">
          <div className="flex-1">
            <NewsGrid 
              filters={filters} 
              onOpenFilters={() => setIsMobileFiltersOpen(true)}
              title={title}
              parentSlugs={["noticias", "noticas", "Noticias"]}
            />
          </div>
          
          {/* Sidebar desktop */}
          <div className="hidden lg:block">
            <FilterSidebar 
              onFilterChange={handleFilterChange}
              isMobileOpen={false}
              setIsMobileOpen={() => {}}
              parentSlugs={["noticias", "noticas", "Noticias"]}
            />
          </div>
        </div>

        <div 
          className={`fixed inset-0 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
            isMobileFiltersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileFiltersOpen(false)}
        />
        
        <div className={`fixed right-0 top-0 h-full w-80 bg-[#1E305F] z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileFiltersOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="-my-5 h-full overflow-y-auto">
            <FilterSidebar 
              onFilterChange={handleFilterChange}
              isMobileOpen={isMobileFiltersOpen}
              setIsMobileOpen={setIsMobileFiltersOpen}
              parentSlugs={["noticias", "noticas", "Noticias"]}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewsPage() {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <Suspense fallback={<div />}> 
          <NewsContent
            title="Noticias"
          />
        </Suspense>
      </div>
      <Footer />
    </>
  );
} 