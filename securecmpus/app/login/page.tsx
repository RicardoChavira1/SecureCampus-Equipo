"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Clock, 
  Send 
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<any | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  
  // Rate limiting local persistido
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  const DOMINIOS_VALIDOS = ["@toluca.tecnm.mx", "@ittoluca.edu.mx"];

  // Sincronización inicial y temporizador regresivo de bloqueo
  useEffect(() => {
    const savedLock = sessionStorage.getItem("sc_login_lock");
    const savedAttempts = sessionStorage.getItem("sc_login_attempts");
    
    if (savedAttempts) {
      setFailedAttempts(parseInt(savedAttempts, 10));
    }

    if (savedLock) {
      const lockUntil = parseInt(savedLock, 10);
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setLockSecondsRemaining(remaining);
      } else {
        sessionStorage.removeItem("sc_login_lock");
        sessionStorage.removeItem("sc_login_attempts");
      }
    }
  }, []);

  // Intervalo para el contador del bloqueo
  useEffect(() => {
    if (lockSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockSecondsRemaining((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem("sc_login_lock");
          sessionStorage.removeItem("sc_login_attempts");
          setFailedAttempts(0);
          setErrorMsg("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockSecondsRemaining]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSecondsRemaining > 0) return;

    setLoading(true);
    setErrorMsg("");
    setUnverifiedUser(null);
    setResendStatus(null);

    // 1. Normalización de entrada
    const correoNormalizado = correo.trim().toLowerCase();
    const esDominioValido = DOMINIOS_VALIDOS.some((d) => correoNormalizado.endsWith(d));

    // Validación perimetral uniforme (OWASP A07)
    if (!esDominioValido) {
      setLoading(false);
      setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
      return;
    }

    try {
      // 2. Autenticación con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, correoNormalizado, password);
      const user = userCredential.user;

      /* ==============================================================
         CONTROL COMENTADO TEMPORALMENTE PARA ENTORNO DE PRUEBAS:
         Descomentar en producción para forzar validación de correo institucional.

      if (!user.emailVerified) {
        setUnverifiedUser(user);
        await signOut(auth);
        setErrorMsg("Cuenta no confirmada. Requiere verificación de correo institucional.");
        setLoading(false);
        return;
      }
      ============================================================== */

      // 3. Consulta de permisos en Firestore (RBAC & Aislamiento de expediente)
      const userDocRef = doc(db, "usuarios", user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        await signOut(auth);
        setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
        setLoading(false);
        return;
      }

      const userData = userSnapshot.data();

      if (!userData.activo) {
        await signOut(auth);
        setErrorMsg("Cuenta suspendida temporalmente. Contacte a la administración.");
        setLoading(false);
        return;
      }

      // Limpieza de intentos fallidos tras autenticación exitosa
      sessionStorage.removeItem("sc_login_attempts");
      sessionStorage.removeItem("sc_login_lock");

      // 4. Redirección por Rol (RBAC)
      switch (userData.rol) {
        case "ESTUDIANTE":
          router.push("/estudiante/calificaciones");
          break;
        case "PROFESOR":
          router.push("/profesor/grupos");
          break;
        case "JEFE_CARRERA":
          router.push("/jefatura/grupos");
          break;
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/perfil");
      }
    } catch (err: unknown) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      sessionStorage.setItem("sc_login_attempts", nextAttempts.toString());

      if (nextAttempts >= 5) {
        const lockTime = Date.now() + 60000;
        sessionStorage.setItem("sc_login_lock", lockTime.toString());
        setLockSecondsRemaining(60);
        setErrorMsg("Demasiados intentos fallidos. Interfaz pausada por seguridad.");
      } else {
        // Mensaje genérico contra enumeración de cuentas
        setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reenviarVerificacion = async () => {
    if (!unverifiedUser) return;
    try {
      await sendEmailVerification(unverifiedUser);
      setResendStatus("Enlace reenviado. Revisa tu bandeja institucional.");
    } catch {
      setResendStatus("No se pudo enviar el correo en este momento.");
    }
  };

  const bloqueado = lockSecondsRemaining > 0;

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[130px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-md w-full space-y-6 bg-slate-900/70 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center mx-auto text-blue-400 mb-2 font-mono font-bold text-xl shadow-inner">
            SC
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Acceso Institucional
          </h2>
          <p className="text-xs text-slate-400">
            SecureCampus · Control de Acceso Perimetral Blindado
          </p>
        </div>

        {/* Notificación de Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{errorMsg}</p>
              {unverifiedUser && (
                <button
                  type="button"
                  onClick={reenviarVerificacion}
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-semibold mt-1"
                >
                  <Send className="w-3 h-3" /> Reenviar enlace de verificación
                </button>
              )}
              {resendStatus && (
                <p className="text-emerald-400 font-semibold">{resendStatus}</p>
              )}
            </div>
          </div>
        )}

        {/* Notificación de Bloqueo Activo */}
        {bloqueado && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Pausa preventiva: reintenta en {lockSecondsRemaining}s</span>
          </div>
        )}

        {/* Formulario */}
        <form className="space-y-4" onSubmit={handleLogin}>
          
          {/* Correo */}
          <div>
            <label 
              htmlFor="correo" 
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
            >
              Correo Institucional
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                disabled={bloqueado}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="l22280388@toluca.tecnm.mx"
                className="appearance-none block w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-inner disabled:opacity-50"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
            >
              Contraseña
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={mostrarPassword ? "text" : "password"}
                required
                disabled={bloqueado}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="appearance-none block w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-inner disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {mostrarPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Enlace y Etiquetas */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Token RBAC
            </span>
            <Link
              href="/recuperar"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading || bloqueado}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? "Comprobando..." : bloqueado ? `Pausado (${lockSecondsRemaining}s)` : "Iniciar Sesión"}
          </button>
        </form>

      </div>
    </div>
  );
}