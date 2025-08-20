'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WordPressPost } from '@/types/wordpress';

interface NewsCardGridProps {
  post: WordPressPost;
}

import WordPressService from '@/lib/wordpressService';

export default function NewsCardGrid({ post }: NewsCardGridProps) {
  const featuredImage = WordPressService.getFeaturedImage(post);
  const category = WordPressService.getCategory(post);
  const formatDate = WordPressService.formatDate;
  const cleanTitle = WordPressService.cleanHtml;

  return (
    <Link href={`/news/${post.slug}`}>
      <article className="py-3 group overflow-hidden border-b border-[#D4D5DD]">
        <div className="flex flex-col md:flex-row py-5 gap-6 md:gap-10">
          {/* Imagen */}
          <div className="relative h-44 md:h-auto md:aspect-[12/6] bg-[#D4D5DD] rounded-xl overflow-hidden w-full md:w-[45%]">
            <Image
              src={featuredImage}
              alt={cleanTitle(post.title.rendered)}
              fill
              className="object-cover rounded-xl transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>

          <div className="flex flex-col justify-between w-full md:w-[55%]">
            <div>
            <span className="text-[#D71E30] border-[1.4px] border-[#D71E30] px-4 py-[4px] rounded-full bg-transparent text-sm font-medium">
                      {category}
              </span>

              <h3 className="leading-none text-md md:text-2xl lg:text-3xl font-medium text-[#2F3037]/80 line-clamp-2 md:line-clamp-3 my-6 group-hover:text-[#2F3037] transition-colors">
                {cleanTitle(post.title.rendered)}
              </h3>

              <div 
                className="text-[#000000]/60 text-sm md:text-md line-clamp-2 mb-4 md:mb-0 leading-tight"
                dangerouslySetInnerHTML={{ 
                  __html: post.excerpt.rendered.replace(/<\/?[^>]+(>|$)/g, "") 
                }}
              />
            </div>

            <div className="md:mt-auto">
              <div className="flex flex-col gap-1 text-[#000000]/40">
                <span className="text-md font-medium">
                  {formatDate(post.date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}