import React from "react";

export default function PhotoCard({ filename, isDhruw = false }: { filename: string, isDhruw: boolean }) {
  return (
    <div className="relative break-inside-avoid rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950 group transition-all duration-700 hover:border-zinc-700">
      <img 
        src={`http://localhost:8000/view_photos/${filename}`} 
        className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700"
        alt="Event"
        loading="lazy"
      />
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
        <span className="text-[10px] font-mono text-zinc-500 mb-1">{filename}</span>
        {isDhruw && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-black text-white tracking-widest uppercase">Verified Identity</span>
          </div>
        )}
      </div>
    </div>
  );
}