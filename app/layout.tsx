import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import ConditionalLayout from '@/components/ConditionalLayout'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: 'Senior By Design',
  description: 'High-end corporate website for designing spaces for seniors',
  icons: {
    icon: '/images/SBD Logo.webp',
    apple: '/images/SBD Logo.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  )
}

