"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhotoCard from "../components/PhotoCard";

export default function Home() {
  const router = useRouter();
  
  // --- Neural Engine State ---
  const [photos, setPhotos] = useState([]);
  const [isSmartSearchActive, setIsSmartSearchActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Initialized as false
  const [isLoading, setIsLoading] = useState(true); // To prevent flickering
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Check Login Status on Mount
  useEffect(() => {
    const token = localStorage.getItem('userToken'); // Humne login page se ise save kiya tha
    if (token) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // 2. Fetch Photos with Token Authorization
  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch("http://localhost:8000/api/photos", {
        headers: {
          'Authorization': `Bearer ${token}` // Backend validation ke liye
        }
      });
      
      if (res.status === 401) {
        // Agar token expire ho gaya toh logout
        handleLogout();
        return;
      }

      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      console.error("Failed to fetch photos", e);
    }
  };

  useEffect(() => { 
    if (isLoggedIn) fetchPhotos(); 
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    router.push('/');
  };

  // Prevent UI flash while checking token
  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Engine...</div>;

  // ==========================================
  // STATE 1: FIGMA LANDING PAGE (Not Logged In)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 antialiased p-6 md:p-12 relative">
        {/* Navbar */}
        <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 md:mb-24">
          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">E</div>
            <span className="font-bold text-slate-900 tracking-tight">EventSnap</span>
          </div>
          <button 
            onClick={() => router.push('/login')} 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            Get Started
          </button>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">✨ AI-Powered Photo Search</span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Find Your <span className="text-blue-600">Memories</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-lg mb-10 leading-relaxed">
              Search through thousands of event photos instantly with our Neural Engine. Upload, organize, and rediscover moments in milliseconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => router.push('/login')} 
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1"
              >
                Find My Photos
              </button>
            </div>
          </div>

          <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 relative group">
             <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-8 mx-auto shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
             </div>
             <h3 className="text-2xl font-black text-slate-900 text-center mb-3">System Protected</h3>
             <p className="text-slate-500 text-center text-sm mb-10 px-4 leading-relaxed">
               Please verify your identity to access the facial recognition database and photo galleries.
             </p>
             <button 
                onClick={() => router.push('/login')} 
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                Verify Identity
              </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // STATE 2: ACTIVE NEURAL GALLERY (Logged In)
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 antialiased">
       <nav className="flex justify-between items-center mb-16 max-w-7xl mx-auto bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">E</div>
            <span className="font-bold text-slate-900 tracking-tight">EventSnap Dashboard</span>
          </div>
          <div className="flex gap-3">
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 px-4 font-bold text-sm transition-all">
              Logout
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-3 rounded-2xl font-bold text-sm transition-all">
              Upload
            </button>
            <button onClick={() => setIsSmartSearchActive(!isSmartSearchActive)} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${isSmartSearchActive ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-900 text-white shadow-slate-300'}`}>
              {isSmartSearchActive ? "Neural Filter Active ✨" : "Run Smart Search"}
            </button>
          </div>
       </nav>

       <div className="max-w-7xl mx-auto pb-20">
         {photos.length === 0 ? (
           <div className="text-center py-20 text-slate-400">No photos found in the event database.</div>
         ) : (
           <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {photos.filter((p:any) => isSmartSearchActive ? p.is_dhruw : true).map((p:any, i) => (
                <PhotoCard key={i} filename={p.filename} isDhruw={p.is_dhruw} />
              ))}
           </div>
         )}
       </div>

       <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0]; if(!file) return;
          const fd = new FormData(); fd.append("file", file);
          const token = localStorage.getItem('userToken');
          await fetch("http://localhost:8000/api/photos/upload", { 
            method: "POST", 
            body: fd,
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchPhotos();
       }} />
    </main>
  );
}