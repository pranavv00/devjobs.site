import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | DevJobs',
  description: 'Our simple and straightforward terms of service.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pb-32">
      <div className="container mx-auto px-4 pt-12 relative z-10 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12 transition-all text-sm font-medium">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        
        <div className="prose prose-invert prose-zinc max-w-none">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-8">Terms of Service</h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Thanks for using DevJobs! By hanging out here and browsing jobs, you agree to these simple ground rules. We kept it casual so you don't need a law degree to understand it.
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">1. Using the site</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            DevJobs is a discovery engine. We index and curate remote tech jobs from around the web. You can browse, search, and click out to apply. Please don't scrape our site aggressively, try to hack us, or do anything malicious. Just use the site to find your next great role!
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">2. Job accuracy</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            We do our absolute best to ensure the jobs we list are active, remote, and accurately described. However, companies change their minds, close roles, or update salaries without telling us. We can't guarantee that every single detail is 100% accurate by the time you apply. Always verify details with the actual employer.
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">3. No guarantees</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            We provide this service "as is." We don't guarantee that you'll get an interview or get hired just because you used DevJobs (though we really hope you do!). We aren't responsible if a company ghosts you.
          </p>

          <h2 className="text-2xl font-medium tracking-tight mt-12 mb-4 text-white">4. Your data</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Check out our <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link> for details, but basically: we respect your data and don't sell it to third parties.
          </p>

          <p className="text-zinc-500 mt-16 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </main>
  );
}
