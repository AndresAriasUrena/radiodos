const siteConfig = {
  siteName: 'Radio2',
  siteUrl: 'https://radiodev.aurigital.com/',
  description: 'Radio2 - La nueva era de la radio digital en Costa Rica. Disfruta de música, noticias, deportes y entretenimiento con una experiencia moderna y dinámica. Transmitiendo 24/7 con la mejor calidad y programación innovadora.',
  keywords: 'radio2, radio digital costa rica, radio online, streaming de música, noticias en vivo, radio moderna, radio interactiva, deportes en vivo, entretenimiento digital, radio streaming, radio 24/7, radio costarricense',
  author: 'Radio2',
  twitterHandle: '@radiodos',
  logo: '/assets/LogoRadio2.svg',
  favicon: '/favicon.ico',
  themeColor: '#1E305F',
  backgroundColor: '#F8FBFF',
  social: {
    facebook: 'https://www.facebook.com/Radio2cr/',
    instagram: 'https://www.instagram.com/radio2cr/',
    twitter: 'https://x.com/radiodos',
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
  const author = post._embedded?.author?.[0]?.name || 'Radio2';
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