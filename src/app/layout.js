import { Inter } from 'next/font/google'
import './globals.css'
import { SearchProvider } from '@/lib/SearchContext'
import { PlayerProvider } from '@/lib/PlayerContext'
import RadioPlayer from '@/components/RadioPlayer'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Radio Columbia - Tu Estación de Radio Costarricense',
  description: 'Radio Columbia - Tu estación de radio costarricense con las últimas noticias, deportes, música y entretenimiento. Escucha radio en vivo las 24 horas y mantente informado con las noticias de Costa Rica.',
  keywords: 'radio columbia, radio costa rica, noticias costa rica, deportes costa rica, radio en vivo, streaming, entretenimiento, noticias costarricenses',
  authors: [{ name: 'Radio Columbia' }],
  creator: 'Radio Columbia',
  publisher: 'Radio Columbia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://radiodev.aurigital.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Radio Columbia - Tu Estación de Radio Costarricense',
    description: 'Radio Columbia - Tu estación de radio costarricense con las últimas noticias, deportes, música y entretenimiento. Escucha radio en vivo las 24 horas.',
    url: 'https://radiodev.aurigital.com',
    siteName: 'Radio Columbia',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Radio Columbia - Tu Estación de Radio Costarricense',
      },
    ],
    locale: 'es_CR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radio Columbia - Tu Estación de Radio Costarricense',
    description: 'Radio Columbia - Tu estación de radio costarricense con las últimas noticias, deportes, música y entretenimiento.',
    creator: '@webcolumbia',
    images: ['/opengraph-image.jpg'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1E305F',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es-CR" className="overflow-x-hidden">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2T6Z9LG0JD"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2T6Z9LG0JD');
          `}
        </Script>
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RadioStation",
            "name": "Radio Columbia",
            "description": "Tu estación de radio costarricense con las últimas noticias, deportes, música y entretenimiento",
            "url": "https://radiodev.aurigital.com",
            "logo": "https://radiodev.aurigital.com/assets/LogoColumbia.svg",
            "sameAs": [
              "https://www.facebook.com/NoticiasColumbia/",
              "https://www.instagram.com/noticiascolumbia/",
              "https://www.youtube.com/channel/UCo2Fr8GUPmevyi7uih-0oTg",
              "https://x.com/webcolumbia"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": "Spanish"
            },
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "CR"
            },
            "areaServed": {
              "@type": "Country",
              "name": "Costa Rica"
            }
          })}
        </Script>
      </head>
      <body className={inter.className}>
        <SearchProvider>
          <PlayerProvider>
            {children}
            <RadioPlayer />
          </PlayerProvider>
        </SearchProvider>
      </body>
    </html>
  )
}
