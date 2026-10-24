import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/shared/Navigation';
import SiteFooter from '@/shared/SiteFooter';
import { SITE_URL, SITE_DESCRIPTION, absoluteUrl } from '@/shared/seo';
import { Analytics } from '@vercel/analytics/next';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DevJobs — Remote developer jobs & application tracker',
    template: '%s | DevJobs',
  },
  description: SITE_DESCRIPTION,
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'DevJobs',
    title: 'DevJobs — Your next chapter starts here',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DevJobs — Great work. From anywhere.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevJobs — Remote developer jobs',
    description: SITE_DESCRIPTION,
    images: [absoluteUrl('/og-image.png')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#0b0f12', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Navigation />
        <main id="main-content" className="shell main-content">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
