import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Senior By Design',
  description: 'High-end corporate website for designing spaces for seniors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

