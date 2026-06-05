import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import Providers from '@/components/Providers'
import ConditionalLayout from '@/components/ConditionalLayout'
import Analytics from '@/components/Analytics'
import SchemaMarkup from '@/components/SchemaMarkup'
import { generateSEOMetadata } from '@/components/SEO'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#CBB86D',
}

import { HOME_TITLE, HOME_META_DESCRIPTION } from '@/lib/home-seo'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com'),
  ...generateSEOMetadata({
    title: HOME_TITLE,
    description: HOME_META_DESCRIPTION,
    url: '/',
    type: 'website',
  }),
  icons: {
    icon: [
      {
        url: '/images/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/images/favicon.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    shortcut: '/images/favicon.png',
    apple: [
      {
        url: '/images/favicon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {recaptchaSiteKey ? (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
            strategy="afterInteractive"
          />
        ) : null}
        <SchemaMarkup />
        <Analytics />
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  )
}

