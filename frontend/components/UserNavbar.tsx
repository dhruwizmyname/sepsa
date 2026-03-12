"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, X, Save, Loader2 } from "lucide-react";
import { useAuth } from "../app/contexts/AuthContext";

interface ProfileData {
  name: string;
  email: string;
  city: string;
  selfie_url: string | null;
}

export default function UserNavbar() {
  const router = useRouter();
  const { phone, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({ name: "", email: "", city: "", selfie_url: null });
  const [showPanel, setShowPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", city: "" });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phone) return;
    fetch(`http://localhost:8000/api/user/profile/${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => {
        // Add cache-buster to selfie URL to avoid stale browser cache
        const selfieUrl = data.selfie_url ? `${data.selfie_url}?t=${Date.now()}` : null;
        setProfile({ ...data, selfie_url: selfieUrl });
        setForm({ name: data.name || "", email: data.email || "", city: data.city || "" });
      })
      .catch(console.error);
  }, [phone]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPanel]);

  const handleSave = async () => {
    if (!phone) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("city", form.city);
      const res = await fetch(`http://localhost:8000/api/user/profile/${encodeURIComponent(phone)}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setProfile((prev) => ({ ...prev, ...form }));
        setShowPanel(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile.name || phone || "User";

  return (
    <div className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: App Name */}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">EventSnap AI</h1>

        {/* Right: Profile + Logout */}
        <div className="flex items-center gap-4 relative">
          {/* Profile Button */}
          <button
            onClick={() => setShowPanel((v) => !v)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1.5 transition-colors"
          >
            {profile.selfie_url ? (
              <img
                src={profile.selfie_url}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
              {displayName}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Profile Dropdown Panel */}
          {showPanel && (
            <div
              ref={panelRef}
              className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border p-5 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">My Profile</h3>
                <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Photo */}
              <div className="flex justify-center mb-4">
                {profile.selfie_url ? (
                  <img
                    src={profile.selfie_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100">
                    <User className="w-10 h-10 text-blue-300" />
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-gray-400 mb-4">{phone}</p>

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
                  <input
                    type="text"
                    placeholder="Your city"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Details"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
