import { useNavigate } from 'react-router';
import { Camera, Calendar, Image as ImageIcon, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Mock events data
const mockEvents = [
  {
    id: '1',
    name: 'Summer Wedding 2026',
    date: '2026-06-15',
    totalPhotos: 245,
    aiPhotos: 42,
    thumbnail: 'https://images.unsplash.com/photo-1764269719300-7094d6c00533?w=400',
    photographer: 'Sarah Johnson',
  },
  {
    id: '2',
    name: 'Corporate Annual Meet',
    date: '2026-05-20',
    totalPhotos: 180,
    aiPhotos: 28,
    thumbnail: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400',
    photographer: 'Sarah Johnson',
  },
  {
    id: '3',
    name: 'Birthday Bash',
    date: '2026-04-10',
    totalPhotos: 156,
    aiPhotos: 35,
    thumbnail: 'https://images.unsplash.com/photo-1763951778440-13af353b122a?w=400',
    photographer: 'Mike Photography',
  },
  {
    id: '4',
    name: 'Music Festival 2026',
    date: '2026-03-22',
    totalPhotos: 312,
    aiPhotos: 67,
    thumbnail: 'https://images.unsplash.com/photo-1656283384093-1e227e621fad?w=400',
    photographer: 'Sarah Johnson',
  },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/client/event/${eventId}`);
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
              <p className="text-sm text-gray-600">My Events</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user?.selfieUrl && (
              <img
                src={user.selfieUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#2563eb]"
              />
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600">{user?.phone}</p>
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
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-3xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
              <p className="text-blue-100 text-lg">
                AI found {mockEvents.reduce((sum, e) => sum + e.aiPhotos, 0)} photos of you across{' '}
                {mockEvents.length} events - no need to scroll through{' '}
                {mockEvents.reduce((sum, e) => sum + e.totalPhotos, 0)} photos manually!
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockEvents.length}</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mockEvents.reduce((sum, e) => sum + e.totalPhotos, 0)}
                </p>
                <p className="text-sm text-gray-600">All Photos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mockEvents.reduce((sum, e) => sum + e.aiPhotos, 0)}
                </p>
                <p className="text-sm text-gray-600">Your Photos (AI)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Events</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={event.thumbnail}
                    alt={event.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* AI Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    {event.aiPhotos} AI Matches
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    {event.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>{event.totalPhotos} total photos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>by {event.photographer}</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2 px-4 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium transition-colors">
                    View Photos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State (if no events) */}
        {mockEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600">
              Events shared with you by photographers will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}