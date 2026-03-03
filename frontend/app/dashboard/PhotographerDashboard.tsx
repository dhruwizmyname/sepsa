"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Next.js ka router
import { Camera, Upload, Users, Calendar, LogOut, Plus, Check } from 'lucide-react';

// Mock data for clients
const mockClients = [
  { id: '1', name: 'John Doe', phone: '+1 555 0101' },
  { id: '2', name: 'Jane Smith', phone: '+1 555 0102' },
  { id: '3', name: 'Mike Johnson', phone: '+1 555 0103' },
];

export default function PhotographerDashboard() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter(); // React-router ki jagah Next.js ka router

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedPhotos((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleCreateEvent = () => {
    if (eventName && eventDate && selectedClients.length > 0 && uploadedPhotos.length > 0) {
      alert(`Event "${eventName}" created successfully with ${uploadedPhotos.length} photos for ${selectedClients.length} clients!`);
      // Reset form
      setEventName('');
      setEventDate('');
      setSelectedClients([]);
      setUploadedPhotos([]);
      setShowUploadForm(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear(); // Session clear
    router.push('/login'); // Login par wapas
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
              <p className="text-sm text-gray-600">Photographer Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-600">Photographer</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">48</p>
                <p className="text-sm text-gray-600">Active Clients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2,456</p>
                <p className="text-sm text-gray-600">Photos Uploaded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload New Event / Form Section */}
        {!showUploadForm ? (
          <button
            onClick={() => setShowUploadForm(true)}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-medium shadow-lg hover:shadow-xl transition-all mb-8 flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Event Photos</h2>

            <div className="space-y-6">
              {/* Event Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Summer Wedding 2026"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              {/* Select Clients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Share with Clients (They can invite their family & friends)
                </label>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {mockClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedClients.includes(client.id)
                          ? 'border-[#2563eb] bg-[#2563eb]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-600">{client.phone}</p>
                        </div>
                        {selectedClients.includes(client.id) && (
                          <div className="w-6 h-6 rounded-full bg-[#2563eb] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Photos ({uploadedPhotos.length} selected)
                </label>
                
                {uploadedPhotos.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Click to upload event photos</p>
                    <p className="text-sm text-gray-500">Support multiple files, JPG, PNG</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-4">
                      {uploadedPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Upload ${index + 1}`}
                          className="aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-[#2563eb] hover:underline"
                    >
                      Add more photos
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateEvent}
                  disabled={!eventName || !eventDate || selectedClients.length === 0 || uploadedPhotos.length === 0}
                  className="flex-1 py-3 px-6 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Event & Upload
                </button>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Events (Static Mock Data for now) */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Events</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Summer Wedding 2026',
                date: '2026-06-15',
                photos: 245,
                clients: 3,
                thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
              },
              {
                name: 'Corporate Annual Meet',
                date: '2026-05-20',
                photos: 180,
                clients: 5,
                thumbnail: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400',
              },
              {
                name: 'Birthday Bash',
                date: '2026-04-10',
                photos: 156,
                clients: 2,
                thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8892f07bea?w=400',
              },
            ].map((event, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
              >
                <img src={event.thumbnail} alt={event.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{event.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      <span>{event.photos}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{event.clients}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}