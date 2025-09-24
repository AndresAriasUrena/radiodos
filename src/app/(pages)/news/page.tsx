// src/app/(pages)/news/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/news/FilterSidebar';
import NewsGrid from '@/components/news/NewsGrid';
import { FilterData } from '@/types/wordpress';
import { Search } from 'lucide-react';
import { useSearch } from '@/lib/SearchContext';

export const dynamic = 'force-dynamic';

function NewsContent({ title }: { title: string }) {
  const searchParams = useSearchParams();
  const { setSearchTerm } = useSearch();

  const initialFilters = useMemo(() => {
    const categoriesParam = searchParams?.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : [];
    return { categories } as FilterData;
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterData>(initialFilters);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = 'Noticias | Radio2 - Últimas Noticias de Costa Rica';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Descubre las últimas noticias y actualidad de Costa Rica en Radio2. Mantente informado con nuestras noticias de música, entretenimiento, política y más.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
              meta.content = 'Descubre las últimas noticias y actualidad de Costa Rica en Radio2. Mantente informado con nuestras noticias de música, entretenimiento, política y más.';
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    const nextSearch = searchParams?.get('search') ?? '';
    setSearchTerm(nextSearch);
  }, [searchParams, setSearchTerm]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleFilterChange = (newFilters: FilterData) => {
    setFilters({ categories: [...(newFilters.categories ?? [])] });
  };

  return (
    <>
      <div className="min-h-screen overflow-hidden max-w-7xl mx-auto my-4 px-4 sm:px-8 py-8">        
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
              className="bg-[#D92A34] hover:bg-[#b71724] text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row -my-4 gap-6">
          <div className="flex-1">
            <NewsGrid 
              filters={filters} 
              onOpenFilters={() => setIsMobileFiltersOpen(true)}
              title={title}
            />
          </div>
          
          {/* Sidebar desktop */}
          <div className="hidden lg:block">
            <FilterSidebar 
              filters={filters}
              onFilterChange={handleFilterChange}
              isMobileOpen={false}
              setIsMobileOpen={() => {}}
            />
          </div>
        </div>

        <div 
          className={`fixed inset-0 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
            isMobileFiltersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileFiltersOpen(false)}
        />
        
        <div className={`fixed right-0 top-0 h-full w-80 bg-[#000000] z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileFiltersOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="my-5 px-4 h-full overflow-y-auto">
            <FilterSidebar 
              filters={filters}
              onFilterChange={handleFilterChange}
              isMobileOpen={isMobileFiltersOpen}
              setIsMobileOpen={setIsMobileFiltersOpen}
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