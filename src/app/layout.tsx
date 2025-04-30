import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Layout } from '@/components/Layout'
import { metadata, viewport } from './metadata'

const inter = Inter({ subsets: ['latin'] })

export { metadata, viewport }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
} 