"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Download, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function EventGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  
  const eventName = decodeURIComponent(params.id as string);
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role !== 'photographer') {
      router.push('/');
      return;
    }

   // Fetch photos from backend
    // Fetch photos from backend
    const fetchPhotos = async () => {
      try {
        // 🌟 NAYA: Backticks (`) aur cache: 'no-store' use kiya hai
        const res = await fetch(`http://localhost:8000/api/photographer/photos?event_name=${encodeURIComponent(eventName)}`, {
          cache: 'no-store' // <-- NEXT.JS KO CACHE USE KARNE SE ROKNE KE LIYE
        });
        
        const data = await res.json();
        if (data.photos) {
          setPhotos(data.photos);
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setLoading(false);
      }
    };
//---------------------------------------------
    fetchPhotos();
  }, [authLoading, role, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-gray-500 font-medium">Loading High-Speed Gallery...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/photographer')}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2563eb] transition-colors mb-4 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{eventName}</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {photos.length} Photos Uploaded
              </p>
            </div>
            <button className="px-6 py-2.5 bg-[#2563eb] text-white rounded-lg font-bold hover:bg-[#1d4ed8] transition-colors shadow-md">
              Share Link
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {photos.length === 0 ? (
           <div className="text-center bg-white rounded-3xl p-16 shadow-sm border border-gray-100 mt-10">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-gray-300" />
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos found</h3>
             <p className="text-gray-500">You haven't uploaded any photos for this event yet.</p>
           </div>
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <div 
                  key={index} 
                  className="group relative aspect-square bg-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPhoto(photo.full_url)} // Click karne par Full HD photo khulegi
                >
                  {/* Grid mein sirf 50KB wala thumbnail load hoga = SUPER FAST SPEED */}
                  <img 
                    src={photo.thumbnail} 
                    alt={`Photo ${index + 1}`} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                        <Eye className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                        <Download className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
           </div>
        )}
      </main>

      {/* Lightbox for Full HD Photo */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <button className="absolute top-6 right-6 text-white text-4xl hover:text-gray-400 transition-colors">&times;</button>
          <img
            src={selectedPhoto}
            alt="Full size High Definition"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}