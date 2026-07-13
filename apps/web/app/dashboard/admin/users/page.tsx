"use client";

import { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/api/user.api";
import type { UserAccountResponseDto } from "event-types";
import { Card } from "@/components/ui/Card";
import { User, Mail, Calendar, MapPin, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccountResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Currently defaulting to getting all for demo
      const res = await getAllUsers(new URLSearchParams({ limit: "50" }));
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-outfit text-muted">
          Usuarios del Sistema ({users.length})
        </h2>

        {users.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/50 border-dashed">
            <p className="text-muted">No se encontraron usuarios.</p>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted uppercase bg-gray-50/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Usuario</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    <th className="px-6 py-4 font-semibold">Ubicación</th>
                    <th className="px-6 py-4 font-semibold">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center shrink-0 text-brand-primary font-bold">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.fullName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              u.fullName?.charAt(0) || <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.fullName}</p>
                            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'SELLER' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {u.locationCity || u.locationFormattedAddress || "No especificada"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
