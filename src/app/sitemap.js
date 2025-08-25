import WordPressService from '@/lib/wordpressService';

export default async function sitemap() {
  const baseUrl = 'https://radiodev.aurigital.com';
  
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  let allPosts = [];
  try {
    const firstBatch = await WordPressService.getPosts({ 
      page: 1, 
      perPage: 100,
      orderBy: 'date',
      order: 'desc'
    });
    
    allPosts = [...firstBatch.posts];
    
    if (firstBatch.totalPages > 1) {
      const remainingPages = Array.from(
        { length: firstBatch.totalPages - 1 }, 
        (_, i) => i + 2
      );
      
      for (const page of remainingPages) {
        try {
          const batch = await WordPressService.getPosts({ 
            page, 
            perPage: 100,
            orderBy: 'date',
            order: 'desc'
          });
          allPosts = [...allPosts, ...batch.posts];
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error);
  }

  const newsPages = allPosts.map((post) => ({
    url: `${baseUrl}/news/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...newsPages];
} 