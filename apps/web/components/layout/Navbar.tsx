"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import logo from '@/public/logo.png';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { getMe, type AuthUser } from '@/lib/api';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    getMe(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { label: 'Resumen', href: '#resumen' },
    {
      label: 'Herramientas',
      href: '#herramientas',
      hasDropdown: true,
      subItems: [
        { label: 'Traductor Jivi', href: '#traductor-jivi' },
        { label: 'Marketplace Artesanal', href: '/marketplace' },
        { label: 'Reconocimiento IA', href: '#reconocimiento-ia' }
      ]
    },
    { label: 'Impacto', href: '#impacto' },
  ];

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center">
      <nav className="w-full max-w-5xl bg-slate-800/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <img src={logo.src} alt="Amazonia IA Logo" className="h-10 w-10 rounded-full group-hover:scale-105 transition-transform" />
              <div>
                <div className="text-white font-bold leading-tight">AmazonIA 4.0</div>
                <div className="text-[10px] text-white/70 leading-tight">Marketplace & Herramientas Amazónicas</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <div key={item.label} className="relative group">
                    <a
                      href={item.href}
                      className="text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-200 text-sm flex items-center gap-1 cursor-pointer"
                    >
                      {item.label}
                      {item.hasDropdown && (
                        <svg className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </a>
                    {item.hasDropdown && item.subItems && (
                      <div className="absolute top-full left-0 mt-1 w-44 bg-slate-600/85 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 flex flex-col z-50">
                        {item.subItems.map((subItem) => (
                          <a
                            key={subItem.label}
                            href={subItem.href}
                            className="px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Auth */}
              <div className="flex items-center gap-2 ml-2">
                {user ? (
                  <div ref={userMenuRef} className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2.5 hover:bg-white/15 border border-transparent hover:border-white/20 rounded-xl px-3 py-1.5 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                        {getInitials(user.fullName || user.username)}
                      </div>
                      <div className="text-white text-sm font-semibold leading-tight">
                        {user.fullName ?? user.username}
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-700/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </Link>
                        <div className="border-t border-white/10 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="text-white/90! hover:text-white! hover:bg-white/10!">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" size="sm">
                        Registrarse
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white! hover:bg-white/10!"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 px-4 bg-slate-900/80 rounded-b-2xl">
            {navItems.map((item) => (
              <div key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center justify-between py-3 text-white/90 hover:text-white transition-colors"
                  onClick={(e) => {
                    if (!item.hasDropdown) setIsMenuOpen(false);
                    else e.preventDefault();
                  }}
                >
                  {item.label}
                  {item.hasDropdown && (
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </a>
                {item.hasDropdown && item.subItems && (
                  <div className="pl-4 pb-2 space-y-1">
                    {item.subItems.map(subItem => (
                      <a
                        key={subItem.label}
                        href={subItem.href}
                        className="block py-2 text-sm text-white/70 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subItem.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile auth */}
            <div className="mt-4 space-y-3 pt-4 border-t border-white/20">
              {user ? (
                <>
                  {/* Info del usuario */}
                  <div className="flex items-center gap-3 px-1 pb-2">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {getInitials(user.fullName || user.username)}
                    </div>
                    <div className="text-white text-sm font-semibold">{user.fullName ?? user.username}</div>
                  </div>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full border-white/30! text-white/90! hover:bg-white/10! hover:border-transparent!">
                      Dashboard
                    </Button>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full border-white/30! text-white/90! hover:bg-white/10! hover:border-transparent!">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button variant="primary" className="w-full">
                      Registrarse
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}