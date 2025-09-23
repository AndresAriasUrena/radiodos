'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { IoClose } from 'react-icons/io5';
import { SearchContext } from '@/lib/SearchContext';
import WordPressService from '@/lib/wordpressService';
import { WordPressCategory, FilterItem, FilterData } from '@/types/wordpress';

interface FilterSidebarProps {
  filters?: FilterData;
  onFilterChange?: (filters: FilterData) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const defaultFilters: FilterData = { categories: [] };

const FilterSidebar = ({
  filters = defaultFilters,
  onFilterChange,
  isMobileOpen = false,
  setIsMobileOpen = () => {}
}: FilterSidebarProps) => {
  const { searchTerm, setSearchTerm } = useContext(SearchContext);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedFilters, setSelectedFilters] = useState<FilterData>({
    categories: [...filters.categories]
  });

  const [availableFilters, setAvailableFilters] = useState({
    categories: [] as FilterItem[]
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedFilters(prev => {
      const nextCategories = [...(filters?.categories ?? [])];
      const sameLength = prev.categories.length === nextCategories.length;
      const sameValues = sameLength && prev.categories.every((cat, index) => cat === nextCategories[index]);

      if (sameValues) {
        return prev;
      }

      return {
        categories: nextCategories
      };
    });
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const { categories } = await WordPressService.getCategories();

      setAvailableFilters({
        categories: categories
          .map((cat: WordPressCategory) => ({
            label: cat.name,
            count: cat.count,
            slug: cat.slug
          }))
          .sort((a: FilterItem, b: FilterItem) => b.count - a.count)
      });

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching WordPress categories:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const syncWithRouter = (nextFilters: FilterData, term: string) => {
    const params = new URLSearchParams();

    const trimmedTerm = term.trim();
    if (trimmedTerm) {
      params.set('search', trimmedTerm);
    }

    if (nextFilters.categories && nextFilters.categories.length > 0) {
      params.set('categories', nextFilters.categories.join(','));
    }

    const queryString = params.toString();
    const targetPath = '/news';
    const targetUrl = queryString ? `${targetPath}?${queryString}` : targetPath;

    if ((pathname ?? '').startsWith('/news')) {
      router.replace(targetUrl, { scroll: false });
    } else {
      router.push(targetUrl);
    }

    onFilterChange?.(nextFilters);
    setIsMobileOpen(false);
  };

  const handleCheckboxChange = (category: keyof FilterData, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      const updatedFilters: FilterData = {
        ...prev,
        [category]: newValues
      };

      syncWithRouter(updatedFilters, searchTerm);
      return updatedFilters;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    syncWithRouter(selectedFilters, searchTerm);
  };

  return (
    <div className="w-full lg:w-72 text-[#FFFFFF]/80">
      <div className="lg:hidden flex items-center justify-between mb-6">
        <h2 className="font-lexend font-semibold text-xl text-[#FFFFFF]/80">FILTROS</h2>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-2 hover:bg-[#232323] rounded-lg transition-colors"
        >
          <IoClose className="w-6 h-6" />
        </button>
      </div>

      <div className="mb-8">
        <h2 className="font-lexend font-semibold text-xl text-[#FFFFFF]/80">BUSCAR NOTICIAS</h2>
        <div className="h-0.5 w-full bg-[#D92A34] my-4" />
        <form onSubmit={handleSearch} className="relative">
          <button type="submit" className="absolute left-3 top-2">
            <Search className="w-5 h-5 text-[#FFFFFF]/60" />
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="w-full bg-black border border-[#FFFFFF]/20 pl-10 rounded-lg px-4 py-2 text-sm text-[#FFFFFF]/80 placeholder-[#FFFFFF]/40 focus:outline-none focus:ring-"
          />
        </form>
      </div>

      <div className="mb-8">
        <h2 className="font-lexend font-semibold text-xl text-[#FFFFFF]/80">CATEGORÍAS</h2>
        <div className="h-0.5 w-full bg-[#D92A34] my-4" />
        {loading ? (
          <div className="text-[#FFFFFF]/60 text-sm">Cargando categorías...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableFilters.categories.map((category) => (
              <a 
                key={category.slug}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleCheckboxChange('categories', category.slug);
                }}
                className={`
                  px-3 py-2 rounded-lg text-sm hover:scale-105 transition-all duration-300
                  flex items-center justify-between
                  ${selectedFilters.categories.includes(category.slug) 
                    ? 'bg-[#FFFFFF]/80 text-[#0a0a0a]' 
                    : 'bg-[#D92A34] text-white'
                  }
                `}
              >
                <span className="truncate">{category.label}</span>
                <span className="text-xs ml-2 flex-shrink-0">({category.count})</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar; 