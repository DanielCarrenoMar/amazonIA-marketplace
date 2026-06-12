"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, AuthUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      // Si no hay token, manda al login
      router.replace("/login");
      return;
    }

    getMe(token)
      .then((data) => setUser(data))
      .catch(() => {
        // Token inválido o expirado
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground/60 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <p className="text-foreground/60 text-sm tracking-wide uppercase">
          Esto es una prueba de logueo
        </p>
        <h1 className="text-3xl font-bold font-poppins text-foreground">
          {user?.fullName ?? user?.username ?? "usuario"}
        </h1>
        <p className="text-foreground/50 text-sm">{user?.email}</p>
      </div>
    </div>
  );
}
