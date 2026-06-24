"use client";

import { useEffect, useState } from "react";
import { getJobs, Job } from "@/lib/data";
import { formatDisplayDate } from "@/lib/utils";
import JobCard from "@/components/JobCard";
import { Search, Filter, Calendar, MapPin, Briefcase, DollarSign, X, ChevronDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function JobsExplorer() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [expFilter, setExpFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Helper to parse salary string to number
  const parseSalaryValue = (str: string) => {
    if (!str) return 0;
    const match = str.replace(/,/g, '').match(/(\d+)/);
    if (!match) return 0;
    let val = parseInt(match[0]);
    if (str.toLowerCase().includes('k')) val *= 1000;
    // Handle hourly (rough estimation: 2000 hours/year)
    if (str.toLowerCase().includes('hour') || str.toLowerCase().includes('/hr')) val *= 2000;
    return val;
  };

  useEffect(() => {
    async function fetchData() {
      const data = await getJobs();
      setJobs(data);
      setFilteredJobs(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = jobs;

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
      );
    }

    // Experience Filter
    if (expFilter !== "all") {
      result = result.filter(j => {
        const desc = j.description.toLowerCase();
        if (expFilter === "senior") return desc.includes("senior") || desc.includes("lead") || desc.includes("staff") || desc.includes("principal") || desc.includes("5+ years");
        if (expFilter === "junior") return desc.includes("junior") || desc.includes("entry") || desc.includes("0-2 years");
        if (expFilter === "intern") return desc.includes("intern") || desc.includes("apprentice");
        if (expFilter === "mid") return !desc.includes("junior") && !desc.includes("senior") && !desc.includes("intern");
        return true;
      });
    }

    // Job Type Filter
    if (typeFilter !== "all") {
      result = result.filter(j => {
        const desc = j.description.toLowerCase();
        if (typeFilter === "contract") return desc.includes("contract") || desc.includes("freelance");
        if (typeFilter === "part-time") return desc.includes("part-time");
        if (typeFilter === "full-time") return !desc.includes("contract") && !desc.includes("part-time") && !desc.includes("internship");
        if (typeFilter === "internship") return desc.includes("internship");
        return true;
      });
    }

    // Date Filter
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter(j => {
        const posted = new Date(j.posted_at);
        const diffInMs = now.getTime() - posted.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        
        if (dateFilter === "24h") return diffInDays <= 1;
        if (dateFilter === "7d") return diffInDays <= 7;
        if (dateFilter === "30d") return diffInDays <= 30;
        return true;
      });
    }

    // Salary Filter
    if (salaryMin || salaryMax) {
      result = result.filter(j => {
        if (!j.salary) return false;
        const val = parseSalaryValue(j.salary);
        if (salaryMin && val < parseInt(salaryMin)) return false;
        if (salaryMax && val > parseInt(salaryMax)) return false;
        return true;
      });
    }

    // Remote Filter
    if (remoteOnly) {
      result = result.filter(j => j.description.toLowerCase().includes("remote") || true);
    }

    setFilteredJobs(result);
  }, [searchQuery, expFilter, typeFilter, dateFilter, salaryMin, salaryMax, remoteOnly, jobs]);

  return (
    <main className="min-h-screen pb-32 pt-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-purple-400 mb-8 transition-all font-bold uppercase tracking-widest text-[10px] group">
            <X size={14} className="group-hover:rotate-90 transition-transform" />
            <span>Close Explorer</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
                JOBS <span className="text-purple-500">EXPLORER</span>
              </h1>
              <p className="text-gray-400 font-medium max-w-xl border-l-2 border-white/10 pl-4 uppercase tracking-[0.2em] text-[10px] leading-relaxed">
                Browse through {jobs.length} verified opportunities across the remote ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="sticky top-4 z-50 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-2 sm:p-3 flex flex-col md:flex-row gap-3 shadow-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <label htmlFor="search-jobs" className="sr-only">Search jobs</label>
                <input 
                  id="search-jobs"
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full h-12 sm:h-14 pl-14 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium uppercase tracking-widest text-xs"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`h-12 sm:h-14 flex-1 md:flex-none px-4 sm:px-8 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[10px] transition-all ${isFilterOpen ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
                >
                  <Filter size={16} />
                  Filters {Object.values({expFilter, typeFilter, dateFilter}).filter(v => v !== 'all').length + (salaryMin || salaryMax ? 1 : 0) > 0 && `(${Object.values({expFilter, typeFilter, dateFilter}).filter(v => v !== 'all').length + (salaryMin || salaryMax ? 1 : 0)})`}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="hidden sm:flex items-center gap-4 px-6 border-l border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Remote Ony</span>
                  <button 
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-all ${remoteOnly ? 'bg-purple-600' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 sm:top-1 w-4 h-4 rounded-full bg-white transition-all ${remoteOnly ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters Drawer */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-8 shadow-3xl">
                  {/* Experience */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <Briefcase size={12} className="text-purple-400" /> Experience
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["all", "intern", "junior", "mid", "senior"].map(lvl => (
                        <button 
                          key={lvl}
                          onClick={() => setExpFilter(lvl)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${expFilter === lvl ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <Briefcase size={12} className="text-blue-400" /> Type
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["all", "full-time", "part-time", "contract", "internship"].map(t => (
                        <button 
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${typeFilter === t ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          {t.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <DollarSign size={12} className="text-green-400" /> Salary Range
                    </h4>
                    <div className="flex items-center gap-2">
                      <label htmlFor="salary-min" className="sr-only">Minimum Salary</label>
                      <input 
                        id="salary-min"
                        type="number" 
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        placeholder="Min"
                        className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder:text-white/10 text-[10px] focus:outline-none focus:border-green-500/50"
                      />
                      <span className="text-gray-600">-</span>
                      <label htmlFor="salary-max" className="sr-only">Maximum Salary</label>
                      <input 
                        id="salary-max"
                        type="number" 
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder="Max"
                        className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder:text-white/10 text-[10px] focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                  </div>

                  {/* Date Posted */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <Calendar size={12} className="text-orange-400" /> Date
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["all", "24h", "7d", "30d"].map(d => (
                        <button 
                          key={d}
                          onClick={() => setDateFilter(d)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === d ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          {d === 'all' ? 'Any' : d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
             <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white">
               {filteredJobs.length} Results Found
             </h2>
          </div>
          {(searchQuery || expFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all' || salaryMin || salaryMax) && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setExpFilter("all");
                setTypeFilter("all");
                setDateFilter("all");
                setSalaryMin("");
                setSalaryMax("");
              }}
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Job Grid */}
        {loading ? (
          <div role="status" aria-label="Loading jobs" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <span className="sr-only">Loading jobs...</span>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6 h-[250px] animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div aria-live="polite" aria-atomic="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, idx) => (
              <JobCard key={job.id} job={job} index={idx} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-40 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-md"
          >
            <div className="text-7xl mb-8">🫙</div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">No matching roles found</h3>
            <p className="text-gray-500 max-w-sm mx-auto uppercase tracking-widest text-[10px] leading-loose">
              Try adjusting your filters or expanding your search to find more opportunities.
            </p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setExpFilter("all");
                setTypeFilter("all");
                setDateFilter("all");
              }}
              className="mt-10 px-10 py-4 rounded-2xl bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-purple-500/20 active:scale-95 transition-all"
            >
              View all {jobs.length} jobs
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
