"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Phone, Lock, Sparkles, Loader2, Mail, UserSquare2, Upload, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, phone, role, loading } = useAuth();
  
  const [loginMode, setLoginMode] = useState<'user' | 'photographer'>('user');
  const [loggingIn, setLoggingIn] = useState(false);

  // --- USER STATES ---
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Selfie Upload
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PHOTOGRAPHER STATES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🛡️ Gatekeeper
  useEffect(() => {
    if (!loading && phone && role) {
      router.push(role === 'photographer' ? '/photographer' : '/dashboard');
    }
  }, [phone, role, loading, router]);

  // ==========================================
  // USER LOGIN LOGIC
  // ==========================================
  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) return alert("Valid 10-digit number dalo bhai!");
    setStep(2);
  };

  const handleVerifyOTP = async () => {
    setLoggingIn(true);
    try {
      // 1. Check if user already exists in backend
      const res = await fetch(`http://localhost:8000/api/auth/check-user/${phoneNumber}`);
      const data = await res.json();

      if (data.exists) {
        // Purana user hai, seedha login karo
        login(phoneNumber, 'user');
      } else {
        // Naya user hai, selfie mangni padegi
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      alert("Verification failed. Backend running hai?");
    } finally {
      setLoggingIn(false);
    }
  };

  // --- SELFIE UPLOAD LOGIC ---
  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieSubmit = async () => {
    if (!selfieFile) return;
    setLoggingIn(true);
    try {
      const formData = new FormData();
      formData.append("phone", phoneNumber);
      formData.append("selfie", selfieFile);

      const res = await fetch("http://localhost:8000/api/auth/verify-selfie", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Selfie save ho gayi, ab login complete karo
        login(phoneNumber, 'user');
      } else {
        alert("❌ Face not clear. Please upload a clear selfie.");
        setSelfieFile(null);
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload selfie.");
    } finally {
      setLoggingIn(false);
    }
  };

  // ==========================================
  // PHOTOGRAPHER LOGIN LOGIC
  // ==========================================
  const handlePhotographerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/api/auth/photographer-login", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        login(email, 'photographer');
      } else {
        alert("❌ Invalid email or password");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Backend connection failed.");
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Checking Session...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center shadow-xl mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">EventSnap AI</h1>
          <p className="text-gray-500 mt-2">Relive your moments instantly</p>
        </div>

        {/* Mode Toggle (Hide during Selfie step) */}
        {step < 3 && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setLoginMode('user')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginMode === 'user' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Guest / User
            </button>
            <button
              onClick={() => setLoginMode('photographer')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginMode === 'photographer' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Photographer
            </button>
          </div>
        )}

        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
          {loginMode === 'user' ? (
            /* USER LOGIN FLOW */
            step === 1 ? (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input type="tel" placeholder="Enter 10 digit number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2563eb] outline-none text-gray-900 bg-white" />
                  </div>
                </div>
                <button onClick={handleSendOTP} className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold shadow-lg hover:bg-[#1d4ed8] transition-all">
                  Send Verification Code
                </button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Enter 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2563eb] outline-none text-gray-900 bg-white" />
                  </div>
                </div>
                <button onClick={handleVerifyOTP} disabled={loggingIn} className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                  {loggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  {loggingIn ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-sm text-[#2563eb] hover:underline font-medium">Change Phone Number</button>
              </div>
            ) : (
              /* STEP 3: SELFIE UPLOAD */
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Let AI Find You</h3>
                  <p className="text-sm text-gray-500 mt-1">Upload a clear selfie so our AI can find your photos in the event gallery.</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Selfie Preview" className="w-32 h-32 object-cover rounded-full mx-auto shadow-md" />
                  ) : (
                    <div className="py-6">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Tap to take selfie or upload</p>
                    </div>
                  )}
                  {/* Note: capture="user" opens front camera directly on mobile */}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieSelect} />
                </div>

                <button 
                  onClick={handleSelfieSubmit} 
                  disabled={!selfieFile || loggingIn}
                  className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold shadow-lg hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  {loggingIn ? 'Analyzing Face...' : 'Find My Photos'}
                </button>
              </div>
            )
          ) : (
            /* PHOTOGRAPHER LOGIN FLOW (Kept identical to previous) */
            <form onSubmit={handlePhotographerLogin} className="space-y-6 animate-in fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input type="email" required placeholder="admin@eventsnap.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2563eb] outline-none text-gray-900 bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2563eb] outline-none text-gray-900 bg-white" />
                </div>
              </div>
              <button type="submit" disabled={loggingIn} className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold shadow-lg hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2">
                {loggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : <UserSquare2 className="w-5 h-5" />}
                {loggingIn ? 'Authenticating...' : 'Login as Photographer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}