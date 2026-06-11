"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import logo from "@/public/logo.png";
import amazoniaBg from "@/public/amazonia-login-1.webp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "El correo electrónico es obligatorio";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "El formato de correo no es válido";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Inicio de sesión simulado correctamente");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full bg-background select-none">
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center gap-1.5 text-foreground/80 hover:text-brand-primary-dark text-sm sm:text-base font-semibold transition-colors duration-200 group z-50"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver al inicio
      </Link>

      <div className="w-full md:w-[450px] lg:w-[550px] flex flex-col justify-center px-8 sm:px-12 py-6 md:py-8 relative overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto pt-8 md:pt-0">
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
            <img src={logo.src} alt="Amazonia IA Logo" className="h-16 w-16 rounded-full shadow-sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold font-poppins text-center text-foreground tracking-tight mb-1">
            ¡Bienvenido de nuevo!
          </h2>
          <p className="text-foreground/70 text-center text-sm mb-5 md:mb-6">
            Por favor ingrese sus datos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="Ingrese su correo electrónico"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={errors.email}
            />

            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
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

            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <Checkbox
                label={<span className="text-foreground font-medium select-none">Recordarme</span>}
              />
              <Link
                href="/forgot-password"
                className="text-brand-primary hover:text-brand-primary-dark hover:underline font-medium transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-4 font-semibold text-white bg-brand-primary hover:bg-brand-primary-dark transition-all duration-200 rounded-xl"
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-foreground/80">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="text-brand-primary hover:text-brand-primary-dark font-bold transition-colors duration-200"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </div>

      <div
        className="hidden md:flex flex-1 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${amazoniaBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-16 text-white h-full pb-24 text-right ml-auto">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 font-poppins drop-shadow-lg">
            Vuelve a conectar
          </h1>
          <p className="text-lg lg:text-xl text-white/90 max-w-lg ml-auto drop-shadow-md leading-relaxed">
            Tu centro de control en AmazonIA 4.0 te espera para seguir innovando.
          </p>
        </div>
      </div>

    </div>
  );
}
