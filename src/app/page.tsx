"use client";

import { useEffect, useState } from "react";
import { getJobs, Job } from "@/lib/data";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import TechStackInput from "@/components/TechStackInput";
import AdvancedFiltersPanel, { AdvancedFilterState } from "@/components/AdvancedFiltersPanel";
import JobCard from "@/components/JobCard";
import { Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
    roles: [],
    experience: [],
    hasSalary: false
  });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayLimit, setDisplayLimit] = useState(9);
  const advancedFiltersCount = advancedFilters.roles.length + advancedFilters.experience.length + (advancedFilters.hasSalary ? 1 : 0);

  // Read URL search params on mount to enable shareable/indexable search links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setSearchQuery(q);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getJobs();
        setJobs(data);
        setFilteredJobs(data);
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = jobs;
    setDisplayLimit(9); // Reset on filter change

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
      );
    }

    if (activeFilters.length > 0) {
      result = result.filter(job => {
        return activeFilters.every(filter => {
          if (filter === "remote") return true; // All are remote
          if (filter === "junior") return job.description.toLowerCase().includes("junior") || job.description.toLowerCase().includes("0-2");
          if (filter === "react") return job.description.toLowerCase().includes("react");
          if (filter === "ai") return job.description.toLowerCase().includes("ai") || job.description.toLowerCase().includes("machine learning");
          return true;
        });
      });
    }

    // Advanced Filters Engine
    if (advancedFilters.roles.length > 0) {
      result = result.filter(job => {
        const textToSearch = (job.title + " " + job.description + " " + (job.ai_data?.tags?.join(" ") || "")).toLowerCase();
        return advancedFilters.roles.some(role => textToSearch.includes(role.toLowerCase()));
      });
    }

    if (advancedFilters.experience.length > 0) {
      result = result.filter(job => {
        const titleLower = job.title.toLowerCase();
        const descLower = job.description.toLowerCase();
        return advancedFilters.experience.some(exp => {
          const e = exp.toLowerCase();
          if (e === "junior") return titleLower.includes("junior") || titleLower.includes("entry") || descLower.includes("junior") || descLower.includes("entry level");
          if (e === "mid-level") return titleLower.includes("mid") || descLower.includes("mid-level") || descLower.includes("mid level");
          if (e === "senior") return titleLower.includes("senior") || titleLower.includes("sr") || descLower.includes("senior");
          if (e === "lead") return titleLower.includes("lead") || descLower.includes("lead");
          if (e === "principal") return titleLower.includes("principal") || descLower.includes("principal");
          if (e === "manager") return titleLower.includes("manager") || descLower.includes("manager");
          return false;
        });
      });
    }

    if (advancedFilters.hasSalary) {
      result = result.filter(job => !!job.salary && job.salary.trim() !== "");
    }

    setFilteredJobs(result);
  }, [searchQuery, activeFilters, advancedFilters, jobs]);

  const toggleFilter = (id: string) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const trendingJobs = jobs.slice(0, 3); // Mock trending roles

  // WebSite JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DevJobs",
    "url": "https://devjobs.site",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://devjobs.site/jobs?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <main className="min-h-screen pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero jobCount={jobs.length} />
      
      <div id="search" className="container mx-auto px-4 mt-12">
        <TechStackInput />
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          openAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
          advancedFiltersCount={advancedFiltersCount}
        />
      </div>

      <div className="container mx-auto px-4 mt-24">
        {/* Trending Section */}
        {!searchQuery && activeFilters.length === 0 && (
          <section className="mb-24">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/10 shrink-0">
                <Flame size={24} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Fresh jobs just dropped 🚀</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingJobs.map((job, idx) => (
                <JobCard key={`trending-${job.id}`} job={job} index={idx} />
              ))}
            </div>
          </section>
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-purple-400 shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {searchQuery || activeFilters.length > 0 ? "Search Results" : "Discovery Engine"}
            </h2>
            <div className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-[10px] font-black ml-4 uppercase tracking-widest border border-white/5 whitespace-nowrap">
              {filteredJobs.length} Jobs Found
            </div>
          </div>
          <Link href="/jobs" className="text-purple-400 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors group flex items-center gap-2">
            View all jobs <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div role="status" aria-label="Loading jobs" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <span className="sr-only">Loading jobs...</span>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 h-[300px] animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div aria-live="polite" aria-atomic="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.slice(0, displayLimit).map((job, idx) => (
                <JobCard key={job.id} job={job} index={idx} />
              ))}
            </div>
            
            {filteredJobs.length > displayLimit && (
              <div className="flex justify-center mt-20">
                <Link href="/jobs" id="view-all-jobs-button" className="px-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 hover:border-purple-500/30 transition-all active:scale-95 shadow-2xl">
                  View all jobs
                </Link>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 glass-card rounded-3xl"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No jobs found. Even we’re surprised.</h3>
            <p className="text-foreground/50">Try broadening your search or using our quick filters.</p>
          </motion.div>
        )}
      </div>

      <AdvancedFiltersPanel 
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
      />

      {/* SEO Domination: Popular Remote Searches Footer */}
      <section className="container mx-auto px-4 max-w-4xl py-12 mt-12 border-t border-white/5">
        <h2 className="text-xl font-black tracking-tight mb-6 text-zinc-300">Popular Remote Searches</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/q/us-remote-jobs" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">US Remote Jobs</Link>
          <Link href="/q/uk-remote-jobs" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">UK Remote Jobs</Link>
          <Link href="/q/growth-marketing-remote" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">Growth Marketing Remote</Link>
          <Link href="/q/react-native-remote" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">Remote React Native Developer</Link>
          <Link href="/q/spanish-remote-jobs" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">Spanish Remote Jobs</Link>
          <Link href="/q/technical-lead-remote" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">Technical Lead Remote</Link>
          <Link href="/q/data-analyst-remote" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">Data Analyst Jobs Remote</Link>
          <Link href="/q/frontend-remote-jobs" className="px-4 py-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all">Frontend Remote Jobs</Link>
        </div>
      </section>
    </main>
  );
}
