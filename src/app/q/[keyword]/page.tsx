import { getJobsServer } from "@/lib/data-server";
import JobCard from "@/components/JobCard";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// The massive list of high-value keywords to statically generate for Google
const TOP_KEYWORDS = [
  "us-remote-jobs",
  "uk-remote-jobs",
  "europe-remote-jobs",
  "growth-marketing-remote",
  "react-native-remote",
  "spanish-remote-jobs",
  "technical-lead-remote",
  "data-analyst-remote",
  "frontend-remote-jobs",
  "backend-remote-jobs",
  "react-remote-jobs",
  "python-remote-jobs",
  "node-remote-jobs"
];

// Tell Next.js to pre-build all these pages statically at build time!
export async function generateStaticParams() {
  return TOP_KEYWORDS.map((keyword) => ({
    keyword: keyword,
  }));
}

// Generate highly optimized meta tags for each keyword page
export async function generateMetadata({ params }: { params: { keyword: string } }): Promise<Metadata> {
  const cleanKeyword = params.keyword.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const title = `Find The Best ${cleanKeyword} | DevJobs`;
  const description = `Discover the latest ${cleanKeyword} on DevJobs. We hand-curate top remote tech jobs for developers, designers, and marketers updated daily.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `/q/${params.keyword}`,
    },
  };
}

export default async function ProgrammaticSEOPage({ params }: { params: { keyword: string } }) {
  const jobs = await getJobsServer();
  const cleanKeyword = params.keyword.replace(/-/g, ' ');
  const searchTerms = params.keyword.toLowerCase().split('-');

  // Server-side filtering for maximum SEO indexability
  const filteredJobs = jobs.filter(job => {
    const textToSearch = (job.title + " " + job.description + " " + (job.ai_data?.tags?.join(" ") || "")).toLowerCase();
    
    // Custom logic for geo-targeting
    if (searchTerms.includes("us") || searchTerms.includes("united states")) {
       if (!textToSearch.includes("us ") && !textToSearch.includes("united states") && !textToSearch.includes("usa") && !textToSearch.includes("america") && !textToSearch.includes("worldwide") && !textToSearch.includes("global")) {
         return false; // Skip if it explicitly doesn't match US or Worldwide
       }
    }
    if (searchTerms.includes("uk") || searchTerms.includes("united kingdom")) {
       if (!textToSearch.includes("uk ") && !textToSearch.includes("united kingdom") && !textToSearch.includes("london") && !textToSearch.includes("britain") && !textToSearch.includes("worldwide") && !textToSearch.includes("global")) {
         return false;
       }
    }
    
    // General keyword matching
    const coreKeywords = searchTerms.filter(k => !["remote", "jobs", "in", "for", "us", "uk", "europe"].includes(k));
    if (coreKeywords.length > 0) {
      return coreKeywords.some(kw => textToSearch.includes(kw));
    }
    
    return true; // If no core keywords (like just "us remote jobs"), rely on geo logic
  });

  const displayTitle = params.keyword.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Generate WebPage JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${displayTitle} on DevJobs`,
    "description": `Browse ${filteredJobs.length} hand-picked ${displayTitle}.`,
    "url": `https://www.devjobs.site/q/${params.keyword}`
  };

  return (
    <main className="min-h-screen pb-32 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Sleek Hero Section */}
      <div className="bg-[#111111] border-b border-white/5 pt-16 pb-12 mb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white mb-8 transition-colors font-black uppercase tracking-widest text-[10px] group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Discovery</span>
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
            The Best <span className="text-purple-400">{displayTitle}</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            We've found {filteredJobs.length} active roles matching your search. Skip the spreadsheets and apply directly to the best remote tech companies today.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, idx) => (
            <JobCard key={job.id} job={job} index={idx} />
          ))}
          {filteredJobs.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <h3 className="text-2xl font-bold mb-2">No active jobs found right now.</h3>
              <p className="text-zinc-500">Try checking back tomorrow or browse our main discovery engine.</p>
              <Link href="/" className="inline-block mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-black uppercase tracking-widest transition-all">
                View All Jobs
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
