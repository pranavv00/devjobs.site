"use client";

import { Home, Bookmark, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Discover", icon: Home, href: "/" },
    { label: "Jobs", icon: Briefcase, href: "/jobs" },
    { label: "Saved", icon: Bookmark, href: "/saved" },
  ];

  return (
    <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
      <div className="bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.08] flex items-center justify-around py-3 rounded-2xl shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 w-20 ${isActive ? "text-blue-500" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-50"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
