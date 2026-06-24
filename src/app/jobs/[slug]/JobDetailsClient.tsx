"use client";

import { useState, useEffect } from "react";
import { Job } from "@/lib/data";
import { formatDisplayDate } from "@/lib/utils";
import { ArrowLeft, Bookmark, Globe, Send, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function JobDetailsClient({ job }: { job: Job }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    setIsSaved(saved.some((s: Job) => s.id === job.id));
  }, [job.id]);

  const toggleSave = () => {
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

  const renderFormattedDescription = (html: string) => {
    if (!html) return null;
    const cleanText = html
      .replace(/<p>/g, "\n")
      .replace(/<\/p>/g, "\n")
      .replace(/<li>/g, "- ")
      .replace(/<\/li>/g, "\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");

    const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    return (
      <div className="space-y-6">
        {lines.map((line, i) => {
          const isHeading = line.toUpperCase() === line && line.length < 60 && !line.startsWith("-");
          if (isHeading) return <h2 key={i} className="text-base font-black text-white mt-10 mb-4 uppercase tracking-widest border-l-2 border-purple-500 pl-4">{line}</h2>;
          if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
            return (
              <div key={i} className="flex gap-3 items-start text-zinc-300">
                <span className="text-purple-500 font-bold mt-1.5">•</span>
                <p className="text-base leading-relaxed font-medium">{line.replace(/^[•\-\*]\s*/, "")}</p>
              </div>
            );
          }
          return <p key={i} className="text-zinc-300 text-base leading-relaxed font-medium">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen pb-32 pt-8 relative">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white mb-10 transition-colors font-black uppercase tracking-widest text-[10px] group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Discovery</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-12">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center text-zinc-500 font-bold text-3xl shrink-0">
                  {job.company.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-zinc-500 text-[11px] font-black uppercase tracking-widest bg-zinc-950/50 border border-white/[0.03] px-4 py-2 rounded-xl">
                    <span className="text-zinc-300">{job.company}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1.5"><Globe size={14} className="text-zinc-600" /> Remote</div>
                    {job.posted_at && (
                      <>
                        <span>•</span>
                        <span>{formatDisplayDate(job.posted_at)}</span>
                      </>
                    )}
                    {job.salary && (
                      <>
                        <span>•</span>
                        <span className="text-blue-500">{job.salary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={toggleSave} className={`p-4 rounded-xl transition-all h-fit active:scale-90 shrink-0 ${isSaved ? 'text-blue-500 bg-blue-500/10' : 'bg-zinc-900 text-zinc-600 hover:text-white border border-white/[0.05]'}`}>
                <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>

            <div className={`transition-all duration-700 overflow-hidden relative ${!isExpanded ? 'max-h-[500px]' : 'max-h-none'}`}>
              {!isExpanded && <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-10" />}
              {renderFormattedDescription(job.description)}
            </div>

            <div className={`flex justify-center mb-20 relative z-20 ${!isExpanded ? '-mt-8' : 'mt-8'}`}>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-8 py-3 rounded-xl bg-zinc-900 border border-white/[0.05] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center gap-2"
              >
                {isExpanded ? 'Show Less' : 'Full Career Insights'} 
                <ChevronRight size={14} className={isExpanded ? '-rotate-90' : 'rotate-90'} />
              </button>
            </div>
          </div>

          <aside className="w-full lg:w-80">
            <div className="sticky top-28 space-y-6">
              <div className="bg-zinc-950 border border-white/[0.05] p-8 rounded-2xl shadow-2xl">
                <h3 className="text-lg font-black tracking-tight mb-6">Ready to apply?</h3>
                <Link 
                  href={job.url} 
                  target="_blank"
                  className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-blue-600 text-white font-black text-[13px] uppercase tracking-widest shadow-lg shadow-blue-600/10 hover:bg-blue-500 active:scale-95 transition-all"
                >
                  Apply Externally <Send size={18} />
                </Link>
                <div className="mt-6 flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <Zap size={14} className="text-blue-500" />
                  <span>Verified: {job.source}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
