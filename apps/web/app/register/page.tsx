"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { registerUser } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import logo from "@/public/logo.png";
import amazoniaBg from "@/public/amazonia-register-1.jpg";
import { isEmpty, isEmail, isNumbersLettersAndSymbolsValid, isPhone, isValidID } from "@/lib/utils";

// Map needs to be loaded dynamically to avoid SSR issues with Leaflet
const LocationPickerHybrid = dynamic(() => import("@/components/ui/LocationPickerHybrid"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">Cargando mapa...</div>
});

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nationalId: "",
    username: "",
    fullName: "",
    age: "",
    nationality: "",
    phonePrimary: "",
    phoneSecondary: "",
    locationFormattedAddress: "",
    locationCity: "",
    locationRegion: "",
    locationLat: null as number | null,
    locationLng: null as number | null,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!isEmail(formData.email)) {
      newErrors.email = "Ingrese un correo electrónico válido";
      isValid = false;
    }

    if (isEmpty(formData.password)) {
      newErrors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
      isValid = false;
    } else if (!/^(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Debe tener mayúscula y número";
      isValid = false;
    }

    if (!isValidID(formData.nationalId)) {
      newErrors.nationalId = "Ingrese un documento válido (Ej: V12345678)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!isNumbersLettersAndSymbolsValid(formData.fullName)) {
      newErrors.fullName = "El nombre completo es obligatorio y debe contener caracteres válidos";
      isValid = false;
    }
    
    if (!isEmpty(formData.phonePrimary) && !isPhone(formData.phonePrimary)) {
      newErrors.phonePrimary = "Formato de teléfono inválido";
      isValid = false;
    }

    if (!isEmpty(formData.phoneSecondary) && !isPhone(formData.phoneSecondary)) {
      newErrors.phoneSecondary = "Formato de teléfono inválido";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  
  const validateStep3 = () => {
    // La ubicación es opcional en este sistema, pero si se exige algo, podría validarse aquí
    return true;
  };

  const handleNext = () => {
    setApiError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    setApiError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string, city?: string, region?: string) => {
    setFormData((prev) => ({
      ...prev,
      locationLat: lat,
      locationLng: lng,
      locationFormattedAddress: address || prev.locationFormattedAddress,
      locationCity: city || prev.locationCity,
      locationRegion: region || prev.locationRegion,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si la persona le da a Enter y aún no está en el último paso, avanzar
    if (step < 3) {
      handleNext();
      return;
    }

    setApiError(null);
    if (!validateStep3()) return;
    
    // Convert age to number if provided
    const payload = {
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      locationLat: formData.locationLat === null ? undefined : formData.locationLat,
      locationLng: formData.locationLng === null ? undefined : formData.locationLng,
    };

    setIsLoading(true);
    try {
      const data = await registerUser(payload);
      await login(data);
      router.push("/");
    } catch (err: any) {
      if (err.status === 409) {
        setApiError("Este correo, nombre de usuario o documento ya está registrado.");
      } else if (err.status === 429) {
        setApiError("Demasiados intentos. Por favor espera e inténtalo de nuevo.");
      } else {
        setApiError(err.message ?? "Ocurrió un error al registrarse. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background select-none overflow-hidden">
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center gap-1.5 text-foreground/80 hover:text-brand-primary-dark md:text-white/90 md:hover:text-white text-sm sm:text-base font-semibold transition-colors duration-200 group z-50 md:drop-shadow-md"
      >
        <Icon icon="lucide:arrow-left" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver al inicio
      </Link>

      <div
        className="hidden md:flex flex-1 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${amazoniaBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-16 text-white h-full pb-24">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 font-poppins drop-shadow-lg">
            Descubre AmazonIA 4.0
          </h1>
          <p className="text-lg lg:text-xl text-white/90 max-w-lg drop-shadow-md leading-relaxed">
            Únete al ecosistema donde el desarrollo tecnológico se conecta con nuestra mayor riqueza natural.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[500px] lg:w-[600px] flex flex-col px-8 sm:px-12 py-6 md:py-8 relative overflow-y-auto">
        <div className="w-full max-w-[450px] mx-auto my-auto pt-8 md:pt-0">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logo.src} alt="Amazonia IA Logo" className="h-16 w-16 rounded-full shadow-sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold font-poppins text-center text-foreground tracking-tight mb-1">
            Crear una cuenta
          </h2>
          
          <div className="flex justify-center items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s === step ? 'bg-brand-primary text-white' : s < step ? 'bg-brand-primary/20 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
                  {s < step ? <Icon icon="lucide:check" className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-1 rounded-full ${s < step ? 'bg-brand-primary/50' : 'bg-gray-100'}`} />}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* STEP 1: CUENTA */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <Input
                  label="Correo electrónico *"
                  type="email"
                  name="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre de usuario"
                    type="text"
                    name="username"
                    placeholder="Opcional"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <Input
                    label="Doc. Identidad *"
                    type="text"
                    name="nationalId"
                    placeholder="V-12345678"
                    value={formData.nationalId}
                    onChange={handleChange}
                    error={errors.nationalId}
                  />
                </div>

                <Input
                  label="Contraseña *"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Ingrese su contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-foreground/60 hover:text-brand-primary transition-colors focus:outline-none p-1 rounded-md cursor-pointer"
                    >
                      {showPassword ? <Icon icon="lucide:eye-off" className="w-4 h-4" /> : <Icon icon="lucide:eye" className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
            </div>

            {/* STEP 2: PERSONAL */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <Input
                  label="Nombre completo *"
                  type="text"
                  name="fullName"
                  placeholder="Juan Pérez"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nacionalidad"
                    type="text"
                    name="nationality"
                    placeholder="Venezolana"
                    value={formData.nationality}
                    onChange={handleChange}
                  />
                  <Input
                    label="Edad"
                    type="number"
                    name="age"
                    placeholder="ej. 30"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Teléfono Principal"
                    type="tel"
                    name="phonePrimary"
                    placeholder="+58 412..."
                    value={formData.phonePrimary}
                    onChange={handleChange}
                    error={errors.phonePrimary}
                  />
                  <Input
                    label="Teléfono Secundario"
                    type="tel"
                    name="phoneSecondary"
                    placeholder="Opcional"
                    value={formData.phoneSecondary}
                    onChange={handleChange}
                    error={errors.phoneSecondary}
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: UBICACIÓN */}
            <div className={step === 3 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <Input
                  label="Dirección Completa"
                  type="text"
                  name="locationFormattedAddress"
                  placeholder="Calle, Sector, Edificio..."
                  value={formData.locationFormattedAddress}
                  onChange={handleChange}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    type="text"
                    name="locationCity"
                    placeholder="Ciudad"
                    value={formData.locationCity}
                    onChange={handleChange}
                  />
                  <Input
                    label="Región / Estado"
                    type="text"
                    name="locationRegion"
                    placeholder="Estado"
                    value={formData.locationRegion}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Fijar Ubicación Exacta (Opcional)</label>
                  <p className="text-xs text-gray-500 mb-3">Busca tu zona o usa tu ubicación actual en el mapa para autocompletar la dirección.</p>
                  {step === 3 && <LocationPickerHybrid onLocationSelect={handleLocationSelect} />}
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-2">
                {apiError}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Atrás
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Registrarse
                </Button>
              )}
            </div>
          </form>

          <div className="mt-5 text-center text-sm text-foreground/80">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="text-brand-primary hover:text-brand-primary-dark font-bold transition-colors duration-200"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}