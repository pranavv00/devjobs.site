"use client";

import { Sparkles, TrendingUp, MapPin, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero({ jobCount }: { jobCount: number }) {
  const scrollToSearch = () => {
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative pt-20 pb-12 sm:pt-32 sm:pb-16 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 text-center">
        {/* Subtle Badge */}
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 font-medium text-xs mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <span>{jobCount}+ roles indexed today</span>
        </motion.div>

        {/* Sharp Headline - Static for instant LCP */}
        <h1

          className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6 text-white leading-tight animate-[fadeIn_0.5s_ease-out]"
        >
          The only job tracker <br className="hidden sm:block" />
          <span className="text-zinc-500">built for developers.</span>
        </h1>

        {/* Minimal Subhead */}
        <p
          className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-10 font-normal leading-relaxed animate-[fadeIn_0.7s_ease-out]"
        >
          Stop using spreadsheets. Start tracking every remote tech job with a purpose-built tool.
        </p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={scrollToSearch}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-sm font-medium rounded-full hover:bg-zinc-200 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Get started <span>→</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
