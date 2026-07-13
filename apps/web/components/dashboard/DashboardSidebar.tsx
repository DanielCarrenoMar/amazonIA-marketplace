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
  ShieldCheck
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

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-border flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="bg-brand-primary p-2 rounded-xl">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <span className="font-outfit font-bold text-xl tracking-tight text-brand-nature-content">AmazonIA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-muted hover:bg-gray-100 hover:text-foreground mb-4 border border-transparent hover:border-gray-200"
        >
          <Store className="w-5 h-5" />
          Volver al Marketplace
        </Link>
        <div className="h-px bg-border my-4" />

        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "text-muted hover:bg-brand-nature-bg hover:text-brand-primary"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-border bg-gray-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center shrink-0 text-brand-primary font-bold">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted truncate">
              {isAdmin ? "Administrador" : isBuyer ? "Comprador" : isLeader ? "Líder de Tribu" : "Artesano/a"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-urgency hover:bg-brand-urgency/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
