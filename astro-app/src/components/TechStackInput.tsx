import { useState, useEffect, type KeyboardEvent } from "react";
import { X, Sparkles } from "lucide-react";

export default function TechStackInput() {
  const [skills, setSkills] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("userSkills");
    if (saved) {
      setSkills(JSON.parse(saved));
    }
  }, []);

  const saveSkills = (newSkills: string[]) => {
    setSkills(newSkills);
    localStorage.setItem("userSkills", JSON.stringify(newSkills));
    // Dispatch a custom event so other components (like JobCard) can react
    window.dispatchEvent(new Event("userSkillsUpdated"));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newSkill = inputValue.trim().toLowerCase();
      if (!skills.includes(newSkill)) {
        saveSkills([...skills, newSkill]);
      }
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    saveSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-500" />
      <div className="bg-[#111111] border border-white/10 rounded-[1.5rem] p-5 shadow-2xl relative overflow-hidden focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="text-purple-400" size={16} />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Match Engine</h3>
          <span className="text-xs text-zinc-500 font-medium ml-2">Add your tech stack to score jobs</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 min-h-[44px] bg-black/50 border border-white/5 rounded-xl px-3 py-2 cursor-text" onClick={() => document.getElementById('tech-input')?.focus()}>
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white rounded-lg text-xs font-bold tracking-wide border border-purple-500/30 shadow-sm"
            >
              {skill}
              <button
                onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                className="hover:text-red-400 transition-colors focus:outline-none"
                aria-label={`Remove ${skill}`}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ))}

          <input
            id="tech-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={skills.length === 0 ? "e.g., React, Python..." : "Add skill..."}
            className="flex-1 bg-transparent min-w-[120px] px-1 py-1 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
          />

          {skills.length > 0 && (
            <a
              href="/matches"
              className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:bg-purple-400"
            >
              Find Matches
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
