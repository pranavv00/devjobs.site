"use client";

import { useState, useEffect, KeyboardEvent } from "react";
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
    <div className="w-full max-w-2xl mx-auto mb-8 bg-zinc-950/50 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={100} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-400" size={20} />
          <h3 className="text-lg font-black text-white tracking-tight">Your Tech Stack</h3>
        </div>
        <p className="text-sm text-zinc-400 font-medium mb-4">
          Add your skills to unlock personalized AI Match Scores on every job.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold tracking-widest uppercase border border-purple-500/30"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="hover:text-white transition-colors focus:outline-none"
                aria-label={`Remove ${skill}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? "e.g., React, TypeScript, Python (Press Enter)" : "Add more skills..."}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}
