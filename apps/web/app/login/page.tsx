"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import logo from "@/public/logo.png";

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
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-background px-4 select-none overflow-hidden">
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center gap-1.5 text-foreground/80 hover:text-brand-primary-dark text-sm sm:text-base font-semibold transition-colors duration-200 group z-50"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver al inicio
      </Link>

      <div className="relative w-full max-w-[480px] z-10 flex flex-col">

        <Card
          variant="default"
          padding="lg"
          rounded="3xl"
          className="w-full border-border bg-background shadow-xl shadow-gray-300 relative overflow-hidden"
        >
          <CardHeader className="text-center flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo.src} alt="Amazonia IA Logo" className="h-8 w-8 rounded-full shadow-sm" />
              <span className="font-poppins text-lg font-bold tracking-wider text-brand-primary-dark">
                AmazonIA
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-semibold font-poppins text-foreground tracking-tight">
              ¡Bienvenido de nuevo!
            </CardTitle>
            <CardDescription className="text-foreground/80 text-xs sm:text-sm mt-1.5">
              Por favor ingrese sus datos.
            </CardDescription>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="Ingrese su correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />

              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </CardBody>

          <div className="mt-6 text-center text-xs sm:text-sm text-foreground/80">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="text-brand-primary hover:text-brand-primary-dark font-bold transition-colors duration-200"
            >
              Regístrate
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
