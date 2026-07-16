import type { Job } from "@/lib/data";
import { useState, useEffect } from "react";
import JobCard from "@/components/JobCard";
import TechStackInput from "@/components/TechStackInput";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";

interface JobWithScore extends Job {
  matchScore: number;
}

export default function MatchesClient({ initialJobs }: { initialJobs: Job[] }) {
  const [matchedJobs, setMatchedJobs] = useState<JobWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMatches = () => {
      const savedSkills = JSON.parse(localStorage.getItem("userSkills") || "[]") as string[];
      
      if (savedSkills.length === 0) {
        setMatchedJobs([]);
        setLoading(false);
        return;
      }

      const jobsWithScores: JobWithScore[] = initialJobs.map(job => {
        const textToSearch = (job.title + " " + job.description + " " + (job.ai_data?.tags?.join(" ") || "")).toLowerCase();
        let matched = 0;
        savedSkills.forEach(skill => {
          if (textToSearch.includes(skill.toLowerCase())) {
            matched++;
          }
        });
        const score = Math.round((matched / savedSkills.length) * 100);
        return { ...job, matchScore: score };
      });

      // Filter out 0% matches and sort descending by score
      const filteredAndSorted = jobsWithScores
        .filter(job => job.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      setMatchedJobs(filteredAndSorted);
      setLoading(false);
    };

    calculateMatches();
    
    // Listen for updates from TechStackInput on this page
    window.addEventListener("userSkillsUpdated", calculateMatches);
    return () => window.removeEventListener("userSkillsUpdated", calculateMatches);
  }, [initialJobs]);

  return (
    <div className="container mx-auto px-4 max-w-6xl pb-32">
      <a href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white mb-8 transition-colors font-black uppercase tracking-widest text-[10px] group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Discovery</span>
      </a>
      
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-purple-400" size={32} />
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">For You</h1>
      </div>
      
      <p className="text-zinc-400 text-lg max-w-2xl mb-12">
        These roles are algorithmically matched to your specific tech stack. Jobs are ranked by highest match percentage.
      </p>

      {/* Allow users to tweak skills right on the page */}
      <div className="mb-16">
        <TechStackInput />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 h-[300px] animate-pulse" />
          ))}
        </div>
      ) : matchedJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchedJobs.map((job, idx) => (
            <JobCard key={job.id} job={job} index={idx} />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 bg-zinc-900/30 border border-white/5 rounded-[2rem]"
        >
          <Sparkles className="mx-auto text-zinc-700 mb-6" size={64} />
          <h3 className="text-2xl font-bold mb-2">No matching jobs found</h3>
          <p className="text-zinc-500 max-w-sm mx-auto">
            Try adding more skills to your Tech Stack above, or check back later as we add new jobs daily.
          </p>
        </motion.div>
      )}
    </div>
  );
}
