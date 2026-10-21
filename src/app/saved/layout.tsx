import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata({
  title: 'Saved jobs & applications',
  description: 'Track your saved jobs, applications, interviews, and offers in this browser.',
  path: '/saved',
  noindex: true,
});
export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
