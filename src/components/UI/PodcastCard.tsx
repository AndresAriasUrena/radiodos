'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PodcastShow } from '@/types/podcast';

interface PodcastCardProps {
  podcast: PodcastShow;
}

export default function PodcastCard({ podcast }: PodcastCardProps) {
  const cleanHtml = (htmlString: string): string => {
    if (typeof window !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = htmlString;
      return div.textContent || div.innerText || '';
    }
    return htmlString.replace(/<[^>]*>/g, '');
  };

  return (
    <Link href={`/podcasts/${podcast.id}`}>
      <article className="group overflow-hidden hover:scale-[1.02] transition-all duration-700">
        <div className="relative aspect-[16/16] bg-[#white] border border-[#D4D5DD] rounded-2xl">
          <Image
            src={podcast.imageUrl || '/placeholder-podcast.jpg'}
            alt={cleanHtml(podcast.title)}
            fill
            className="object-cover rounded-2xl w-full"
          />
        </div>

        <div className="py-2">
          <div className="flex flex-col mb-1">
          <h3 className=" text-md font-semibold text-[#2F3037] line-clamp-2">
            {cleanHtml(podcast.title)}
          </h3>
            {podcast.author && (
              <span className="text-xs font-medium text-[#2F3037]/40">
                {podcast.author}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
} 