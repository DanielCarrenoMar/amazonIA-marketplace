"use client";
import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";
import { updateMe, changeMyPassword, uploadAvatar } from "@/lib/api";
import { Camera, Save, Shield, User, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { user, refreshUser, isBuyer, isAdmin, isLeader } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"personal" | "location" | "security">("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    username: "",
    age: "",
    nationality: "",
    phonePrimary: "",
    phoneSecondary: "",
  });

  const [locationForm, setLocationForm] = useState({
    locationFormattedAddress: "",
    locationCity: "",
    locationRegion: "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Hydrate forms when user loads
  useEffect(() => {
    if (user) {
      setPersonalForm({
        fullName: user.fullName || "",
        username: user.username || "",
        age: user.age ? user.age.toString() : "",
        nationality: user.nationality || "",
        phonePrimary: user.phonePrimary || "",
        phoneSecondary: user.phoneSecondary || "",
      });
      setLocationForm({
        locationFormattedAddress: user.locationFormattedAddress || "",
        locationCity: user.locationCity || "",
        locationRegion: user.locationRegion || "",
      });
    }
  }, [user]);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalForm({ ...personalForm, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocationForm({ ...locationForm, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityForm({ ...securityForm, [e.target.name]: e.target.value });
  };

  const savePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setIsSaving(true);
      await updateMe(user.id, {
        fullName: personalForm.fullName,
        username: personalForm.username || undefined,
        age: personalForm.age ? parseInt(personalForm.age) : undefined,
        nationality: personalForm.nationality || undefined,
        phonePrimary: personalForm.phonePrimary || undefined,
        phoneSecondary: personalForm.phoneSecondary || undefined,
      });
      await refreshUser();
      toast({ title: "Información personal actualizada", variant: "success" });
    } catch (error: any) {
      toast({ title: error.message || "Error al actualizar la información", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveLocationInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setIsSaving(true);
      await updateMe(user.id, {
        locationFormattedAddress: locationForm.locationFormattedAddress || undefined,
        locationCity: locationForm.locationCity || undefined,
        locationRegion: locationForm.locationRegion || undefined,
      });
      await refreshUser();
      toast({ title: "Ubicación actualizada", variant: "success" });
    } catch (error: any) {
      toast({ title: error.message || "Error al actualizar la ubicación", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSecurityInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      return toast({ title: "Las contraseñas no coinciden", variant: "error" });
    }
    try {
      setIsSaving(true);
      await changeMyPassword(user.id, {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Contraseña actualizada exitosamente.", description: "Inicia sesión nuevamente.", variant: "success", duration: 5000 });
      // Logic for redirect/logout will happen by API response 401 or handled in navbar.
    } catch (error: any) {
      toast({ title: error.message || "La contraseña actual es incorrecta", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    
    try {
      setIsUploading(true);
      await uploadAvatar(user.id, file);
      await refreshUser();
      toast({ title: "Foto de perfil actualizada", variant: "success" });
    } catch (error: any) {
      toast({ title: error.message || "Error al subir la imagen", variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  const roleText = isAdmin ? "Administrador" : isBuyer ? "Comprador" : isLeader ? "Líder de Tribu" : "Artesano/a";

  return (
    <div className="space-y-6">
      <DashboardHeader title="Configuración" subtitle="Ajustes de cuenta y perfil" />

      {/* Hero Card */}
      <Card padding="lg" className="bg-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-primary-light flex items-center justify-center text-3xl font-bold text-brand-primary shadow-md">
                {user.fullName?.charAt(0) || "U"}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 bg-brand-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-brand-primary/90 transition-transform hover:scale-105">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold font-outfit text-foreground">{user.fullName}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-nature-bg text-brand-primary text-xs font-semibold">
                {roleText}
              </span>
              <span className="text-muted text-sm">{user.email}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab("personal")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "personal" ? "bg-brand-primary text-white" : "text-muted hover:bg-gray-100 hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            Información Personal
          </button>
          <button
            onClick={() => setActiveTab("location")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "location" ? "bg-brand-primary text-white" : "text-muted hover:bg-gray-100 hover:text-foreground"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Ubicación
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "security" ? "bg-brand-primary text-white" : "text-muted hover:bg-gray-100 hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            Seguridad
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card padding="lg" className="bg-white h-full min-h-[400px]">
            {activeTab === "personal" && (
              <form onSubmit={savePersonalInfo} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold font-outfit mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nombre Completo" name="fullName" value={personalForm.fullName} onChange={handlePersonalChange} required />
                  <Input label="Nombre de Usuario" name="username" value={personalForm.username} onChange={handlePersonalChange} />
                  <Input label="Nacionalidad" name="nationality" value={personalForm.nationality} onChange={handlePersonalChange} />
                  <Input label="Edad" name="age" type="number" min="0" value={personalForm.age} onChange={handlePersonalChange} />
                  <Input label="Teléfono Principal" name="phonePrimary" value={personalForm.phonePrimary} onChange={handlePersonalChange} />
                  <Input label="Teléfono Secundario" name="phoneSecondary" value={personalForm.phoneSecondary} onChange={handlePersonalChange} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" disabled={isSaving} className="gap-2">
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "location" && (
              <form onSubmit={saveLocationInfo} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold font-outfit mb-4">Ubicación y Dirección</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Dirección Completa</label>
                    <textarea
                      name="locationFormattedAddress"
                      value={locationForm.locationFormattedAddress}
                      onChange={handleLocationChange}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-shadow resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Ciudad" name="locationCity" value={locationForm.locationCity} onChange={handleLocationChange} />
                    <Input label="Región / Estado" name="locationRegion" value={locationForm.locationRegion} onChange={handleLocationChange} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" disabled={isSaving} className="gap-2">
                    <Save className="w-4 h-4" />
                    Actualizar Ubicación
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={saveSecurityInfo} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold font-outfit mb-4">Seguridad</h3>
                <div className="space-y-4 max-w-md">
                  <Input
                    label="Contraseña Actual"
                    name="currentPassword"
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                  <div className="h-px bg-border my-2" />
                  <Input
                    label="Nueva Contraseña"
                    name="newPassword"
                    type="password"
                    value={securityForm.newPassword}
                    onChange={handleSecurityChange}
                    required
                    minLength={8}
                  />
                  <Input
                    label="Confirmar Nueva Contraseña"
                    name="confirmPassword"
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={handleSecurityChange}
                    required
                    minLength={8}
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="primary" disabled={isSaving} className="gap-2">
                    <Shield className="w-4 h-4" />
                    Cambiar Contraseña
                  </Button>
                  <p className="text-xs text-muted mt-3">
                    Al cambiar tu contraseña, se cerrarán las sesiones activas y deberás iniciar sesión nuevamente.
                  </p>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
