"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserGallery() {
  const router = useRouter();
  const { logout } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const phone = localStorage.getItem("userPhone");
    if (!phone) {
      router.push('/login');
      return;
    }

    // Fetch User Photos from backend
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/photos?phone=${phone}`);
        const data = await res.json();
        
        if (data.photos) {
            setPhotos(data.photos);
        }
      } catch (err) {
        console.error("Error fetching photos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">EventSnap</h1>
              <p className="text-sm text-gray-600">My Gallery</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-600"
          >
            <span className="hidden sm:inline text-sm font-medium">Logout</span>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Personal Event Photos</h2>
        
        {loading ? (
           <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
           </div>
        ) : photos.length === 0 ? (
           <div className="text-center bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
             <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-gray-900">No photos found yet</h3>
             <p className="text-gray-500">Wait for the photographer to upload more photos.</p>
           </div>
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photoUrl, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Backend ka pura URL lagana padega agar image relative hai */}
                  <img 
                    src={`http://localhost:8000${photoUrl}`} 
                    alt={`Event Photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
           </div>
        )}
      </main>
    </div>
  );
}