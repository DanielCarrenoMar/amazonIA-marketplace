"use client";

import React, { useState, useEffect } from "react";
import logo from "@/public/logo.png";
import Link from "next/link";
import { 
  ShoppingBag, 
  Menu, 
  X, 
  User,
  Heart
} from "lucide-react";
import { Button, Badge } from "../ui";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Resumen", href: "#resumen" },
    { label: "Problema", href: "#problema" },
    { label: "Objetivos", href: "#objetivos" },
    { label: "Características", href: "#features" },
    { label: "Marketplace", href: "#marketplace" },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100 py-2" 
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative overflow-hidden rounded-xl bg-white p-1 shadow-sm group-hover:shadow-md transition-all">
              <img 
                src={logo.src} 
                alt="Amazonia IA Logo" 
                className="h-10 w-10 object-contain transform group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-outfit font-bold text-brand-primary-dark leading-tight tracking-tight">
                Amazonia <span className="text-brand-primary">IA</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest leading-none">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors hover:translate-y-px active:translate-y-0"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-gray-200 pl-8">
              {/* Actions */}
              <button className="p-2 text-gray-500 hover:text-brand-primary transition-colors relative">
                <Heart className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-500 hover:text-brand-primary transition-colors relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge variant="primary" size="sm" className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 justify-center">
                    {cartCount}
                  </Badge>
                )}
              </button>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="font-bold">
                  Login
                </Button>
                <Button size="sm" className="px-5">
                  Sign Up
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button className="p-2 text-gray-500 relative">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-brand-primary-dark bg-gray-50 rounded-lg"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-8 space-y-6">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-semibold text-gray-800 hover:text-brand-primary transition-colors p-2 rounded-xl hover:bg-brand-nature-bg"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
              <Button variant="ghost" className="w-full justify-center">
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button className="w-full justify-center">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
