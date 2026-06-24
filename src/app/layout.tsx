import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import BottomNav from "@/components/BottomNav";
import { Sparkles } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devjobs.site"),
  title: "DevJobs | The Only Tech Job Tracker Built For You",
  description: "Stop using spreadsheets. Start tracking every remote tech job with a purpose-built tool. Get real roles filtered by AI.",
  keywords: ["remote jobs", "tech jobs", "developer jobs", "remote tech jobs", "software engineering jobs"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://devjobs.site",
    siteName: "DevJobs",
    title: "DevJobs | The Only Tech Job Tracker Built For You",
    description: "Stop using spreadsheets. Start tracking every remote tech job with a purpose-built tool.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DevJobs - Remote Tech Jobs",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevJobs | The Only Tech Job Tracker Built For You",
    description: "Start tracking every remote tech job with a purpose-built tool.",
    creator: "@pranvv27",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-zinc-800 flex flex-col relative overflow-x-hidden`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:p-4 focus:bg-white focus:text-black focus:font-bold">
          Skip to main content
        </a>
        
        {/* AssetWise Dot Grid */}
        <div className="fixed inset-0 z-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Flat Minimal Navbar */}
          <header role="banner" className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
            <nav aria-label="Main Navigation" className="flex items-center gap-8 px-8 py-3.5 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-lg pointer-events-auto">
              <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
                <div className="font-black text-lg tracking-tighter flex items-center gap-1">
                  <span className="text-blue-500">/_</span>
                  <span>devjobs</span>
                </div>
              </Link>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
                <Link href="/" className="hover:text-white transition-colors">Discover</Link>
                <Link href="/matches" className="hover:text-white transition-colors flex items-center gap-1">
                  For You <Sparkles size={12} className="text-purple-400" />
                </Link>
                <Link href="/saved" className="hover:text-white transition-colors">Saved</Link>
              </div>
            </nav>
          </header>

          {/* Main Content Area */}
          <main id="main-content" role="main" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28">
            {children}
          </main>

          <BottomNav />

          {/* Clean Flat Footer */}
          <footer role="contentinfo" className="py-24 mt-20 border-t border-white/5">
            <div className="container mx-auto px-4 flex flex-col items-center text-center gap-6">
              <div className="font-black text-xl tracking-tighter flex items-center gap-1">
                <span className="text-blue-500">/_</span>
                <span>devjobs</span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-zinc-500">
                <a href="https://github.com/pranavv00" target="_blank" className="hover:text-white transition-colors">GitHub</a>
                <a href="https://x.com/pranvv27" target="_blank" className="hover:text-white transition-colors">Twitter</a>
                <span className="hidden sm:inline opacity-20">•</span>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              </div>
              
              <p className="text-sm font-normal text-zinc-600 mt-4">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </footer>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
