"use client";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/api/notification.api";
import type { NotificationResponseDto } from "event-types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/Toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetchNotifications({ limit: 50 });
      setNotifications(res.items);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      toast({ title: "Error", description: "No se pudo marcar como leída.", variant: "error" });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({ title: "Éxito", description: "Todas las notificaciones marcadas como leídas.", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar las notificaciones.", variant: "error" });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <DashboardHeader title="Notificaciones" subtitle="Mantente al día de tu cuenta" />
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="mb-2">
            <Icon icon="mdi:check-all" className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card padding="lg" className="text-center py-16 bg-white border border-dashed border-gray-200">
          <Icon icon="mdi:bell-outline" className="w-16 h-16 mx-auto text-brand-primary/40 mb-4" />
          <h2 className="text-xl font-bold font-outfit mb-2">Bandeja de Notificaciones</h2>
          <p className="text-muted max-w-md mx-auto">
            Aquí aparecerán las alertas de ventas, mensajes de compradores y avisos del sistema.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              padding="md" 
              className={`transition-colors ${notification.isRead ? 'bg-white opacity-80' : 'bg-brand-nature-bg border-brand-primary/30'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.isRead ? 'bg-gray-100 text-gray-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    <Icon icon="mdi:bell-outline" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${notification.isRead ? 'text-gray-700' : 'text-slate-900'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-slate-700'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notification.id)} title="Marcar como leída">
                    <Icon icon="mdi:check" className="w-5 h-5 text-brand-primary" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
