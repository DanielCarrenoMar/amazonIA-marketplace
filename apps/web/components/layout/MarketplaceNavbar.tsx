"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Heart } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CartDrawer } from '../ui/CartDrawer';
import { getMe, type AuthUser } from '@/lib/api';
import logo from '@/public/logo.png';

export function MarketplaceNavbar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getMe(token).then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  };

  const getInitials = (name: string) => name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo */}
          <Link href="/marketplace" className="flex items-center gap-3 shrink-0 group">
            <img src={logo.src} alt="AmazonIA" className="h-10 w-10 rounded-full shadow-sm group-hover:scale-105 transition-transform" />
            <span className="font-medium text-xl text-slate-900 hidden sm:block tracking-tight group-hover:text-brand-primary transition-colors">
              Marketplace Artesanal
            </span>
          </Link>

          {/* Search Bar (Center) */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center">
            <Input 
              leftIcon={<Search className="w-5 h-5 text-gray-400" />}
              placeholder="Buscar artesanías, ropa, hogar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus-within:z-10"
              wrapperClassName="rounded-l-full rounded-r-none border-r-0 bg-gray-50/80 shadow-inner border-gray-200 focus-within:bg-white focus-within:border-brand-primary/30 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all"
            />
            <Button 
              className="rounded-l-none rounded-r-full px-8 h-[46px] shadow-sm font-bold tracking-wide"
              variant="primary"
            >
              Buscar
            </Button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            
            {/* User */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 hover:bg-gray-50 rounded-full py-1.5 px-2 md:px-3 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-secondary flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
                    {getInitials(user.fullName || user.username)}
                  </div>
                  <span className="text-sm font-bold text-slate-700 hidden lg:block">
                    {user.fullName?.split(' ')[0] || user.username}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-nature-bg hover:text-brand-primary transition-colors">Mi Cuenta</Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">Cerrar sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex gap-2 items-center">
                <Link href="/login"><Button variant="ghost" size="sm" className="font-bold text-slate-600 hover:text-slate-900">Entrar</Button></Link>
                <Link href="/register"><Button variant="primary" size="sm" className="rounded-full px-5 font-bold shadow-sm">Crear cuenta</Button></Link>
              </div>
            )}

            {/* Favorites */}
            <Link href="/marketplace/favorites" className="relative p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer border border-gray-200 bg-white shadow-sm flex items-center justify-center">
              <Heart className="w-[22px] h-[22px]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                3
              </span>
            </Link>

            {/* Cart */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-2.5 text-slate-600 hover:text-brand-primary hover:bg-brand-nature-bg rounded-full transition-colors cursor-pointer border border-gray-200 bg-white shadow-sm"
            >
              <ShoppingCart className="w-[22px] h-[22px]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                3
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Bottom row on mobile) */}
        <div className="md:hidden px-4 pb-4">
          <div className="flex w-full items-center">
            <Input 
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              wrapperClassName="rounded-l-full rounded-r-none border-r-0 bg-gray-50/80"
              className="h-[42px]"
            />
            <Button className="rounded-l-none rounded-r-full px-5 h-[42px] shadow-sm" variant="primary">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Cart Drawer Instance */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
