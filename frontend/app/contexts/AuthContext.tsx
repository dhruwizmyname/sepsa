"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  phone: string | null;
  role: 'user' | 'photographer' | null;
  loading: boolean; // Ye loop rokne ke liye zaroori hai
  login: (phone: string, role: 'user' | 'photographer') => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'photographer' | null>(null);
  const [loading, setLoading] = useState(true); // Default loading true rahega

  useEffect(() => {
    // Component mount hote hi localStorage check karo
    const savedPhone = localStorage.getItem("userPhone");
    const savedRole = localStorage.getItem("userRole") as 'user' | 'photographer' | null;

    if (savedPhone && savedRole) {
      setPhone(savedPhone);
      setRole(savedRole);
    }
    
    // Memory read hone ke baad loading false kar do
    setLoading(false);
  }, []);

  const login = (userPhone: string, userRole: 'user' | 'photographer') => {
    setPhone(userPhone);
    setRole(userRole);
    localStorage.setItem("userPhone", userPhone);
    localStorage.setItem("userRole", userRole);
  };

  const logout = () => {
    setPhone(null);
    setRole(null);
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userRole");
    // clear() ki jagah removeItem use karna safe hai taaki dusra data na ude
  };

  return (
    <AuthContext.Provider value={{ phone, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};