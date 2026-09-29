"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  const DOMINIOS_VALIDOS = ["@toluca.tecnm.mx", "@ittoluca.edu.mx"];

  // Sincronización inicial con almacenamiento de sesión
  useEffect(() => {
    const savedLock = sessionStorage.getItem("sc_login_lock");
    const savedAttempts = sessionStorage.getItem("sc_login_attempts");
    
    if (savedLock && Date.now() < parseInt(savedLock, 10)) {
      setLockUntil(parseInt(savedLock, 10));
    } else {
      sessionStorage.removeItem("sc_login_lock");
    }

    if (savedAttempts) {
      setFailedAttempts(parseInt(savedAttempts, 10));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockUntil && Date.now() < lockUntil) {
      setErrorMsg("Acceso bloqueado temporalmente por reiterados intentos fallidos.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    // Normalización de entrada
    const correoNormalizado = correo.trim().toLowerCase();
    const esDominioValido = DOMINIOS_VALIDOS.some((d) => correoNormalizado.endsWith(d));

    if (!esDominioValido) {
      setLoading(false);
      setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
      return;
    }

    try {
      // 1. Autenticación contra Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, correoNormalizado, password);
      const user = userCredential.user;

      // 2. Validación de verificación de correo institucional
      if (!user.emailVerified) {
        await signOut(auth);
        setErrorMsg("Cuenta no confirmada. Valida el enlace enviado a tu correo institucional.");
        setLoading(false);
        return;
      }

      // 3. Consulta de permisos en Firestore
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

      // Limpieza de intentos tras autenticación correcta
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
        setLockUntil(lockTime);
        sessionStorage.setItem("sc_login_lock", lockTime.toString());
        setErrorMsg("Demasiados intentos fallidos. Interfaz pausada por 60 segundos.");
      } else {
        setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const bloqueado = !!(lockUntil && Date.now() < lockUntil);

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/60 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div>
          <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center mx-auto text-blue-400 mb-4 font-mono font-bold text-xl">
            SC
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Acceso Institucional
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            SecureCampus · Control de Acceso Perimetral
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="correo" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Correo Institucional
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                disabled={bloqueado}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="cuenta@toluca.tecnm.mx"
                className="appearance-none relative block w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700 placeholder-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={bloqueado}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="appearance-none relative block w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700 placeholder-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">Control: Token + Rules</span>
            <Link
              href="/recuperar"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || bloqueado}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? "Comprobando..." : bloqueado ? "Pausa por reintentos" : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}