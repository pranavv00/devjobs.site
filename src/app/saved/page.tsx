"use client";

import { useSavedJobs } from "@/lib/hooks";
import JobCard from "@/components/JobCard";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SavedJobsPage() {
  const { savedJobs } = useSavedJobs();

  return (
    <main className="min-h-screen pb-32">
      <div className="container mx-auto px-4 pt-12 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-purple-400 mb-8 transition-all font-bold uppercase tracking-widest text-xs">
          <ArrowLeft size={16} />
          <span>Back to Discovery</span>
        </Link>
        
        <div className="flex items-center gap-4 mb-16">
          <div className="p-3.5 rounded-2xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/10">
            <Bookmark size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter">Jobs you might actually apply to</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage {savedJobs.length} Bookmarked Opportunities</p>
          </div>
        </div>

        {savedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job, idx) => (
              <JobCard key={job.id} job={job} index={idx} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]"
          >
            <div className="text-6xl mb-6">💎</div>
            <h2 className="text-2xl font-black mb-2">No vibes here yet.</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium">Start exploring the discovery engine to find roles worth saving.</p>
            <Link href="/" className="px-10 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/20">
              Start Discovering
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  );
}
