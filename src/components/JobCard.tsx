"use client";

import { MapPin, Clock, DollarSign, Bookmark, ArrowUpRight, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { formatDisplayDate, generateJobSlug, isRecent } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Job } from "@/lib/data";
import { motion } from "framer-motion";

export default function JobCard({ job, index }: { job: Job; index: number }) {
  const [isSaved, setIsSaved] = useState(false);
  const [hasNewBadge] = useState(isRecent(job.posted_at));
  
  const displayTags = job.ai_data?.tags?.slice(0, 2) || ["Remote", "Tech"];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    setIsSaved(saved.some((s: Job) => s.id === job.id));
  }, [job.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    let newSaved;
    if (isSaved) {
      newSaved = saved.filter((s: Job) => s.id !== job.id);
    } else {
      newSaved = [...saved, job];
    }
    localStorage.setItem("savedJobs", JSON.stringify(newSaved));
    setIsSaved(!isSaved);
  };

  const jobSlug = generateJobSlug(job);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="relative group bg-[#111111] hover:bg-[#161616] transition-all border border-white/5 hover:border-white/10 rounded-[1.5rem] p-6 shadow-sm focus-within:ring-2 focus-within:ring-white/20"
    >
      <div className="block">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-12 h-12 flex items-center justify-center bg-black border border-white/5 rounded-2xl text-white font-medium text-lg shrink-0 overflow-hidden shadow-inner">
            {job.company.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <Link href={`/jobs/${jobSlug}`} className="focus:outline-none before:absolute before:inset-0 z-0">
                  <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors leading-tight line-clamp-2">
                    {job.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-1.5 text-zinc-500 text-[13px] font-medium truncate mt-1">
                  <span>{job.company}</span>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1">
                    <Globe size={12} className="text-zinc-600" />
                    <span>Remote</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={toggleSave}
                aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
                className={`relative z-10 p-2 rounded-xl transition-all active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${isSaved ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
              >
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Tags & Meta */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex gap-2">
                {displayTags.map((tech) => (
                  <span key={tech} className="px-2.5 py-1 bg-black text-zinc-400 text-xs font-medium rounded-lg border border-white/5">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                <Clock size={14} />
                <span>{formatDisplayDate(job.posted_at)}</span>
              </div>
            </div>

            {/* Desktop Quick Info */}
            <div className="hidden sm:flex items-center justify-between mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                {hasNewBadge && (
                  <span className="px-2.5 py-1 bg-white/10 text-white text-xs font-medium rounded-lg">New</span>
                )}
                {job.salary && <span className="text-zinc-400 text-xs font-medium">{job.salary}</span>}
              </div>
              <span className="text-zinc-400 text-sm font-medium group-hover:text-white transition-colors flex items-center gap-1">Details <ArrowUpRight size={14} /></span>
            </div>

            <div className="mt-6 sm:hidden">
              <div className="w-full py-3.5 bg-white text-black text-sm font-medium rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
                Apply <ArrowUpRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
