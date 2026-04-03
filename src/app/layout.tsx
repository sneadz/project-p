import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Oxanium } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Sidebar from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { ThemeProvider } from '@/components/theme-provider'

const oxanium = Oxanium({
  subsets: ['latin'],
  variable: '--font-oxanium',
  weight: ['700', '800'],
})

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: "grind.gg | Esports Pick'em",
  description: 'Grind the ladder, earn shards and climb the global leaderboard.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oxanium.variable} antialiased bg-background`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Desktop layout */}
          <div className="hidden md:flex h-screen p-3 gap-3">
            {/* Sidebar flottante */}
            <Sidebar />

            {/* Bloc principal flottant — scroll interne */}
            <main className="flex-1 min-w-0 rounded-2xl bg-card dark:bg-[hsl(220_6%_11%)] overflow-y-auto scrollbar-none shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
              {children}
            </main>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden min-h-screen pb-16">
            <main>{children}</main>
            <MobileNav />
          </div>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
