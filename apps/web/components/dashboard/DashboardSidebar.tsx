"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Leaf,
  Store,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isLeader } = useAuth();

  const isBuyer = user?.role === "BUYER";

  const baseLinks = [
    ...(isBuyer ? [] : [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]),
    ...(isBuyer ? [] : [{ name: "Inventario", href: "/dashboard/inventory", icon: Package }]),
    { name: "Pedidos", href: "/dashboard/orders", icon: ShoppingBag },
    ...(isBuyer ? [] : [{ name: "Mi Tribu", href: "/dashboard/tribe", icon: Users }]),
    ...(isBuyer ? [] : [{ name: "Billetera", href: "/dashboard/wallet", icon: Wallet }]),
    ...(isBuyer ? [] : [{ name: "Notificaciones", href: "/dashboard/notifications", icon: Bell }]),
    { name: "Configuración", href: "/dashboard/settings", icon: Settings },
  ];

  const adminLinks = isAdmin ? [
    { name: "Administración", href: "/dashboard/admin", icon: ShieldCheck }
  ] : [];

  const links = [...adminLinks, ...baseLinks];

  const roleLabel = isAdmin
    ? "Administrador"
    : isBuyer
    ? "Comprador"
    : isLeader
    ? "Líder de Tribu"
    : "Artesano/a";

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-20" style={{ background: "linear-gradient(180deg, #064e3b 0%, #065f46 60%, #047857 100%)" }}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white/15 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
          <Leaf className="w-5 h-5 text-emerald-300" />
        </div>
        <div>
          <span className="font-outfit font-bold text-xl tracking-tight text-white">AmazonIA</span>
          <p className="text-emerald-300/70 text-[10px] font-medium tracking-wider uppercase">Marketplace</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-emerald-200/70 hover:bg-white/10 hover:text-white mb-4 text-sm group"
        >
          <Store className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span>Volver al Marketplace</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400/50">Menú Principal</p>

        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group ${
                isActive
                  ? "bg-white/20 text-white shadow-lg shadow-black/10 border border-white/15"
                  : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} />
              <span>{link.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-lg">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-emerald-300/70 truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-white/5 hover:border-white/15"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
