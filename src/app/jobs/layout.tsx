import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Remote Tech Jobs | DevJobs',
  description: 'Browse remote developer jobs. Filter by role, salary, and experience.',
  alternates: {
    canonical: '/jobs',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
