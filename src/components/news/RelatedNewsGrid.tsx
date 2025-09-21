import Link from 'next/link';
import Image from 'next/image';
import { WordPressPost } from '@/types/wordpress';

interface RelatedNewsGridProps {
  posts: WordPressPost[];
}

import WordPressService from '@/lib/wordpressService';

export default function RelatedNewsGrid({ posts }: RelatedNewsGridProps) {
  const formatDate = WordPressService.formatDate;
  const cleanTitle = WordPressService.cleanHtml;

  return (
    <section className="bg-[#000000] my-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg md:text-xl text-[#FFFFFF]/80">MÁS NOTICIAS</h2>
          <Link href="/news" className="text-[#D92A34] border border-[#D92A34] rounded-md px-2 py-1 md:px-4 md:py-2 hover:text-white hover:bg-[#D92A34] text-xs md:text-sm flex items-center transition-all duration-300">
            Ver todas <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="h-0.5 w-full bg-[#D92A34] mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {posts.map((post) => {
            const featuredImage = WordPressService.getFeaturedImage(post);
            const category = WordPressService.getCategory(post);
            return (
              <Link href={`/news/${post.slug}`} key={post.id}>
                <article className="group overflow-hidden hover:scale-[1.02] transition-all duration-300">
                  <div className="relative aspect-[16/11] bg-[#FFFFFF]/5 rounded-sm mb-4">
                    <Image
                      src={featuredImage}
                      alt={cleanTitle(post.title.rendered)}
                      fill
                      className="object-cover rounded-sm"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#D92A34] border-[1.4px] border-[#D92A34] px-4 py-[4px] rounded-full bg-transparent text-sm font-medium">
                        {category}
                      </span>
                      <span className="text-xs font-medium text-[#FFFFFF]/40 text-left">
                        {formatDate(post.date)}
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-[#FFFFFF]/80 group-hover:text-[#D92A34] line-clamp-2 transition-colors text-left">
                      {cleanTitle(post.title.rendered)}
                    </h3>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
} 