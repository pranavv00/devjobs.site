import { Search, SlidersHorizontal, X, MapPin, Briefcase, Code2, Zap } from "lucide-react";
import { useState, useEffect } from "react";

const CHIPS = [
  { id: "remote", label: "Remote", icon: MapPin },
  { id: "junior", label: "Junior", icon: Briefcase },
  { id: "react", label: "React", icon: Code2 },
  { id: "ai", label: "AI & ML", icon: Zap },
];

export default function SearchBar({ 
  searchQuery, 
  setSearchQuery,
  activeFilters,
  toggleFilter,
  openAdvancedFilters,
  advancedFiltersCount
}: { 
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeFilters: string[];
  toggleFilter: (id: string) => void;
  openAdvancedFilters: () => void;
  advancedFiltersCount: number;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`sticky top-20 z-40 transition-all duration-300 ${isScrolled ? "py-2" : "py-6"}`}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className={`relative group transition-all duration-500 ${isScrolled ? "scale-[0.98]" : "scale-100"}`}>
          {/* Main Search Input */}
          <div className={`flex items-center gap-3 px-6 h-14 bg-[#111111] border transition-all duration-300 rounded-full ${isScrolled ? "border-white/10 shadow-lg" : "border-white/5"}`}>
            <Search className={`w-5 h-5 transition-colors ${searchQuery ? "text-blue-500" : "text-zinc-500"}`} size={20} />
            <label htmlFor="search-input" className="sr-only">Search roles, skills, or companies</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search roles, skills, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-zinc-100 placeholder:text-zinc-600 font-medium h-full"
            />
            {searchQuery && (
              <button aria-label="Clear search" onClick={() => setSearchQuery("")} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors">
                <X size={16} />
              </button>
            )}
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />
            <button className="hidden sm:flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors active:scale-95">
              Search
            </button>
          </div>

          {/* Minimal Filter Pills */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={openAdvancedFilters}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 shrink-0 ${
                advancedFiltersCount > 0 
                  ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20" 
                  : "bg-[#111111] border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
              }`}
            >
              <SlidersHorizontal size={14} />
              Advanced {advancedFiltersCount > 0 && `(${advancedFiltersCount})`}
            </button>
            
            <div className="h-6 w-px bg-white/10 mx-2 shrink-0 hidden sm:block" />

            {CHIPS.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    isActive 
                      ? "bg-white border-white text-black shadow-sm" 
                      : "bg-[#111111] border-white/5 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
