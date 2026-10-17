// src/features/auth/components/FormularioLogin.tsx
"use client";

import { useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plane, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { loginSchema, LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/use-auth";
import { obtenerConfiguracionApp } from "@/lib/tenants.config";

export default function FormularioLogin() {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const router = useRouter();

  const config = obtenerConfiguracionApp();
  const { iniciarSesion } = useAuthStore();
  const { mutateAsync: loginMutation, isPending: estaCargando } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const alEnviar = async (data: LoginFormValues) => {
    try {
      const respuesta = await loginMutation(data);

      if (respuesta.status === "success") {
        iniciarSesion(respuesta.user);
        toast.success(respuesta.message);

        // Ruta única del sistema: el tablero embebido
        router.push("/dashboard");
      }
    } catch (error) {
      const mensajeError =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Usuario o contraseña incorrectos.";
      toast.error("Login Incorrecto", {
        description: mensajeError,
      });
    }
  };

  return (
    <div
      className="w-full max-w-[420px] rounded-3xl border border-white/30 bg-white/80 p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] backdrop-blur-3xl transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)]"
      style={{ "--tenant-primary": config.colorPrimario } as CSSProperties}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">
            {config.logoUrl ? (
              <div className="h-24 w-24 overflow-hidden rounded-2xl p-1 shadow-md">
                <img
                  src={config.logoUrl}
                  alt={config.nombreEmpresa}
                  className="h-full w-full object-contain filter drop-shadow-md"
                />
              </div>
            ) : (
              <div
                className="rounded-xl p-4 shadow-md"
                style={{ backgroundColor: config.colorPrimario }}
              >
                <Plane className="h-10 w-10 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            {config.nombreEmpresa}
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Sistema — Acceso Autorizado
          </p>
        </div>

        <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 ml-1">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="text"
              placeholder="usuario@airmajoro.com"
              {...register("email")}
              disabled={estaCargando}
              className={`h-10 bg-white/50 border-gray-200 rounded-lg focus:ring-2 transition-all ${errors.email ? "border-red-500 focus:ring-red-500/20" : "focus:ring-[var(--tenant-primary)]/20 shadow-sm"}`}
            />
            {errors.email && <p className="text-xs text-red-600 font-medium ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 ml-1">
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                type={mostrarContrasena ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={estaCargando}
                className={`h-10 pr-12 bg-white/50 border-gray-200 rounded-lg focus:ring-2 transition-all ${errors.password ? "border-red-500 focus:ring-red-500/20" : "focus:ring-[var(--tenant-primary)]/20 shadow-sm"}`}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                disabled={estaCargando}
              >
                {mostrarContrasena ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 font-medium ml-1">{errors.password.message}</p>}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-10 rounded-lg text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              disabled={estaCargando}
              style={{
                backgroundColor: config.colorPrimario || "#1a56db",
              }}
            >
              {estaCargando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando Sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </div>

          <div className="pt-2 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-gray-100/50 text-[10px] font-bold text-gray-400 uppercase tracking-tighter border border-gray-200/50">
              {/* Sistema Air Majoro v1.0 */}
              Air Majoro v1.0
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}