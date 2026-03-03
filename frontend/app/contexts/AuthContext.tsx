"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  phone: string | null;
  role: 'user' | 'photographer' | null;
  login: (phone: string, role: 'user' | 'photographer') => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'photographer' | null>(null);

  useEffect(() => {
    // Browser load hote hi check karo purani memory
    const savedPhone = localStorage.getItem("userPhone");
    const savedRole = localStorage.getItem("userRole") as 'user' | 'photographer';
    if (savedPhone && savedRole) {
      setPhone(savedPhone);
      setRole(savedRole);
    }
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
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ phone, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};