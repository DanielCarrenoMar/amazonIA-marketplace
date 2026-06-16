"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { registerUser } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import logo from "@/public/logo.png";
import amazoniaBg from "@/public/amazonia-register-1.jpg";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    fullName: "",
    nationalId: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on type
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { fullName: "", nationalId: "", email: "", password: "" };

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio";
      isValid = false;
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = "El documento de identidad es obligatorio";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "El correo electrónico es obligatorio";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato de correo no es válido";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
      isValid = false;
    } else if (!/^(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "La contraseña debe tener al menos una letra mayúscula y un número";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await registerUser(formData);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.status === 409) {
        setApiError("Este correo o documento de identidad ya está registrado.");
      } else if (err.status === 429) {
        setApiError("Demasiados intentos. Por favor espera un momento e inténtalo de nuevo.");
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
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
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

      <div className="w-full md:w-[450px] lg:w-[550px] flex flex-col justify-center px-8 sm:px-12 py-6 md:py-8 relative overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto pt-8 md:pt-0">
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
            <img src={logo.src} alt="Amazonia IA Logo" className="h-16 w-16 rounded-full shadow-sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold font-poppins text-center text-foreground tracking-tight mb-1">
            Crear una cuenta
          </h2>
          <p className="text-foreground/70 text-center text-sm mb-5 md:mb-6">
            Por favor ingrese sus datos para registrarse.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              name="fullName"
              placeholder="Ingrese su nombre completo"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
            />

            <Input
              label="Documento de identidad"
              type="text"
              name="nationalId"
              placeholder="Ingrese su documento de identidad"
              value={formData.nationalId}
              onChange={handleChange}
              error={errors.nationalId}
            />

            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              placeholder="Ingrese su correo electrónico"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              label="Contraseña"
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-4 font-semibold text-white bg-brand-primary hover:bg-brand-primary-dark transition-all duration-200 rounded-xl"
            >
              Registrarse
            </Button>
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