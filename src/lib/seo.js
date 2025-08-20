const siteConfig = {
  siteName: 'Radio Columbia',
  siteUrl: 'https://radiodev.aurigital.com/',
  description: 'Radio Columbia - Tu estación de radio costarricense con las últimas noticias, deportes, música y entretenimiento. Mantente informado con nuestras noticias actualizadas y disfruta de la mejor programación las 24 horas.',
  keywords: 'radio columbia, radio costa rica, noticias costa rica, deportes costa rica, música, entretenimiento, streaming, radio en vivo, noticias costarricenses',
  author: 'Radio Columbia',
  twitterHandle: '@webcolumbia',
  logo: '/assets/LogoColumbia.svg',
  favicon: '/favicon.ico',
  themeColor: '#1E305F',
  backgroundColor: '#F8FBFF',
  social: {
    facebook: 'https://www.facebook.com/NoticiasColumbia/',
    instagram: 'https://www.instagram.com/noticiascolumbia/',
    youtube: 'https://www.youtube.com/channel/UCo2Fr8GUPmevyi7uih-0oTg',
    twitter: 'https://x.com/webcolumbia'
  }
};

export const generatePageMetadata = ({
  title,
  description,
  image,
  path = '',
  type = 'website',
  publishedTime,
  author,
  section,
  keywords
}) => {
  const pageTitle = title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName;
  const pageDescription = description || siteConfig.description;
  const pageImage = image || `${siteConfig.siteUrl}opengraph-image.jpg`;
  const pageUrl = `${siteConfig.siteUrl}${path.startsWith('/') ? path.slice(1) : path}`;
  const pageKeywords = keywords || siteConfig.keywords;

  const metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    authors: [{ name: author || siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.siteName,
    metadataBase: new URL(siteConfig.siteUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: siteConfig.siteName,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.siteName} - ${title || 'Inicio'}`,
        },
      ],
      locale: 'es_CR',
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  if (type === 'article') {
    metadata.openGraph.type = 'article';
    if (publishedTime) {
      metadata.openGraph.publishedTime = publishedTime;
    }
    if (author) {
      metadata.openGraph.authors = [author];
    }
    if (section) {
      metadata.openGraph.section = section;
    }
  }

  return metadata;
};

export const generateNewsSchema = (post) => {
  const author = post._embedded?.author?.[0]?.name || 'Radio Columbia';
  const category = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Noticias';
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || `${siteConfig.siteUrl}opengraph-image.jpg`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title.rendered,
    description: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
    image: [featuredImage],
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.siteUrl}${siteConfig.logo}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.siteUrl}news/${post.slug}`,
    },
    articleSection: category,
    inLanguage: 'es-CR',
  };
};

export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}${siteConfig.logo}`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.youtube,
      siteConfig.social.twitter,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Spanish',
    },
  };
};

export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    inLanguage: 'es-CR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.siteUrl}news?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

export default siteConfig;

export const generateBreadcrumbSchema = (items) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}; 