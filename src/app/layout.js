import { Inter } from 'next/font/google'
import './globals.css'
import { SearchProvider } from '@/lib/SearchContext'
import { PlayerProvider } from '@/lib/PlayerContext'
import RadioPlayer from '@/components/RadioPlayer'
import Script from 'next/script'
import SplashPage from '@/components/SplashPage'  

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Radio2 - La Nueva Era de la Radio Digital en Costa Rica',
  description: 'Radio2 - Experimenta la radio del futuro. Música, noticias, deportes y entretenimiento con una perspectiva moderna y dinámica. Transmisión digital 24/7 con la mejor calidad y programación innovadora.',
  keywords: 'radio2, radio digital, streaming costa rica, radio online, noticias en vivo, radio moderna, radio interactiva, deportes en vivo, entretenimiento digital, radio streaming, radio 24/7',
  authors: [{ name: 'Radio2' }],
  creator: 'Radio2',
  publisher: 'Radio2',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://radiodos.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Radio2 - La Nueva Era de la Radio Digital en Costa Rica',
    description: 'Experimenta la radio del futuro con Radio2. Música, noticias, deportes y entretenimiento con una perspectiva moderna y dinámica. Transmisión digital 24/7.',
    url: 'https://radiodos.com',
    siteName: 'Radio2',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Radio2 - La Nueva Era de la Radio Digital',
      },
    ],
    locale: 'es_CR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radio2 - La Nueva Era de la Radio Digital en Costa Rica',
    description: 'Experimenta la radio del futuro. Música, noticias y entretenimiento con una perspectiva moderna y dinámica.',
    creator: '@radiodos',
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
          src="https://www.googletagmanager.com/gtag/js?id=G-ZY4PPFPEJK"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZY4PPFPEJK');
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
            "name": "Radio2",
            "description": "La nueva era de la radio digital en Costa Rica. Música, noticias y entretenimiento con una perspectiva moderna y dinámica.",
            "url": "https://radiodos.com",
            "logo": "https://radiodos.com/assets/LogoRadio2.svg",
            "sameAs": [
              "https://www.facebook.com/Radio2cr/",
              "https://www.instagram.com/radio2cr/",
              "https://x.com/radiodos"
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
            <SplashPage />
            {children}
            <RadioPlayer />
          </PlayerProvider>
        </SearchProvider>
      </body>
    </html>
  )
}
