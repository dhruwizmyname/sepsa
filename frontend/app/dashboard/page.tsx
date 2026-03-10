"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Image as ImageIcon, Loader2, ChevronLeft, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MatchedPhoto {
  url: string;
  thumbnail: string;
  filename: string;
}

interface EventPhoto {
  full_url: string;
  thumbnail: string;
  filename: string;
}

interface EventInfo {
  name: string;
  date: string;
  photos: number;
  thumbnail: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const { phone, role, loading: authLoading, logout } = useAuth();

  const [events, setEvents] = useState<EventInfo[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [allPhotos, setAllPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!phone || role !== 'user')) {
      router.push('/login');
    }
  }, [phone, role, authLoading, router]);

  // Fetch events list
  useEffect(() => {
    if (!phone) return;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/photographer/events');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [phone]);

  // Fetch photos when an event is selected
  useEffect(() => {
    if (!selectedEvent || !phone) return;
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        // 1. Fetch AI Matched Photos for this user
        const matchedRes = await fetch(`http://localhost:8000/api/photos?phone=${encodeURIComponent(phone)}`);
        const matchedData = await matchedRes.json();
        setMatchedPhotos(matchedData.photos || []);

        // 2. Fetch All Event Photos
        const allRes = await fetch(`http://localhost:8000/api/photographer/photos?event_name=${encodeURIComponent(selectedEvent)}`);
        const allData = await allRes.json();
        setAllPhotos(allData.photos || []);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [selectedEvent, phone]);

  if (authLoading || (!phone && !authLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (loading && !selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 animate-pulse">Loading events...</p>
      </div>
    );
  }

  // Event list view
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
              <p className="text-gray-500 text-sm mt-1">Logged in as {phone}</p>
            </div>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Select an Event</h2>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <button
                  key={event.name}
                  onClick={() => { setSelectedEvent(event.name); setActiveTab('all'); }}
                  className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden text-left"
                >
                  <img src={event.thumbnail} alt={event.name} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg">{event.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {event.date && event.date}
                      {event.photos > 0 && ` · ${event.photos} photos`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
              <p className="text-gray-400">No events available yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Event photos view
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header & Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => { setSelectedEvent(null); setMatchedPhotos([]); setAllPhotos([]); }}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Events
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Event: {selectedEvent}</h1>
          
          <div className="flex gap-4 border-b">
            <button 
              onClick={() => setActiveTab('matched')}
              className={`pb-3 px-4 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'matched' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Your Photos ({matchedPhotos.length})
            </button>
            <button 
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-4 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              All Photos ({allPhotos.length})
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-500 animate-pulse">AI is organizing your memories...</p>
          </div>
        ) : activeTab === 'matched' ? (
          <div>
            {matchedPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {matchedPhotos.map((photo, idx) => (
                  <img key={idx} src={photo.url} alt={photo.filename} className="rounded-xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer" />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                <p className="text-gray-400">AI couldn&apos;t find your face yet. Check back in a few minutes or view All Photos.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allPhotos.map((photo, idx) => (
                  <img key={idx} src={photo.full_url} alt={photo.filename} className="rounded-xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer" />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                <p className="text-gray-400">No photos uploaded for this event yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}