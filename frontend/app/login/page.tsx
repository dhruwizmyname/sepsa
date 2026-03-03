"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Phone, Shield, Upload, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  
  // -- Auth Context --
  const { login: executeLogin } = useAuth();

  // -- States --
  const [step, setStep] = useState<'phone' | 'otp' | 'selfie'>('phone');
  const [loading, setLoading] = useState(false);
  
  // User States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photographer States
  const [isPhotographerMode, setIsPhotographerMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ==========================================
  // USER LOGIN LOGIC
  // ==========================================
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep('otp'); 
    }
  };

  const handleOtpComplete = async (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleanValue);
    
    if (cleanValue.length === 6) {
      try {
        const res = await fetch(`http://localhost:8000/api/auth/check-user/${phone}`);
        const data = await res.json();

        if (data.exists) {
          localStorage.setItem("userPhone", phone);
          localStorage.setItem("userRole", "user");
          executeLogin(phone, "user"); 
          
          window.location.href = '/dashboard'; 
        } else {
          setStep('selfie');
        }
      } catch (err) {
        console.error("Failed to check user", err);
        setStep('selfie'); 
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSelfieSubmit = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("selfie", file);

    try {
      const res = await fetch("http://localhost:8000/api/auth/verify-selfie", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        localStorage.setItem("userPhone", phone);
        localStorage.setItem("userRole", "user");
        executeLogin(phone, "user"); 
        
        window.location.href = '/dashboard'; 
      } else {
        alert("Face could not be detected. Try a clear, straight photo.");
        setSelfiePreview(null);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. PHOTOGRAPHER LOGIN LOGIC
  // ==========================================
  const handlePhotoLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch("http://localhost:8000/api/auth/photographer-login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        // Photographer User
        localStorage.setItem("userPhone", email);
        localStorage.setItem("userRole", "photographer"); 
        
        executeLogin(email, "photographer");
        
        // 👇 YAHAN '/photographer' KAR DIYA HAI 👇
        window.location.href = '/photographer'; 
      } else {
        alert(data.detail || "Login failed! Check your email/password.");
      }
    } catch (err) {
      console.error("Connection Error:", err);
      alert("Backend se connection nahi ho paa raha hai.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 font-['Inter',sans-serif]">
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#2563eb] rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-[120px] opacity-15"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-lg shadow-lg border border-white/40 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">EventSnap</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 z-10 relative">
          
          {/* PHONE / EMAIL STEP */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isPhotographerMode ? <Shield className="w-8 h-8 text-[#2563eb]" /> : <Phone className="w-8 h-8 text-[#2563eb]" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isPhotographerMode ? "Photographer Login" : "Welcome Back"}
                </h2>
                <p className="text-gray-600">
                  {isPhotographerMode ? "Enter credentials to manage events" : "Enter mobile number to continue"}
                </p>
              </div>

              <form onSubmit={isPhotographerMode ? handlePhotoLoginSubmit : handlePhoneSubmit} className="space-y-4">
                {isPhotographerMode ? (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-gray-900"
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-gray-900"
                      required
                    />
                  </>
                ) : (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 0000000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-gray-900"
                    required
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? "Verifying..." : (isPhotographerMode ? "Login" : "Send OTP")}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
              
              {!isPhotographerMode && (
                <button
                  type="button"
                  onClick={() => setIsPhotographerMode(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all font-medium"
                >
                  Are you a Photographer? Login here
                </button>
              )}
              
              {isPhotographerMode && (
                <button
                  type="button"
                  onClick={() => setIsPhotographerMode(false)}
                  className="w-full text-blue-600 text-sm font-medium hover:underline"
                >
                  Back to User Login
                </button>
              )}
            </div>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[#2563eb]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                <p className="text-gray-600">
                  Enter the 6-digit code sent to<br />
                  <span className="font-medium text-gray-900">{phone}</span>
                </p>
              </div>

              <div className="flex justify-center">
                <input 
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => handleOtpComplete(e.target.value)}
                  placeholder="000000"
                  className="w-full max-w-[200px] text-center text-3xl font-bold tracking-[0.5em] px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#2563eb] text-gray-900"
                />
              </div>

              <button
                onClick={() => setStep('phone')}
                className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all"
              >
                Back
              </button>
            </div>
          )}

          {/* SELFIE STEP */}
          {step === 'selfie' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-[#2563eb]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Upload Your Photo</h2>
                <p className="text-gray-600 text-sm">
                  Our AI will scan event photos and show you only the ones you're in!
                </p>
              </div>

              <div className="space-y-4">
                {selfiePreview ? (
                  <div className="relative">
                    <img src={selfiePreview} alt="Selfie preview" className="w-full aspect-square object-cover rounded-2xl border-4 border-[#2563eb]/20" />
                    <button onClick={() => setSelfiePreview(null)} className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold mb-2">Click to upload or take a photo</p>
                    <p className="text-sm text-gray-500">JPG, PNG up to 5MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              {selfiePreview && (
                <button onClick={handleSelfieSubmit} disabled={loading} className="w-full py-4 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? "Processing AI..." : "Complete Setup & Find My Photos"}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              )}

              <button onClick={() => setStep('otp')} className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all">
                Back
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}