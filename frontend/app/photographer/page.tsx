"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Users, Calendar, LogOut, Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Mock data for clients
const mockClients = [
  { id: '1', name: 'John Doe', phone: '+1 555 0101' },
  { id: '2', name: 'Jane Smith', phone: '+1 555 0102' },
  { id: '3', name: 'Mike Johnson', phone: '+1 555 0103' },
];

export default function PhotographerDashboard() {
  const router = useRouter();
  const { role, loading: authLoading, phone, logout } = useAuth();
  
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 🌟 NAYA: Database se events yahan aayenge
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Role Check & Fetch Events from Backend
  useEffect(() => {
    if (!authLoading && (!phone || role !== 'photographer')) {
      router.push('/');
      return;
    }

    // Backend se events load karo
    if (role === 'photographer') {
      fetch("http://localhost:8000/api/photographer/events")
        .then(res => res.json())
        .then(data => {
          if (data.events) setLiveEvents(data.events);
        })
        .catch(err => console.error("Error fetching events:", err));
    }
  }, [authLoading, role, phone, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleCreateAndUpload = async () => {
    setUploading(true);
    try {
      // Step A: Upload photos to backend
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("event_name", eventName); // <-- Yeh line hona zaroori hai

        await fetch("http://localhost:8000/api/photographer/upload", {
          method: "POST",
          body: formData,
        });
      }

      // Step C: Refresh Events list dynamically
      const res = await fetch("http://localhost:8000/api/photographer/events");
      const data = await res.json();
      if(data.events) setLiveEvents(data.events);

      alert("🎉 Success! Event created and scanning started.");
      setShowUploadForm(false);
      setPreviews([]);
      setSelectedFiles([]);
      setEventName('');
      setSelectedClients([]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("❌ Upload failed. Check if backend is running.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || role !== 'photographer') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-[#2563eb]" /></div>;
  }

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
              <p className="text-sm text-gray-600">Photographer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dynamic Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <p className="text-sm text-gray-500 mb-1">Total Events</p>
             <p className="text-3xl font-bold text-gray-900">{liveEvents.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <p className="text-sm text-gray-500 mb-1">Total Uploads</p>
             <p className="text-3xl font-bold text-[#2563eb]">
               {liveEvents.reduce((sum, event) => sum + event.photos, 0)}
             </p>
          </div>
        </div>

        {!showUploadForm ? (
          <button onClick={() => setShowUploadForm(true)} className="w-full py-6 rounded-2xl bg-[#2563eb] text-white font-bold shadow-lg hover:bg-[#1d4ed8] transition-all mb-8 flex items-center justify-center gap-3">
            <Plus className="w-6 h-6" /> Start New Event Upload
          </button>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details & Upload</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input type="text" placeholder="Event Name (e.g., Holi 2026)" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2563eb] outline-none" />
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2563eb] outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Clients</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mockClients.map((client) => (
                    <button key={client.id} onClick={() => toggleClient(client.id)} className={`p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center ${selectedClients.includes(client.id) ? 'border-[#2563eb] bg-[#2563eb]/5' : 'border-gray-100'}`}>
                      <span>{client.name}</span>
                      {selectedClients.includes(client.id) && <Check className="w-4 h-4 text-[#2563eb]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#2563eb] transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Click to select event photos</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {previews.map((src, i) => <img key={i} src={src} className="aspect-square object-cover rounded-lg border border-gray-100" />)}
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={handleCreateAndUpload} disabled={uploading || !eventName || selectedFiles.length === 0} className="flex-1 py-4 bg-[#2563eb] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="animate-spin" /> : <Check />}
                  {uploading ? 'Uploading & Saving...' : 'Complete Event Creation'}
                </button>
                <button onClick={() => setShowUploadForm(false)} className="px-8 py-4 bg-gray-100 rounded-xl font-bold">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Dynamic Database Feeds */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Live Event Feeds</h2>
        {liveEvents.length === 0 ? (
          <p className="text-gray-500">No events created yet. Start uploading!</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
             {liveEvents.map((event, idx) => (
               <div 
                 key={idx} 
                 // NAYA: Click handler add kiya hai
                 onClick={() => router.push(`/photographer/event/${encodeURIComponent(event.name)}`)}
                 className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:border-[#2563eb] transition-all duration-300 animate-in fade-in zoom-in-95 group"
               >
                  <div className="aspect-video bg-gray-200 rounded-xl mb-3 overflow-hidden">
                    <img 
                      src={event.thumbnail} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={event.name} 
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-[#2563eb] transition-colors">{event.name}</h3>
                  <p className="text-xs text-gray-500">{event.photos} Photos • {event.clients} Clients notified</p>
               </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}