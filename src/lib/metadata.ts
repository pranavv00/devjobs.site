import type { Metadata } from 'next';
import { absoluteUrl, SITE_DESCRIPTION } from '../shared/seo';

/** Next replaces nested metadata objects; include social images on every override. */
export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  noindex = false,
  type = 'website',
}: {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
  type?: 'website' | 'article';
}): Metadata {
  const image = {
    url: absoluteUrl('/og-image.png'),
    width: 1200,
    height: 630,
    alt: 'DevJobs — Great work. From anywhere.',
  };
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path), types: { 'application/rss+xml': '/feed.xml' } },
    openGraph: {
      title: `${title} | DevJobs`,
      description,
      url: absoluteUrl(path),
      type,
      locale: 'en_US',
      siteName: 'DevJobs',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | DevJobs`,
      description,
      images: [image.url],
    },
    robots: { index: !noindex, follow: true },
  };
}
