'use client';
import { useEffect, useState } from 'react';

interface NewsSectionsSidebarProps {
  html: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function NewsSectionsSidebar({ html }: NewsSectionsSidebarProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const found: Heading[] = [];
    let headingCount = 0;
    div.querySelectorAll('h2, h3').forEach((el) => {
      let id = el.id;
      if (!id) {
        id = `section-${headingCount++}`;
        el.id = id;
      }
      found.push({
        id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      });
    });
    setHeadings(found);
    found.forEach(h => {
      const real = document.getElementById(h.id);
      if (!real) {
        const realHeading = document.querySelector(`h2,h3`);
        if (realHeading) realHeading.id = h.id;
      }
    });
  }, [html]);

  if (headings.length === 0) return null;

  return (
    <aside className="mb-8">
      <h3 className="font-semibold text-lg md:text-xl text-[#FFFFFF]/80">SECCIONES</h3>
      <ul className="space-y-3">
        {headings.map(h => (
          <li key={h.id} className="">
            <a
              href={`#${h.id}`}
              className="block text-[#FFFFFF]/60 hover:text-[#000000] p-2 hover:bg-[#D92A34] rounded-md text-md transition-colors duration-300"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
} 