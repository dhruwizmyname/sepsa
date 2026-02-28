"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Phone, Shield, Upload, ArrowRight } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp' | 'selfie'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      // Mock OTP sent
      setStep('otp');
    }
  };

  const handleOtpComplete = (value: string) => {
    // Only allow numbers and max 6 digits
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleanValue);
    
    if (cleanValue.length === 6) {
      // Mock OTP verification delay
      setTimeout(() => {
        setStep('selfie');
      }, 500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieSubmit = () => {
    if (selfiePreview) {
      // Redirect User/Client to the Main Gallery (Home page)
      alert("Selfie registered! Redirecting to your photos...");
      router.push('/');
    }
  };

  const handlePhotographerLogin = () => {
    // Redirect Photographer to their Dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 font-['Inter',sans-serif]">
      {/* Background effects */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#2563eb] rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-[120px] opacity-15"></div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-lg shadow-lg border border-white/40 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">EventSnap</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 z-10 relative">
          
          {/* Client Login Flow */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#2563eb]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-600">Enter your mobile number to continue</p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-gray-900 font-medium tracking-wide"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={handlePhotographerLogin}
                className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all flex items-center justify-center gap-2"
              >
                Login as Photographer
                <Shield className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[#2563eb]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                <p className="text-gray-600">
                  Enter the 6-digit code sent to
                  <br />
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
                  className="w-full max-w-[200px] text-center text-3xl font-bold tracking-[0.5em] px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#2563eb] text-gray-900 transition-colors"
                />
              </div>

              <div className="text-center">
                <button className="text-sm text-[#2563eb] hover:underline font-medium">
                  Resend OTP
                </button>
              </div>

              <button
                onClick={() => setStep('phone')}
                className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all"
              >
                Back
              </button>
            </div>
          )}

          {/* Selfie Upload */}
          {step === 'selfie' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-[#2563eb]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Upload Your Photo</h2>
                <p className="text-gray-600 text-sm">
                  Our AI will scan event photos and show you only the ones you're in - saving you hours of searching!
                </p>
              </div>

              <div className="space-y-4">
                {selfiePreview ? (
                  <div className="relative">
                    <img
                      src={selfiePreview}
                      alt="Selfie preview"
                      className="w-full aspect-square object-cover rounded-2xl border-4 border-[#2563eb]/20"
                    />
                    <button
                      onClick={() => setSelfiePreview(null)}
                      className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all"
                  >
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold mb-2">
                      Click to upload or take a photo
                    </p>
                    <p className="text-sm text-gray-500">JPG, PNG up to 5MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selfiePreview && (
                <button
                  onClick={handleSelfieSubmit}
                  className="w-full py-4 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Complete Setup & Find My Photos
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setStep('otp')}
                className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all"
              >
                Back
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}