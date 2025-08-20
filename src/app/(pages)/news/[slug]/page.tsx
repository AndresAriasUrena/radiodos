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
      keywords: 'radio columbia, noticias costa rica, noticia no encontrada'
    });
  }

  const cleanTitle = WordPressService.cleanHtml(post.title.rendered);
  const cleanDescription = WordPressService.cleanHtml(post.excerpt.rendered);
  const featuredImage = WordPressService.getFeaturedImage(post);
  const author = WordPressService.getAuthor(post);
  const category = post._embedded?.['wp:term']?.[0]?.[0]?.name;

  return generatePageMetadata({
    title: cleanTitle,
    description: cleanDescription || `Lee la última noticia de ${category || 'Radio Columbia'}: ${cleanTitle}`,
    image: featuredImage,
    path: `/news/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
    author,
    section: category,
    keywords: `${cleanTitle}, ${category}, radio columbia, noticias costa rica, ${author}`
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
    const cleanTitle = WordPressService.cleanHtml(post.title.rendered);

    const newsSchema = generateNewsSchema(post);

    return (
        <>
            <JsonLd data={newsSchema} />
            <Navbar />
            <div className="min-h-screen overflow-hidden">
                <div className="flex flex-col lg:flex-row -my-4 md:pr-4">
                    <div className="flex-1">
                        <div className="mx-auto relative">
                            <div className="flex flex-col lg:flex-row gap-4 lg:gap-16">
                                <div className="flex-1 order-2 lg:order-1 items-center justify-center text-center">
                                    <div className='px-4 sm:px-6 lg:px-10 py-8 sm:py-12 bg-[#F8FBFF] mx-2 my-4 rounded-2xl'>
                                        <div className='flex flex-col gap-4 text-center justify-center items-center max-w-xl mx-auto'>
                                            {mainCategory && (
                                                <span className="inline-block px-4 py-2 rounded-full bg-[#01A299] text-white text-xs font-normal">
                                                    {mainCategory.name}
                                                </span>
                                            )}
                                            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-[#2F3037]">
                                                {cleanTitle}
                                            </h1>
                                            <div className="mb-6 text-[#2F3037]/80 text-sm font-semibold">
                                                {author} <span className="text-[#2F3037]/60">- {formatDate(post.date)}</span>
                                            </div>
                                        </div>
                                        <div className="mb-8">
                                            <img
                                                src={featuredImage}
                                                alt={cleanTitle}
                                                className="w-full max-h-[400px] object-cover rounded-2xl mx-auto"
                                            />
                                        </div>
                                        <div className="flex flex-row gap-8">
                                            <div className="hidden lg:block text-left w-full lg:w-[20%]">
                                                <NewsSectionsSidebar html={htmlWithIds} />
                                            </div>
                                            <article
                                                className="w-full lg:w-[80%] prose prose-invert text-[#2F3037]/80 prose-a:text-[#2F3037]/70 prose-strong:text-[#2F3037] mx-auto text-left text-sm md:text-base [&_ul]:list-none [&_ul]:pl-0 [&_li]:before:content-['•'] [&_li]:before:text-[#01A299] [&_li]:before:mr-2 [&_li]:before:text-lg [&_li]:before:font-bold"
                                                dangerouslySetInnerHTML={{ __html: htmlWithIds }}
                                            />
                                        </div>
                                    </div>

                                    <div className="px-4 sm:px-6 py-8 sm:py-12 bg-[#F8FBFF] mx-2 mt-4 rounded-2xl text-left">
                                        {relatedPosts.length > 0 && <RelatedNewsGrid posts={relatedPosts} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <FilterSidebar
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
} 