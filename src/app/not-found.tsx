import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl sm:text-8xl font-black mb-6 text-white/10 tracking-tighter">404</h1>
      <h2 className="text-2xl font-black mb-4">Page Not Found</h2>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-10 max-w-md mx-auto leading-relaxed">
        The page or role you're looking for doesn't exist or has been removed from our discovery data.
      </p>
      <Link 
        href="/" 
        className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 hover:border-purple-500/30 transition-all active:scale-95 shadow-2xl"
      >
        Back to Home
      </Link>
    </div>
  );
}
