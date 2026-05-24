"use client";

import { useState } from 'react';
import logo from '@/public/logo.png';
import Link from 'next/link';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Resumen', href: '#resumen' },
    {
      label: 'Herramientas',
      href: '#herramientas',
      hasDropdown: true,
      subItems: [
        { label: 'Traductor Jivi', href: '#traductor-jivi' },
        { label: 'Marketplace Artesanal', href: '#marketplace' },
        { label: 'Reconocimiento IA', href: '#reconocimiento-ia' }
      ]
    },
    { label: 'Impacto', href: '#impacto' },
  ];

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center">
      <nav className="w-full max-w-5xl bg-slate-600/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <img src={logo.src} alt="Amazonia IA Logo" className="h-10 w-10 rounded-full group-hover:scale-105 transition-transform" />
              <div>
                <div className="text-white font-bold leading-tight">Amazonia IA</div>
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
                      <div className="absolute top-full left-0 mt-1 w-44 bg-slate-300/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 flex flex-col z-50">
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

              {/* Desktop Auth Buttons */}
              <div className="flex items-center gap-2 ml-2">
                <button
                  className="text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-200 text-sm cursor-pointer"
                >
                  Iniciar Sesión
                </button>

                <button
                  className="bg-brand-primary text-white px-5 py-2 rounded-xl hover:bg-brand-primary/80 transition-colors text-sm shadow-sm cursor-pointer"
                >
                  Registrarse
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white"
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
            </button>
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

            <div className="mt-4 space-y-3 pt-4 border-t border-white/20">
              <button className="w-full text-white/90 px-6 py-3 rounded-xl border border-white/30 hover:bg-white/10 transition-colors">
                Iniciar Sesión
              </button>
              <button className="w-full bg-brand-primary text-white px-6 py-3 rounded-xl hover:bg-brand-primary/80 transition-colors">
                Registrarse
              </button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}