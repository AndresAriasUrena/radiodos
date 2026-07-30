'use client';
import dynamic from 'next/dynamic';

const NewsSectionsSidebar = dynamic(() => import('./NewsSectionsSidebar'), { ssr: false });

export default function NewsSectionsSidebarDynamic({ html }: { html: string }) {
  return <NewsSectionsSidebar html={html} />;
}
