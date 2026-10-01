"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Mail, 
  Hash, 
  BookOpen, 
  Award, 
  Activity, 
  Lock, 
  LogOut, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";

interface UsuarioData {
  nombre: string;
  correo: string;
  matricula_nomina: string;
  carrera?: string;
  especialidad?: string;
  promedioGeneral?: number;
  estatusAcademico?: string;
  rol: "ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN";
  activo: boolean;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [datos, setDatos] = useState<UsuarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // 1. Escuchar la sesión de Firebase Auth de forma segura
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        // 2. Control Defensivo Anti-IDOR: La consulta usa exclusivamente el UID verificado
        const docRef = doc(db, "usuarios", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDatos(docSnap.data() as UsuarioData);
        } else {
          // Si el UID no tiene documento en la colección de usuarios
          setErrorMsg("Ficha de identidad no localizada en el repositorio institucional.");
        }
      } catch (err: unknown) {
        setErrorMsg("Error de autorización al consultar el perfil.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCerrarSesion = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Validando identidad criptográfica...</p>
      </div>
    );
  }

  if (errorMsg || !datos) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Acceso Denegado</h2>
        <p className="text-xs text-rose-300">{errorMsg || "Usuario no autorizado."}</p>
        <button
          onClick={handleCerrarSesion}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          Volver al Login
        </button>
      </div>
    );
  }

  // Rutas de redirección según RBAC
  const rutaModulo = {
    ESTUDIANTE: "/estudiante/calificaciones",
    PROFESOR: "/profesor/grupos",
    JEFE_CARRERA: "/jefatura/grupos",
    ADMIN: "/admin/dashboard",
  }[datos.rol] || "/";

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Encabezado con Indicador de Seguridad Anti-IDOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-blue-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Identidad Verificada · Perfil Blindado Anti-IDOR</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Expediente Institucional
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            UID: {user?.uid}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={rutaModulo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
          >
            <span>Ir a mi Portal ({datos.rol})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleCerrarSesion}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tarjeta de Información Personal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Tarjeta de Identificación */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl font-bold text-white font-mono">
                {datos.nombre.charAt(0)}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Cuenta Activa" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{datos.nombre}</h2>
            <span className="inline-block mt-1 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
              ROL: {datos.rol}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado de cuenta:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {datos.activo ? "ACTIVO" : "INACTIVO"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Email Verificado:</span>
              <span className="text-blue-400 font-mono">
                {user?.emailVerified ? "SÍ" : "NO"}
              </span>
            </div>
          </div>
        </div>

        {/* Columna Central y Derecha: Desglose Académico Institucional */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Datos Académicos · Tecnológico Nacional de México
            </h3>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" /> Solo Lectura
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Número de Control / Nómina */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-blue-400" />
                Número de Control / Nómina
              </span>
              <p className="text-sm font-bold text-white font-mono">
                {datos.matricula_nomina || "22280388"}
              </p>
            </div>

            {/* Correo Institucional */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-blue-400" />
                Correo Institucional
              </span>
              <p className="text-sm font-medium text-slate-200 truncate font-mono">
                {datos.correo}
              </p>
            </div>

            {/* Carrera */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3 text-indigo-400" />
                Carrera
              </span>
              <p className="text-xs font-semibold text-white">
                {datos.carrera || "INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIONES"}
              </p>
            </div>

            {/* Especialidad */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-indigo-400" />
                Especialidad
              </span>
              <p className="text-xs font-semibold text-slate-200">
                {datos.especialidad || "INGENIERÍA DE DATOS"}
              </p>
            </div>

            {/* Promedio General */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Award className="w-3 h-3 text-emerald-400" />
                Promedio General
              </span>
              <p className="text-base font-extrabold text-emerald-400 font-mono">
                {datos.promedioGeneral ?? "85.0"}
              </p>
            </div>

            {/* Estatus Académico */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-blue-400" />
                Estatus Académico
              </span>
              <p className="text-xs font-bold text-blue-300 uppercase">
                {datos.estatusAcademico || "INSCRITO"}
              </p>
            </div>

          </div>

          {/* Aviso Defensivo */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center gap-3 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <p>
              Los campos de matrícula, rol y carrera se encuentran bloqueados bajo control de privilegios. Las modificaciones solo pueden ser realizadas por la Jefatura de División.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}