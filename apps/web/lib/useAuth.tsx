"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getMe } from './api';
import type { UserMeResponseDto } from 'event-types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserMeResponseDto | null;
  isLoading: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  isAdmin: boolean;
  isLeader: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMeResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await getMe();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user session:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  const isSeller = user?.role === 'SELLER';
  const isBuyer = user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN';
  const isLeader = Boolean(
    isSeller && 
    user?.seller?.tribe && 
    (user.seller.tribe.primaryLeaderId === user.id || user.seller.tribe.secondaryLeaderId === user.id)
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, isSeller, isBuyer, isAdmin, isLeader, refreshUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
