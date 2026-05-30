import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved Jobs | DevJobs',
  description: 'View and manage your saved remote developer jobs.',
  alternates: {
    canonical: '/saved',
  },
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
