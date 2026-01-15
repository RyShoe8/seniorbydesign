import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import ConditionalLayout from '@/components/ConditionalLayout'
import Analytics from '@/components/Analytics'
import { generateSEOMetadata, JSONLDSchema, OrganizationSchema, WebSiteSchema } from '@/components/SEO'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Senior By Design - Soul Warming Interiors',
  description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
  url: '/',
  type: 'website',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <JSONLDSchema schema={OrganizationSchema()} />
        <JSONLDSchema schema={WebSiteSchema()} />
        <Analytics />
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  )
}

