// src/components/news/NewsGrid.tsx
'use client';

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import NewsCard from '../UI/NewsCard';
import { IoFilter } from 'react-icons/io5';
import { SearchContext } from '@/lib/SearchContext';
import WordPressService from '@/lib/wordpressService';
import { WordPressPost, FilterData, WordPressCategory } from '@/types/wordpress';

interface NewsGridProps {
  filters: FilterData | null;
  onOpenFilters: () => void;
  title?: string;
  parentSlugs?: string[];
}

export default function NewsGrid({ filters, onOpenFilters, title = 'Noticias', parentSlugs = [] }: NewsGridProps) {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'title-asc' | 'title-desc'>('date');
  const [totalPosts, setTotalPosts] = useState(0);
  const [categoriesMap, setCategoriesMap] = useState<{[slug: string]: number}>({});
  const [categorySlugToParentId, setCategorySlugToParentId] = useState<{[slug: string]: number}>({});
  const [allCategories, setAllCategories] = useState<WordPressCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const { searchTerm } = useContext(SearchContext);
  const initializedRef = useRef(false);
  const previousFiltersRef = useRef<string>('');
  const previousSearchRef = useRef<string>('');

  const POSTS_PER_PAGE = 9;
  const INITIAL_LOAD = 9;

  useEffect(() => {
    const fetchCategoriesMap = async () => {
      try {
        const { categories, categoriesMap } = await WordPressService.getCategories();
        setCategoriesMap(categoriesMap as {[slug: string]: number});
        const slugToParent: {[slug: string]: number} = {};
        categories.forEach((cat: any) => {
          slugToParent[cat.slug] = cat.parent;
        });
        setCategorySlugToParentId(slugToParent);
        setAllCategories(categories as WordPressCategory[]);
        setCategoriesLoaded(true);
      } catch (error) {
        setCategoriesLoaded(true);
      }
    };

    fetchCategoriesMap();
  }, []);

  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      const perPage = pageNum === 1 ? INITIAL_LOAD : POSTS_PER_PAGE;

      let categoryIds = filters?.categories && filters.categories.length > 0
        ? filters.categories
            .map(slug => categoriesMap[slug])
            .filter(id => id !== undefined)
        : [];

      if (parentSlugs.length > 0) {
        const normalizedTargets = parentSlugs.map(s => s.toLowerCase());
        const parentIds = allCategories
          .filter(cat => normalizedTargets.includes(cat.slug.toLowerCase()) || normalizedTargets.includes(cat.name.toLowerCase()))
          .map(cat => cat.id);

        if (parentIds.length > 0) {
          const idToParent: {[id: number]: number} = {};
          allCategories.forEach(cat => { idToParent[cat.id] = cat.parent; });
          const descendants = new Set<number>();
          const queue: number[] = [...parentIds];
          while (queue.length > 0) {
            const current = queue.shift() as number;
            allCategories.forEach(cat => {
              if (idToParent[cat.id] === current && !descendants.has(cat.id)) {
                descendants.add(cat.id);
                queue.push(cat.id);
              }
            });
          }
          const childrenIds = Array.from(descendants);

          if (categoryIds.length === 0) {
            categoryIds = childrenIds.length > 0 ? childrenIds : parentIds;
          } else {
            const allowed = new Set<number>([...childrenIds, ...parentIds]);
            categoryIds = categoryIds.filter(cid => allowed.has(cid));
          }
        }
      }

      const result = await WordPressService.getPosts({
        page: pageNum,
        perPage,
        categories: categoryIds,
        search: searchTerm || '',
        orderBy: sortBy
      });

      if (append) {
        setPosts(prev => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }

      setTotalPosts(result.totalItems);
      setHasMore(pageNum < result.totalPages);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar noticias');
    } finally {
      setLoading(false);
    }
  }, [sortBy, filters, searchTerm, categoriesMap, parentSlugs, categorySlugToParentId, allCategories]);

  useEffect(() => {
    if (!categoriesLoaded) return;

    const serializedFilters = JSON.stringify(filters?.categories?.slice().sort() ?? []);
    const filtersChanged = previousFiltersRef.current !== serializedFilters;
    const normalizedSearch = (searchTerm ?? '').trim();
    const searchChanged = previousSearchRef.current !== normalizedSearch;

    if (!initializedRef.current || filtersChanged || searchChanged) {
      previousFiltersRef.current = serializedFilters;
      previousSearchRef.current = normalizedSearch;
      initializedRef.current = true;
      setPage(1);
      fetchPosts(1, false);
    }
  }, [categoriesLoaded, fetchPosts, filters, searchTerm]);

  const handleRetry = () => {
    setError(null);
    fetchPosts(page, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  if (error) {
    return (
      <div className="flex-1 px-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-7xl mx-auto">
          <div className="rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-[#D51F2F] mb-2">
              Error al cargar noticias
            </h3>
            <p className="text-[#C7C7C7] mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="text-[#D92A34] border border-[#D92A34] px-4 py-2 rounded-md hover:text-white hover:bg-[#D92A34] transition-colors duration-300"
              >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#000000]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-2">
                <h2 className="font-semibold text-lg md:text-2xl text-[#FFFFFF]/80">{title}</h2>
                <p className="text-sm text-[#FFFFFF]/40 hidden md:block">
                  {loading && posts.length === 0 
                    ? 'Cargando...' 
                    : `${posts.length} de ${totalPosts} noticias encontradas`}
                  {searchTerm && ` para "${searchTerm}"`}
                </p>
              </div>
              <button
                onClick={onOpenFilters}
                className="lg:hidden flex items-center gap-2 bg-[#D92A34] text-white px-3 py-2 rounded-md hover:bg-[#b71724] transition-colors"
              >
                <IoFilter className="w-4 h-4" />
                <span className="text-sm font-semibold">Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {loading && posts.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: INITIAL_LOAD }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-[#FFFFFF]/5 aspect-[16/11] rounded-sm mb-4"></div>
                <div className="h-4 bg-[#FFFFFF]/5 rounded mb-2"></div>
                <div className="h-4 bg-[#FFFFFF]/5 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {posts.map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>

            {hasMore && !loading && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="text-[#D92A34] border border-[#D92A34] px-4 py-2 rounded-md hover:text-white hover:bg-[#D92A34] transition-colors duration-300"
                >
                  Cargar más noticias
                </button>
              </div>
            )}
          </>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#FFFFFF]/60 text-lg">
              No se encontraron noticias
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}