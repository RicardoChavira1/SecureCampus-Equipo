"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Clock, 
  Send, 
  KeyRound,
  CheckCircle2
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [noticiaExito, setNoticiaExito] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<any | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  
  // Rate Limiting
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  const DOMINIOS_VALIDOS = ["@toluca.tecnm.mx", "@ittoluca.edu.mx"];
  const MAX_INTENTOS = 5;
  const TIEMPO_BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos

  // Limpieza total del bloqueo en cliente
  const limpiarBloqueoLocal = () => {
    localStorage.removeItem("sc_login_lock");
    localStorage.removeItem("sc_login_attempts");
    localStorage.removeItem("sc_blocked_email");
    setFailedAttempts(0);
    setLockSecondsRemaining(0);
    setErrorMsg("");
  };

  // 1. Sincronización inicial del temporizador persistido
  useEffect(() => {
    const savedLock = localStorage.getItem("sc_login_lock");
    const savedAttempts = localStorage.getItem("sc_login_attempts");
    const savedEmail = localStorage.getItem("sc_blocked_email");
    
    if (savedEmail && !correo) {
      setCorreo(savedEmail);
    }

    if (savedAttempts) {
      setFailedAttempts(parseInt(savedAttempts, 10));
    }

    if (savedLock) {
      const lockUntil = parseInt(savedLock, 10);
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setLockSecondsRemaining(remaining);
      } else {
        limpiarBloqueoLocal();
      }
    }
  }, []);

  // 2. Temporizador regresivo local
  useEffect(() => {
    if (lockSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockSecondsRemaining((prev) => {
        if (prev <= 1) {
          limpiarBloqueoLocal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockSecondsRemaining]);

  // 3. Listener Reactivo en Tiempo Real con Firestore (Crucial para desbloquear entre navegadores)
  useEffect(() => {
    const correoObjetivo = (correo || localStorage.getItem("sc_blocked_email") || "").trim().toLowerCase();
    if (!correoObjetivo || !DOMINIOS_VALIDOS.some((d) => correoObjetivo.endsWith(d))) {
      return;
    }

    const q = query(collection(db, "usuarios"), where("correo", "==", correoObjetivo));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const data = userDoc.data();
        const ahora = Date.now();
        const fechaBloqueo = data.bloqueadoEn?.toMillis ? data.bloqueadoEn.toMillis() : 0;

        // Caso A: Ya pasaron los 15 minutos reales en Firestore -> Auto-desbloqueo
        if (data.bloqueadoPorSeguridad && fechaBloqueo > 0 && (ahora - fechaBloqueo) >= TIEMPO_BLOQUEO_MS) {
          try {
            await updateDoc(doc(db, "usuarios", userDoc.id), {
              activo: true,
              bloqueadoPorSeguridad: false,
              intentosFallidos: 0,
              desbloqueadoEn: serverTimestamp()
            });
          } catch (e) {
            console.warn("Auto-desbloqueo diferido:", e);
          }
          limpiarBloqueoLocal();
          setNoticiaExito("El periodo de 15 minutos concluyó. Tu cuenta fue restablecida.");
          return;
        }

        // Caso B: El Admin lo desbloqueó en Firestore (activo === true && !bloqueadoPorSeguridad)
        if (data.activo === true && !data.bloqueadoPorSeguridad) {
          limpiarBloqueoLocal();
          setNoticiaExito("Tu cuenta fue desbloqueada por el Administrador. Ya puedes acceder.");
        }
      }
    });

    return () => unsubscribe();
  }, [correo, lockSecondsRemaining]);

  const formatearTiempo = (segundosTotales: number) => {
    const min = Math.floor(segundosTotales / 60);
    const seg = segundosTotales % 60;
    return `${min}:${seg < 10 ? "0" : ""}${seg}`;
  };

  // 4. Asentar bloqueo preventivo directo en Firestore
  const bloquearUsuarioEnFirestore = async (correoObjetivo: string) => {
    try {
      const q = query(collection(db, "usuarios"), where("correo", "==", correoObjetivo));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDocRef = doc(db, "usuarios", snap.docs[0].id);
        await updateDoc(userDocRef, {
          activo: false,
          bloqueadoPorSeguridad: true,
          intentosFallidos: 5,
          bloqueadoEn: serverTimestamp()
        });
      }
    } catch (error) {
      console.warn("No se pudo asentar el bloqueo en Firestore:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSecondsRemaining > 0) return;

    setLoading(true);
    setErrorMsg("");
    setNoticiaExito("");
    setUnverifiedUser(null);
    setResendStatus(null);

    const correoNormalizado = correo.trim().toLowerCase();
    const esDominioValido = DOMINIOS_VALIDOS.some((d) => correoNormalizado.endsWith(d));

    if (!esDominioValido) {
      setLoading(false);
      setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
      return;
    }

    try {
      // 1. Autenticación en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, correoNormalizado, password);
      const user = userCredential.user;

      // 2. Comprobación en Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        await signOut(auth);
        setErrorMsg("Credenciales de acceso inválidas o usuario inactivo.");
        setLoading(false);
        return;
      }

      const userData = userSnapshot.data();
      const ahora = Date.now();
      const fechaBloqueo = userData.bloqueadoEn?.toMillis ? userData.bloqueadoEn.toMillis() : 0;

      // 3. Verificación de expiración de los 15 minutos al loguear
      if (userData.bloqueadoPorSeguridad && fechaBloqueo > 0 && (ahora - fechaBloqueo) >= TIEMPO_BLOQUEO_MS) {
        await updateDoc(userDocRef, {
          activo: true,
          bloqueadoPorSeguridad: false,
          intentosFallidos: 0,
          desbloqueadoEn: serverTimestamp()
        });
        userData.activo = true;
        userData.bloqueadoPorSeguridad = false;
        limpiarBloqueoLocal();
      }

      // 4. Validación de cuenta bloqueada
      if (userData.activo === false || userData.bloqueadoPorSeguridad === true) {
        await signOut(auth);
        setErrorMsg("Cuenta bloqueada por seguridad. Contacta al Administrador para reactivación inmediata.");
        setLoading(false);
        return;
      }

      // Éxito: limpiar contadores
      limpiarBloqueoLocal();

      // Redirección por Rol (RBAC)
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
      localStorage.setItem("sc_login_attempts", nextAttempts.toString());

      if (nextAttempts >= MAX_INTENTOS) {
        const lockTime = Date.now() + TIEMPO_BLOQUEO_MS;
        localStorage.setItem("sc_login_lock", lockTime.toString());
        localStorage.setItem("sc_blocked_email", correoNormalizado); // Guardar correo bloqueado
        setLockSecondsRemaining(Math.ceil(TIEMPO_BLOQUEO_MS / 1000));
        setErrorMsg("Has superado 5 intentos. Interfaz pausada por 15 minutos o contacta al Administrador.");
        
        await bloquearUsuarioEnFirestore(correoNormalizado);
      } else {
        const restantes = MAX_INTENTOS - nextAttempts;
        setErrorMsg(`Credenciales inválidas. (${restantes} intento${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""})`);
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[130px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-md w-full space-y-6 bg-slate-900/70 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        
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

        {/* Notificación cuando el Admin desbloquea */}
        {noticiaExito && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticiaExito}</span>
          </div>
        )}

        {/* Notificación de Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{errorMsg}</p>
              {bloqueado && (
                <div className="pt-2">
                  <Link
                    href="/recuperar"
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold underline"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Restablecer contraseña ahora
                  </Link>
                </div>
              )}
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

        {/* Indicador de Bloqueo */}
        {bloqueado && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Bloqueo preventivo:</span>
            </div>
            <span className="font-bold text-amber-200">{formatearTiempo(lockSecondsRemaining)}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* El input de correo NUNCA se deshabilita para que el listener pueda seguir funcionando */}
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
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="l22280999@toluca.tecnm.mx"
                className="appearance-none block w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-inner"
              />
            </div>
          </div>

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

          <button
            type="submit"
            disabled={loading || bloqueado}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading 
              ? "Comprobando..." 
              : bloqueado 
              ? `Pausado (${formatearTiempo(lockSecondsRemaining)})` 
              : "Iniciar Sesión"}
          </button>
        </form>

      </div>
    </div>
  );
}