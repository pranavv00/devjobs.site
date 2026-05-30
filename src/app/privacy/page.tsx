import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | DevJobs',
  description: 'Our super casual, easy-to-read privacy policy. We protect your data and do not sell it.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pb-32">
      <div className="container mx-auto px-4 pt-12 relative z-10 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12 transition-all text-sm font-medium">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        
        <div className="prose prose-invert prose-zinc max-w-none">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Hey there! Welcome to DevJobs. We know nobody actually likes reading these things, so we'll keep it short, sweet, and casual. We respect your privacy just as much as you do.
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">1. What we collect</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            When you browse DevJobs, we collect basic analytics (like what pages you visit and what jobs you click on). This helps us figure out what kind of roles developers actually care about. If you save jobs locally, that data lives on your device, not on our servers.
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">2. What we don't do</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            We don't sell your personal data. We don't track your cross-site browsing habits. We're here to help you find a job, not to harvest your identity for ad networks.
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">3. Third-party stuff</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            When you click "Apply," you'll usually be taken to the company's actual job board or ATS (like Greenhouse or Lever). Once you leave DevJobs, their privacy policies apply. Be smart and read them if you're concerned!
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">4. Updates</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            We might update this page from time to time if we add new features (like user accounts). If we make major changes, we'll probably put a little notice on the homepage.
          </p>

          <p className="text-zinc-500 mt-16 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </main>
  );
}
