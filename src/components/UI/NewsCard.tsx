'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WordPressPost } from '@/types/wordpress';

interface NewsCardProps {
  post: WordPressPost;
}

import WordPressService from '@/lib/wordpressService';

export default function NewsCard({ post }: NewsCardProps) {
  const featuredImage = WordPressService.getFeaturedImage(post);
  const category = WordPressService.getCategory(post);
  const formatDate = WordPressService.formatDate;
  const cleanTitle = WordPressService.cleanHtml;

  return (
    <Link href={`/news/${post.slug}`}>
      <article className="group overflow-hidden hover:scale-[1.02] transition-all duration-700">
        <div className="relative aspect-[16/11] bg-[#D4D5DD] rounded-2xl">
          <Image
            src={featuredImage}
            alt={cleanTitle(post.title.rendered)}
            fill
            className="object-cover rounded-2xl"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        <div className="py-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#01A299] border-[1.4px] border-[#01A299] px-4 py-[4px] rounded-full bg-transparent text-sm font-medium">
                 {category}
            </span>

            <span className="text-sm font-medium text-[#272727]/50">
              {formatDate(post.date)}
            </span>
          </div>

          <h3 className="text-md md:text-xl font-medium text-[#2F3037] line-clamp-2">
            {cleanTitle(post.title.rendered)}
          </h3>
        </div>
      </article>
    </Link>
  );
}