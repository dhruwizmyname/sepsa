"use client"; // Next.js App Router ke liye zaroori hai

import { useState, useEffect } from 'react'; // Added useEffect
import { useParams, useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Download, Heart, Sparkles, Grid3x3, Eye } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { useAuth } from '../contexts/AuthContext';

// Mock photos data (Ye backend se aayega aage chalkar)
const allPhotos = [
  { id: '1', url: 'https://images.unsplash.com/photo-1764269719300-7094d6c00533?w=800', hasClient: true },
  { id: '2', url: 'https://images.unsplash.com/photo-1763951778440-13af353b122a?w=800', hasClient: false },
  { id: '3', url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800', hasClient: true },
  { id: '4', url: 'https://images.unsplash.com/photo-1656283384093-1e227e621fad?w=800', hasClient: false },
  { id: '5', url: 'https://images.unsplash.com/photo-1769618096619-834a3f28b807?w=800', hasClient: true },
  { id: '6', url: 'https://images.unsplash.com/photo-1686213011371-2aff28a08f16?w=800', hasClient: false },
  { id: '7', url: 'https://images.unsplash.com/photo-1763775594018-4a84eeadd83d?w=800', hasClient: true },
  { id: '8', url: 'https://images.unsplash.com/photo-1760822400484-d7e9e2c6aacc?w=800', hasClient: false },
  { id: '9', url: 'https://images.unsplash.com/photo-1769740333462-9a63bfa914bc?w=800', hasClient: true },
  { id: '10', url: 'https://images.unsplash.com/photo-1766950682292-73152266c25d?w=800', hasClient: false },
  { id: '11', url: 'https://images.unsplash.com/photo-1704830657561-a6a663931172?w=800', hasClient: true },
  { id: '12', url: 'https://images.unsplash.com/photo-1569342380852-035f42d9ca41?w=800', hasClient: false },
  { id: '13', url: 'https://images.unsplash.com/photo-1685435887020-eb43be863347?w=800', hasClient: true },
  { id: '14', url: 'https://images.unsplash.com/photo-1532498551838-b7a1cfac622e?w=800', hasClient: true },
  { id: '15', url: 'https://images.unsplash.com/photo-1571645163064-77faa9676a46?w=800', hasClient: false },
];

const eventDetails = {
  name: 'Summer Wedding 2026',
  date: '2026-06-15',
  photographer: 'Sarah Johnson',
};

export default function EventView() {
  const { eventId } = useParams();
  const router = useRouter();
  const { phone, loading } = useAuth(); // Destructuring loading from useAuth
  
  const [activeView, setActiveView] = useState<'all' | 'ai'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // LOOP BREAKER: Jab tak Auth load ho raha hai, tab tak kuch mat karo
  useEffect(() => {
    if (!loading && !phone) {
      router.push('/'); // Login page par bhej do agar auth fail ho jaye
    }
  }, [phone, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Authenticating Gallery...</p>
        </div>
      </div>
    );
  }

  // Agar user nahi hai, toh render mat karo (Redirect useEffect sambhaal lega)
  if (!phone) return null;

  const displayPhotos = activeView === 'all' 
    ? allPhotos 
    : allPhotos.filter(photo => photo.hasClient);

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2563eb]/10 flex items-center justify-center border-2 border-[#2563eb]">
                 <span className="text-xs font-bold text-[#2563eb]">{phone.slice(-2)}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{phone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{eventDetails.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{new Date(eventDetails.date).toLocaleDateString()}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  <span>by {eventDetails.photographer}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* View Toggle */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveView('all')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeView === 'all' ? 'bg-[#2563eb] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              All Photos ({allPhotos.length})
            </button>
            <button
              onClick={() => setActiveView('ai')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeView === 'ai' ? 'bg-gradient-to-r from-purple-600 to-[#2563eb] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI View ({allPhotos.filter(p => p.hasClient).length})
            </button>
          </div>

          {activeView === 'ai' && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-purple-900 mb-1">AI-Powered Face Recognition Active</p>
                <p className="text-sm text-purple-700">
                  AI filtered {allPhotos.filter(p => p.hasClient).length} photos where you were found.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Event Photos</p>
            <p className="text-2xl font-bold text-gray-900">{allPhotos.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Found You In</p>
            <p className="text-2xl font-bold text-purple-600">{allPhotos.filter(p => p.hasClient).length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Efficiency Match</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round((allPhotos.filter(p => p.hasClient).length / allPhotos.length) * 100)}%
            </p>
          </div>
        </div>

        {/* Photo Grid */}
        <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}>
          <Masonry gutter="20px">
            {displayPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                onMouseEnter={() => setHoveredId(photo.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedPhoto(photo.url)}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${photo.id}`}
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                />

                {photo.hasClient && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Found You
                  </div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredId === photo.id ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 hover:text-red-500 transition-colors" />
                        <Eye className="w-5 h-5 hover:text-blue-400 transition-colors" />
                      </div>
                      <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>

        {activeView === 'ai' && displayPhotos.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos found</h3>
            <p className="text-gray-600">AI couldn't find you in this event yet.</p>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button className="absolute top-6 right-6 text-white text-4xl">&times;</button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}