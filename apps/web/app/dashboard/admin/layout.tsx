"use client";

import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || !user || !isAdmin) {
    return null;
  }

  const tabs = [
    { name: 'Tribus', href: '/dashboard/admin/tribes' },
    { name: 'Membresías', href: '/dashboard/admin/memberships' },
    { name: 'Usuarios', href: '/dashboard/admin/users' },
    { name: 'Órdenes', href: '/dashboard/admin/orders' },
    { name: 'Categorías', href: '/dashboard/admin/categories' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-outfit font-bold">Panel de Administración</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (pathname === '/dashboard/admin' && tab.href === '/dashboard/admin/tribes');
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-muted hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
