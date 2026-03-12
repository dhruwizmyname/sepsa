"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Users, Calendar, LogOut, Plus, Check, Loader2, Trash2, Activity } from 'lucide-react';
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
  
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // 1. Role Check & Fetch Events from Backend
  useEffect(() => {
    if (!authLoading && (!phone || role !== 'photographer')) {
      router.push('/');
      return;
    }

    if (role === 'photographer') {
      fetch("http://localhost:8000/api/photographer/events")
        .then(res => res.json())
        .then(data => {
          if (data.events) setLiveEvents(data.events);
        })
        .catch(err => console.error("Error fetching events:", err));
    }
  }, [authLoading, role, phone, router]);

  // 🌟 NAYA LOGIC: Folder se sirf images filter karna aur RAM bachana
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Sirf image files ko filter karo (folders mein kachra bhi hota hai)
      const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      
      // Browser hang na ho, isliye preview sirf shuru ki 10 photos ka dikhayenge
      const previewFiles = newFiles.slice(0, 10); 
      previewFiles.forEach((file) => {
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
      // Step A: Create the event record in backend
      await fetch("http://localhost:8000/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName,
          date: eventDate || new Date().toISOString().split("T")[0],
          clients: selectedClients.length,
          photos: selectedFiles.length,
        }),
      });

      // 🌟 NAYA LOGIC: Bulk Upload (Ek parcel mein saari photos)
      const formData = new FormData();
      formData.append("event_name", eventName);
      selectedFiles.forEach(file => {
        formData.append("files", file); // Dhyan dein: 'files' key use hua hai (Backend ke hisaab se)
      });

      await fetch("http://localhost:8000/api/photographer/upload", {
        method: "POST",
        body: formData,
      });

      // Step C: Refresh Events list dynamically
      const res = await fetch("http://localhost:8000/api/photographer/events");
      const data = await res.json();
      if(data.events) setLiveEvents(data.events);

      alert(`🎉 Success! ${selectedFiles.length} photos uploaded to Google Drive & Scanning started!`);
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

  const handleDeleteEvent = async (eventName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${eventName}" and all its photos? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/events/${encodeURIComponent(eventName)}`, { method: 'DELETE' });
      if (res.ok) {
        setLiveEvents(prev => prev.filter(ev => ev.name !== eventName));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete event.');
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
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/photographer/monitor')} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" /> Pipeline Monitor
            </button>
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

              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-[#2563eb] transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium mb-4">Select photos or a folder to upload</p>
                <div className="flex items-center justify-center gap-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-[#2563eb] text-white rounded-lg font-bold hover:bg-[#1d4ed8] transition-colors">
                    Select Photos
                  </button>
                  <button type="button" onClick={() => folderInputRef.current?.click()} className="px-6 py-2.5 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors">
                    Select Folder
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">{selectedFiles.length > 0 ? `${selectedFiles.length} photos selected` : 'Supports multiple photos or entire folders'}</p>
                
                {/* Individual photo selection */}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
                {/* Folder selection */}
                <input 
                  ref={folderInputRef} 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
              </div>

              {previews.length > 0 && (
                <div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
                    {previews.map((src, i) => <img key={i} src={src} className="aspect-square object-cover rounded-lg border border-gray-100" />)}
                  </div>
                  {selectedFiles.length > 10 && <p className="text-xs text-center text-gray-500">Showing first 10 previews only (+{selectedFiles.length - 10} more)</p>}
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={handleCreateAndUpload} disabled={uploading || !eventName || selectedFiles.length === 0} className="flex-1 py-4 bg-[#2563eb] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="animate-spin" /> : <Check />}
                  {uploading ? 'Uploading to Drive...' : `Complete Upload (${selectedFiles.length} Photos)`}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#2563eb] transition-colors">{event.name}</h3>
                      <p className="text-xs text-gray-500">{event.photos} Photos • {event.clients} Clients notified</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteEvent(event.name, e)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}