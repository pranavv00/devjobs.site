import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

export interface AdvancedFilterState {
  roles: string[];
  experience: string[];
  hasSalary: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilterState;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedFilterState>>;
}

const ROLES = ["Frontend", "Backend", "Full Stack", "Mobile", "DevOps", "Data", "AI", "Design", "Product", "Security"];
const EXPERIENCE = ["Junior", "Mid-Level", "Senior", "Lead", "Principal", "Manager"];

export default function AdvancedFiltersPanel({ isOpen, onClose, filters, setFilters }: Props) {
  
  const toggleRole = (role: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role]
    }));
  };

  const toggleExp = (exp: string) => {
    setFilters(prev => ({
      ...prev,
      experience: prev.experience.includes(exp) ? prev.experience.filter(e => e !== exp) : [...prev.experience, exp]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-black tracking-tight">Advanced Filters</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10">
              {/* Roles */}
              <section>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Role Type</h3>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => {
                    const active = filters.roles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${active ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'}`}
                      >
                        {role}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Experience */}
              <section>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Experience Level</h3>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE.map(exp => {
                    const active = filters.experience.includes(exp);
                    return (
                      <button
                        key={exp}
                        onClick={() => toggleExp(exp)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${active ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'}`}
                      >
                        {exp}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Salary */}
              <section>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Compensation</h3>
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${filters.hasSalary ? 'bg-green-500 border-green-500 text-black' : 'border-white/20'}`}>
                    {filters.hasSalary && <Check size={16} strokeWidth={3} />}
                  </div>
                  <span className="font-semibold text-zinc-200">Only show jobs with salary info</span>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={filters.hasSalary}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasSalary: e.target.checked }))}
                  />
                </label>
              </section>
            </div>

            <div className="p-6 border-t border-white/10 bg-zinc-950">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors shadow-xl shadow-white/10"
              >
                Show Results
              </button>
              <button 
                onClick={() => setFilters({ roles: [], experience: [], hasSalary: false })}
                className="w-full mt-4 py-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
