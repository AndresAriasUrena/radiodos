import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/news/FilterSidebar';
import RelatedNewsGrid from '@/components/news/RelatedNewsGrid';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import WordPressService from '@/lib/wordpressService';
import { WordPressPost } from '@/types/wordpress';
import { generatePageMetadata, generateNewsSchema } from '@/lib/seo';
import JsonLd from '@/components/SEO/JsonLd';

const NewsSectionsSidebar = dynamic(() => import('@/components/news/NewsSectionsSidebar'), { ssr: false });

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return generatePageMetadata({
      title: 'Noticia no encontrada',
      description: 'La noticia que buscas no existe o ha sido eliminada.',
      image: null,
      path: `/news/${params.slug}`,
      type: 'website',
      publishedTime: null,
      author: null,
      section: null,
      keywords: 'radio2, noticias costa rica, noticia no encontrada'
    });
  }
  const cleanTitle = post.title.rendered.replace(/<[^>]+>/g, '');
  const cleanDescription = post.excerpt.rendered.replace(/<[^>]+>/g, '').trim();
  const featuredImage = WordPressService.getFeaturedImage(post);
  const author = WordPressService.getAuthor(post);
  const category = post._embedded?.['wp:term']?.[0]?.[0]?.name;

  return generatePageMetadata({
    title: cleanTitle,
    description: cleanDescription || `Lee la última noticia de ${category || 'Radio2'}: ${cleanTitle}`,
    image: featuredImage,
    path: `/news/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
    author,
    section: category,
    keywords: `${cleanTitle}, ${category}, radio2, noticias, ${author}`
  });
}

function addHeadingIds(html: string) {
    let count = 0;
    return html.replace(/<(h[23])([^>]*)>/gi, (match, tag, attrs) => {
        if (/id=/.test(attrs)) return match;
        return `<${tag}${attrs} id="section-${count++}">`;
    });
}

function removeFeaturedImageFromContent(html: string, featuredImageUrl: string): string {
    if (!featuredImageUrl || featuredImageUrl === '/placeholder-news.jpg') {
        return html;
    }
    
    const imageBase = featuredImageUrl.split('/').pop()?.split('.')[0];
    if (!imageBase) return html;
    
    const imgRegex = new RegExp(`<img[^>]*src="[^"]*${imageBase}[^"]*"[^>]*>`, 'i');
    return html.replace(imgRegex, '');
}

async function getPostBySlug(slug: string): Promise<WordPressPost | null> {
    return await WordPressService.getPostBySlug(slug);
}

async function getRelatedPosts(categoryId: number, excludeId: number): Promise<WordPressPost[]> {
    return await WordPressService.getRelatedPosts(categoryId, excludeId, 3);
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
    const post = await getPostBySlug(params.slug);
    if (!post) return notFound();

    const featuredImage = WordPressService.getFeaturedImage(post) || '/placeholder-news.jpg';
    
    const contentWithoutFeaturedImage = removeFeaturedImageFromContent(post.content.rendered, featuredImage);
    const htmlWithIds = addHeadingIds(contentWithoutFeaturedImage);

    const mainCategory = post._embedded?.['wp:term']?.[0]?.[0];
    const categoryId = mainCategory?.id;

    let relatedPosts: WordPressPost[] = [];
    if (categoryId) {
        relatedPosts = await getRelatedPosts(categoryId, post.id);
    }

    const author = WordPressService.getAuthor(post);
    const formatDate = WordPressService.formatDate;
    const cleanTitle = post.title.rendered.replace(/<[^>]+>/g, '');

    const newsSchema = generateNewsSchema(post);
    
    return (
        <>
            <JsonLd data={newsSchema} />
            <div className="min-h-screen font-jost">
                <Navbar />
                <div>
                    <div className="max-w-7xl mx-auto relative my-4 px-4 sm:px-8 py-8">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <aside className="order-1 lg:order-2 w-full lg:w-72 flex flex-col gap-8">
                                <div className="hidden lg:block">
                                    <FilterSidebar />
                                </div>
                            </aside>
                            <div className="flex-1 order-2 lg:order-1 items-center justify-center text-center">
                                {mainCategory && (
                                    <span className="inline-block mb-4 px-4 py-2 rounded-full border-2 border-[#D92A34] text-[#D92A34] font-medium text-xs font-normal">
                                        {mainCategory.name}
                                    </span>
                                )}
                                <h1 className="font-lexend text-sm md:text-lg lg:text-3xl font-semibold text-[#FFFFFF]/80 mb-2">
                                    {cleanTitle}
                                </h1>
                                <div className="mb-6 text-[#FFFFFF]/40 text-sm">
                                    {author} <span className="text-[#FFFFFF]/20">- {formatDate(post.date)}</span>
                                </div>
                                <div className="mb-8">
                                    <img
                                        src={featuredImage}
                                        alt={cleanTitle}
                                        className="w-full max-h-[400px] object-cover rounded-2xl mx-auto"
                                    />
                                </div>
                                <div className="flex flex-row gap-8">
                                    <div className="hidden lg:block text-left w-full max-w-xs">
                                        <NewsSectionsSidebar html={htmlWithIds} />
                                    </div>
                                    <article
                                        className="prose prose-invert mx-auto text-left text-[#FFFFFF]/60"
                                        dangerouslySetInnerHTML={{ __html: htmlWithIds }}
                                    />
                                </div>
                                {relatedPosts.length > 0 && <RelatedNewsGrid posts={relatedPosts} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
} 