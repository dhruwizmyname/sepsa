"use client";
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Premium Unsplash Photos for the Gallery
  const displayPhotos = [
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80", // Wedding Crowd
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80", // Model Portrait
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80", // Concert/Event
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80", // Candid Wedding
    "https://images.unsplash.com/photo-1523580494112-071d16940d14?auto=format&fit=crop&w=800&q=80", // Festival/Friends
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", // Party Vibe
  ];

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      {/* 🌟 HERO SECTION */}
      <main className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] to-[#eff6ff] -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#2563eb] font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Photo Delivery</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Your Event Photos,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#0ea5e9]">
              Delivered Instantly.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            No more hunting for your photos in endless gallery links. Take a selfie, and let our AI instantly find and deliver every photo you are in.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            {/* User Login Button */}
            <button 
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-[#2563eb] text-white rounded-full font-bold text-lg hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              <Camera className="w-5 h-5" />
              Find My Photos
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* Photographer Login Button */}
            <button 
              onClick={() => router.push('/photographer')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Photographer Portal
            </button>
          </div>
        </div>
      </main>

      {/* 🖼️ INSPIRATION GALLERY (Pinterest Style Masonry) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Capture Every Moment</h2>
        
        {/* CSS Columns logic for Masonry Layout */}
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
          {displayPhotos.map((photoUrl, index) => (
            <div 
              key={index} 
              className="break-inside-avoid overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 group relative cursor-pointer"
            >
              <img 
                src={photoUrl} 
                alt={`Event Inspiration ${index + 1}`} 
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}