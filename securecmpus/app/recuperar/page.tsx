"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";

export default function RecuperarPage() {
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: "info" | "error"; texto: string } | null>(null);

  // Lista blanca estricta de dominios institucionales válidos
  const DOMINIOS_VALIDOS = ["@toluca.tecnm.mx", "@ittoluca.edu.mx"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    setLoading(true);

    // 1. Normalización de entrada
    const correoNormalizado = correo.trim().toLowerCase();

    // 2. Validación perimetral de dominio institucional
    const esDominioValido = DOMINIOS_VALIDOS.some((dom) => correoNormalizado.endsWith(dom));

    if (!esDominioValido) {
      setLoading(false);
      setFeedbackMsg({
        tipo: "error",
        texto: "Acceso restringido: Solo se admiten correos institucionales (@toluca.tecnm.mx o @ittoluca.edu.mx).",
      });
      return;
    }

    try {
      // 3. Solicitud de restablecimiento vía Firebase Auth
      await sendPasswordResetEmail(auth, correoNormalizado);
    } catch (err: unknown) {
      // Registro defensivo: Se omite mostrar el error de Firebase para evitar User Enumeration
    } finally {
      // 4. Control de Seguridad: Respuesta indistinguible (Mitigación OWASP A07)
      // Tanto si la cuenta existe como si no, devolvemos el mismo mensaje neutral.
      setLoading(false);
      setFeedbackMsg({
        tipo: "info",
        texto: "Si la cuenta pertenece a los dominios del instituto y está activa, se ha enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.",
      });
      setCorreo("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Resplandor decorativo de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-md w-full space-y-6 bg-slate-900/70 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center mx-auto text-blue-400 font-mono shadow-inner">
            <KeyRound className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Restablecer Clave
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Ingresa tu correo institucional asignado por el IT Toluca para generar un enlace seguro de recuperación.
          </p>
        </div>

        {/* Notificaciones de Estado */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed border flex items-start gap-3 ${
              feedbackMsg.tipo === "info"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/40 border-rose-500/40 text-rose-200"
            }`}
          >
            {feedbackMsg.tipo === "info" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{feedbackMsg.texto}</span>
          </div>
        )}

        {/* Formulario */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="correo"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Correo Institucional
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@toluca.tecnm.mx"
                className="appearance-none block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-inner"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Solo cuentas terminadas en <span className="font-mono text-slate-400">@toluca.tecnm.mx</span> o <span className="font-mono text-slate-400">@ittoluca.edu.mx</span>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? "Generando solicitud..." : "Enviar Enlace de Recuperación"}
          </button>
        </form>

        {/* Navegación y Pie de tarjeta */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Regresar al Login
          </Link>
          <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Anti-Enumeration
          </span>
        </div>

      </div>
    </div>
  );
}
