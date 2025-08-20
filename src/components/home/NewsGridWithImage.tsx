'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WordPressPost } from '@/types/wordpress';
import WordPressService from '@/lib/wordpressService';

interface NewsGridWithImageProps {
  title?: string;
  maxPosts?: number;
  posts?: WordPressPost[];
  tagSlug?: string;
}

export default function NewsGridWithImage({
  title,
  maxPosts = 4,
  posts: externalPosts,
  tagSlug
}: NewsGridWithImageProps) {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [tagId, setTagId] = useState<number | null | undefined>(undefined);

  const displayPosts = externalPosts || posts;

  useEffect(() => {
    const getTagId = async () => {
      try {
        if (!tagSlug) {
          setTagId(null);
          return;
        }

        const result = await WordPressService.getTags();
        const id = result.tagsMap[tagSlug];

        if (id) {
          setTagId(id);
        } else {
          console.warn(`Tag "${tagSlug}" no encontrado en WordPress`);
          setTagId(null);
        }
      } catch (error) {
        console.error('Error loading tags map:', error);
        setTagId(null);
      }
    };

    getTagId();
  }, [tagSlug]);

  const fetchPosts = useCallback(async () => {
    if (externalPosts) return;

    try {
      setLoading(true);
      setError(null);

      if (!tagId) {
        setPosts([]);
        return;
      }

      const result = await WordPressService.getPosts({
        page: 1,
        perPage: maxPosts,
        tags: [tagId],
        orderBy: 'date'
      });

      setPosts(result.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar noticias');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [maxPosts, externalPosts, tagId]);

  useEffect(() => {
    if (tagId !== undefined || !tagSlug) {
      fetchPosts();
    }
  }, [fetchPosts, tagId, tagSlug]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[#C7C7C7]">{error}</p>
      </div>
    );
  }

  if (loading && !externalPosts) {
    return (
      <div className="px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
        <div className="w-full max-w-7xl mx-auto">
          {title && (
            <div className="mb-6">
              <div className="flex justify-between items-end gap-2">
                <div className="flex flex-col gap-2">
                  <div className="h-8 bg-[#D4D5DD] rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-[#D4D5DD] rounded w-64 animate-pulse"></div>
                </div>
                <div className="h-10 bg-[#D4D5DD] rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-0.5 w-full bg-[#D4D5DD] my-4" />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            <div className="space-y-4">
              {Array.from({ length: maxPosts }).map((_, index) => (
                <article key={index} className="py-4 border-b border-[#D4D5DD] animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-6 bg-[#D4D5DD] rounded-full w-20"></div>
                    <div className="h-4 bg-[#D4D5DD] rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-[#D4D5DD] rounded w-full"></div>
                    <div className="h-5 bg-[#D4D5DD] rounded w-3/4"></div>
                  </div>
                </article>
              ))}
            </div>
            <div className="relative w-full h-full min-h-[400px] bg-[#D4D5DD] rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayPosts || displayPosts.length === 0) {
    return null;
  }

  const featuredImage = WordPressService.getFeaturedImage(displayPosts[selectedPostIndex]);
  const formatDate = WordPressService.formatDate;
  const cleanTitle = WordPressService.cleanHtml;

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
      <div className="w-full max-w-7xl mx-auto">
        {title && (
          <div className="mb-6">
            <div className="flex justify-between items-end gap-2">
              <div className="flex flex-col gap-2">
                <h2 className="font-semibold text-lg md:text-2xl text-[#1B1B1B]">{title}</h2>
                <p className="text-xs font-medium text-[#64748B] mt-1 hidden md:block">Infórmate de las últimas noticias en Costa Rica</p>
              </div>
              <Link href="/news" className="text-[#9A9898] border border-[#9A9898] rounded-md px-2 py-1 md:px-4 md:py-2 hover:text-[#1E305F] hover:border-[#1E305F] text-xs md:text-sm flex items-center transition-all duration-300">
                Ver todas <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="h-0.5 w-full bg-[#D4D5DD] my-4" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          <div className="space-y-4 h-full">
            {displayPosts.map((post, index) => {
              const category = WordPressService.getCategory(post);

              return (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  onMouseEnter={() => setSelectedPostIndex(index)}
                  className="group block"
                >
                  <article className={`py-4 border-b border-[#D4D5DD]`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#01A299] border-[1.4px] border-[#01A299] px-4 py-[4px] rounded-full bg-transparent text-sm font-medium">
                        {category}
                      </span>
                      <span className="text-sm font-medium text-[#000000]/30">
                        {formatDate(post.date)}
                      </span>
                    </div>

                    <h4 className={`text-lg md:text-2xl font-medium line-clamp-2 transition-colors duration-300 text-[#000000]/60 group-hover:text-[#000000]`}>
                      {cleanTitle(post.title.rendered)}
                    </h4>
                  </article>
                </Link>
              );
            })}
          </div>
          <div className="relative h-48 w-full lg:h-full bg-[#D4D5DD] rounded-2xl overflow-hidden">
            <Image
              src={featuredImage}
              alt={cleanTitle(displayPosts[selectedPostIndex].title.rendered)}
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </div>
  );
}