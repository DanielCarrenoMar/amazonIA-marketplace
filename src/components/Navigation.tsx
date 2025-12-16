import { useState } from 'react';
import logo from '../assets/logo.png';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Estado para el contador del carrito

  const navItems = [
    { label: 'Resumen', href: '#resumen' },
    { label: 'Problema', href: '#problema' },
    { label: 'Objetivos', href: '#objetivos' },
    { label: 'Características', href: '#features' },
    { label: 'Marketplace', href: '#marketplace' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Arapaima Logo" className="h-14 w-14" />
            <div>
              <div className="text-emerald-800">Arapaima</div>
              <div className="text-xs text-gray-600">Sistema de Clasificación Amazónica</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {item.label}
              </a>
            ))}
            
            {/* Desktop Auth Buttons and Cart */}
            <div className="flex items-center gap-3 ml-2">
              {/* Cart Icon */}
              <button 
                className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                aria-label="Carrito de compras"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Login Button */}
              <button className="text-gray-700 hover:text-emerald-600 px-4 py-2 rounded-lg transition-colors">
                Login
              </button>

              {/* Sign Up Button */}
              <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700"
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-3 text-gray-700 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            {/* Mobile Cart and Auth Buttons */}
            <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
              {/* Cart Button for Mobile */}
              <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="flex items-center gap-3 text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Carrito
                </span>
                {cartCount > 0 && (
                  <span className="bg-emerald-600 text-white text-sm rounded-full px-3 py-1">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Login Button */}
              <button className="w-full text-gray-700 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-emerald-600 hover:text-emerald-600 transition-colors">
                Login
              </button>

              {/* Sign Up Button */}
              <button className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}