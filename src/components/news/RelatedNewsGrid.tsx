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
    <section className="">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg md:text-xl text-[#1B1B1B]">MÁS NOTICIAS</h2>
        <Link href="/news" className="text-[#9A9898] border border-[#9A9898] rounded-md px-2 py-1 md:px-4 md:py-2 hover:text-[#1E305F] hover:border-[#1E305F] text-xs md:text-sm flex items-center transition-all duration-300">
                Ver todas <span aria-hidden>→</span>
              </Link>
      </div>
      <div className="h-0.5 w-full bg-[#D4D5DD] mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((post) => {
          const featuredImage = WordPressService.getFeaturedImage(post);
          const category = WordPressService.getCategory(post);
          return (
            <Link href={`/news/${post.slug}`} key={post.id}>
              <article className="group overflow-hidden hover:scale-[1.02] transition-all duration-300">
                <div className="relative aspect-[16/11] bg-[#F1F5F9] rounded-2xl mb-4">
                  <Image
                    src={featuredImage}
                    alt={cleanTitle(post.title.rendered)}
                    fill
                    className="object-cover rounded-2xl"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                  <span className="text-[#D51E30] border-[1.4px] border-[#D51E30] px-4 py-[4px] rounded-full bg-transparent text-sm font-medium">
                 {category}
            </span>
                    <span className="text-xs font-medium text-[#94A3B8]">
                      {formatDate(post.date)}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-[#1B1B1B] group-hover:text-[#1E305F] line-clamp-2 transition-colors">
                    {cleanTitle(post.title.rendered)}
                  </h3>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
} 