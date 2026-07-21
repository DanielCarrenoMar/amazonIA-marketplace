"use client";

import { useEffect, useState } from "react";
import { getAllUsers, setUserActiveStatus } from "@/lib/api/user.api";
import type { UserAccountResponseDto } from "event-types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Mail, Calendar, MapPin, Shield, Lock, Unlock } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccountResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleToggleActive = async (targetUser: UserAccountResponseDto) => {
    const nextIsActive = !targetUser.isActive;
    const confirmed = window.confirm(
      nextIsActive
        ? `¿Desbloquear a ${targetUser.fullName}? Podrá volver a iniciar sesión.`
        : `¿Bloquear a ${targetUser.fullName}? No podrá iniciar sesión hasta que lo desbloquees. Sus datos y órdenes no se eliminan.`
    );
    if (!confirmed) return;

    setUpdatingId(targetUser.id);
    try {
      const updated = await setUserActiveStatus(targetUser.id, nextIsActive);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      toast.success(nextIsActive ? "Usuario desbloqueado" : "Usuario bloqueado");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar el estado del usuario");
    } finally {
      setUpdatingId(null);
    }
  };

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
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
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
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {u.isActive ? 'Activo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={u.id === currentUser?.id || updatingId === u.id}
                          className={u.isActive
                            ? "text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border-gray-200"
                            : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-gray-200"}
                          onClick={() => handleToggleActive(u)}
                          title={u.id === currentUser?.id ? "No puedes bloquear tu propia cuenta" : undefined}
                        >
                          {u.isActive ? (
                            <><Lock className="w-3.5 h-3.5 mr-1.5" /> Bloquear</>
                          ) : (
                            <><Unlock className="w-3.5 h-3.5 mr-1.5" /> Desbloquear</>
                          )}
                        </Button>
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
