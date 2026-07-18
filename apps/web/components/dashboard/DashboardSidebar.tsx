"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import logo from '@/public/logo.png';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  User,
  BrainCircuit,
  Gavel,
  FileText,
} from "lucide-react";
import { getExplorerMembers } from "@/lib/explorer-api";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isLeader } = useAuth();
  const [isGovMember, setIsGovMember] = useState(false);

  useEffect(() => {
    if (user) {
      getExplorerMembers()
        .then((members) => {
          const found = members.some((m) => m.userId === user.id);
          setIsGovMember(found);
        })
        .catch(() => setIsGovMember(false));
    }
  }, [user]);

  const isBuyer = user?.role === "BUYER";

  const topLinks = [
    ...(isAdmin ? [{ name: "Administración", href: "/dashboard/admin", icon: ShieldCheck }] : []),
    ...(isBuyer ? [] : [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]),
    ...(isBuyer ? [] : [{ name: "Inventario", href: "/dashboard/inventory", icon: Package }]),
    { name: "Pedidos", href: "/dashboard/orders", icon: ShoppingBag },
    ...(isBuyer ? [] : [{ name: "IA Logística", href: "/dashboard/logistics-ai", icon: BrainCircuit }]),
    ...(isBuyer ? [] : [{ name: "Mi Tribu", href: "/dashboard/tribe", icon: Users }]),
    ...(isBuyer ? [] : [{ name: "Mi Billetera", href: "/dashboard/wallet", icon: Wallet }]),
    { name: "Historial de Pagos", href: "/dashboard/transactions", icon: FileText },
    ...(isGovMember ? [{ name: "Votaciones", href: "/dashboard/governance", icon: Gavel }] : []),
  ];

  const bottomLinks = [
    ...(isBuyer ? [] : [{ name: "Notificaciones", href: "/dashboard/notifications", icon: Bell }]),
    { name: "Configuración", href: "/dashboard/settings", icon: Settings },
  ];

  const roleLabel = isAdmin
    ? "Administrador"
    : isBuyer
      ? "Comprador"
      : isLeader
        ? "Líder de Tribu"
        : "Artesano/a";

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderLink = (link: { name: string, href: string, icon: any }) => {
    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
    const Icon = link.icon;
    return (
      <Link
        key={link.name}
        href={link.href}
        className={`flex items-center gap-4 px-5 py-3.5 font-bold transition-all text-[15px] group ${isActive
          ? "bg-brand-primary text-white rounded-full shadow-md"
          : "text-white/90 hover:text-white hover:bg-white/5 rounded-full"
          }`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "" : "opacity-80"}`} />
        <span>{link.name}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-72 flex flex-col z-20 bg-[#091d13] border-r border-white/5 text-white shadow-2xl">
      {/* Logo */}
      <Link href="/" className="px-6 py-8 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5">
        <img src={logo.src} alt="AmazonIA" className="w-12 h-12 rounded-full shadow-md" />
        <div className="flex flex-col justify-center">
          <span className="font-outfit font-extrabold text-[22px] tracking-tight text-white leading-none mb-1">AmazonIA 4.0</span>
          <p className="text-white/60 text-[9px] font-semibold tracking-wide uppercase leading-tight">Marketplace & Herramientas Amazónicas</p>
        </div>
      </Link>

      {/* Navigation Top */}
      <nav className="flex-1 px-4 py-2 flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {topLinks.map(renderLink)}
      </nav>

      {/* Bottom Links and Profile */}
      <div className="px-4 pb-6 pt-4 flex flex-col gap-2 bg-linear-to-t from-[#05140c] to-transparent">
        {bottomLinks.map(renderLink)}

        {/* Footer Profile */}
        <div className="mt-6 relative" ref={menuRef}>
          <div
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`px-3 py-2 flex items-center justify-between cursor-pointer rounded-2xl transition-colors ${isProfileMenuOpen ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-4">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-11 h-11 rounded-full object-cover border-2 border-white/10 shadow-sm" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-brand-primary flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-extrabold text-white truncate leading-tight mb-0.5">{user?.fullName}</p>
                <span className="inline-block bg-brand-primary text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                  {roleLabel}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-white/50 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-[#0d281a] border border-white/10 rounded-2xl shadow-xl overflow-hidden py-1 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <Link
                href="/dashboard/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                <User className="w-4 h-4 text-white/70" />
                Ver Perfil
              </Link>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}