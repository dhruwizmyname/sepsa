interface PhotoProps {
  filename: string;
  isDhruw: boolean;
}

export default function PhotoCard({ filename, isDhruw }: PhotoProps) {
  return (
    <div className="relative group overflow-hidden rounded-3xl bg-white shadow-md hover:shadow-xl transition-all border border-slate-100">
      <img 
        src={`http://localhost:8000/photos/${filename}`} 
        alt="Event" 
        className="w-full h-auto object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
      />
      
      {/* AI Magic Badge */}
      {isDhruw && (
        <div className="absolute top-4 left-4 bg-yellow-400/90 backdrop-blur-sm text-yellow-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/50 animate-bounce">
          ✨ AI MATCH FOUND
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
        <button className="bg-white/20 backdrop-blur-md text-white border border-white/30 w-full py-3 rounded-2xl font-bold text-xs hover:bg-white hover:text-black transition-colors">
          Download Original
        </button>
      </div>
    </div>
  );
}