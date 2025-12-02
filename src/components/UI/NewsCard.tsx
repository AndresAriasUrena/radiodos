'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WordPressPost } from '@/types/wordpress';
import { memo } from 'react';

interface NewsCardProps {
  post: WordPressPost;
  priority?: boolean;
  index?: number;
}

import WordPressService from '@/lib/wordpressService';

function NewsCard({ post, priority = false, index = 0 }: NewsCardProps) {
  const featuredImage = WordPressService.getFeaturedImage(post);
  const category = WordPressService.getCategory(post);
  const formatDate = WordPressService.formatDate;
  const cleanTitle = WordPressService.cleanHtml;

  return (
    <Link href={`/news/${post.slug}`}>
      <article
        className="group overflow-hidden hover:scale-[1.02] transition-all duration-500 opacity-0 animate-fadeInUp"
        style={{
          animationDelay: `${Math.min(index * 75, 400)}ms`,
          animationFillMode: 'forwards'
        }}
      >
        <div className="relative aspect-[16/11] bg-[#FFFFFF]/5 rounded-sm">
          <Image
            src={featuredImage}
            alt={cleanTitle(post.title.rendered)}
            fill
            className="object-cover rounded-2xl"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            quality={75}
          />
        </div>

        <div className="py-6">
          <div className="flex gap-2 items-center mb-1 font-medium text-[#FFFFFF]/40">
            <span className="text-[#D92A34] rounded-full bg-transparent text-sm font-semibold">
            {category}
            </span>
            •
            <span className="text-sm font-medium text-[#FFFFFF]/40">
            {formatDate(post.date)}
            </span>
          </div>

          <h3 className="text-md md:text-xl font-medium text-[#FFFFFF]/70 line-clamp-2 titlecase">
          {cleanTitle(post.title.rendered)}
          </h3>
        </div>
      </article>
    </Link>
  );
}

export default memo(NewsCard);