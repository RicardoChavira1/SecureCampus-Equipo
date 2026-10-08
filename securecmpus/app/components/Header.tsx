"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  ShieldAlert, 
  LogIn,
  GraduationCap
} from "lucide-react";

export type RolUsuario = "ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN" | null;

interface DatosSesion {
  nombre: string;
  rol: RolUsuario;
  correo: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<DatosSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Escucha de sesión en tiempo real contra Firebase Auth + Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setPerfil(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      try {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setPerfil({
            nombre: data.nombre || user.displayName || "Usuario Institucional",
            rol: data.rol || null,
            correo: data.correo || user.email || "",
          });
        } else {
          setPerfil({
            nombre: user.displayName || "Usuario",
            rol: null,
            correo: user.email || "",
          });
        }
      } catch (error) {
        console.error("Error al sincronizar perfil en Header:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Cierre del dropdown al hacer clic afuera o con tecla Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleCerrarSesion = async () => {
    setMenuAbierto(false);
    await signOut(auth);
    router.push("/login");
  };

  const rolActivo = perfil?.rol || null;
  const nombreCorto = perfil?.nombre ? perfil.nombre.split(" ")[0] : "Usuario";

  // Función auxiliar para resaltar pestaña activa en la barra
  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return `px-2.5 py-1.5 rounded-lg transition-all text-xs font-semibold ${
      isActive
        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
    }`;
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logotipo Institucional */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 border border-blue-400/30 rounded-xl flex items-center justify-center font-black text-white text-base shadow-inner group-hover:bg-blue-500 transition-colors">
              SC
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white group-hover:text-blue-200 transition-colors">
                SecureCampus
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> SDLC Seguro
              </span>
            </div>
          </Link>
        </div>

        {/* Barra de Navegación por Rol */}
        <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          
          {/* Navegación del Rol ESTUDIANTE */}
          {rolActivo === "ESTUDIANTE" && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-300 mr-2">
              <Link href="/estudiante/calificaciones" className={linkClass("/estudiante/calificaciones")}>
                Calificaciones
              </Link>
              <Link href="/estudiante/carga" className={linkClass("/estudiante/carga")}>
                Carga
              </Link>
              <Link href="/estudiante/kardex" className={linkClass("/estudiante/kardex")}>
                Kárdex
              </Link>
              <Link href="/estudiante/solicitudes" className={linkClass("/estudiante/solicitudes")}>
                Solicitudes
              </Link>
              <Link href="/documentos" className={linkClass("/documentos")}>
                Documentos
              </Link>
            </div>
          )}

          {/* Navegación del Rol PROFESOR */}
          {rolActivo === "PROFESOR" && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-300 mr-2">
              <Link href="/profesor/grupos" className={linkClass("/profesor/grupos")}>
                Mis Grupos
              </Link>
            </div>
          )}

          {/* Navegación del Rol JEFE_CARRERA */}
          {rolActivo === "JEFE_CARRERA" && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-300 mr-2">
              <Link href="/jefatura/grupos" className={linkClass("/jefatura/grupos")}>
                Gestión de Grupos
              </Link>
            </div>
          )}

          {/* Navegación del Rol ADMIN */}
          {rolActivo === "ADMIN" && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Link 
                href="/admin/dashboard" 
                className={linkClass("/admin/dashboard")}
              >
                Panel Usuarios
              </Link>
              <Link 
                href="/admin/auditoria" 
                className={`${linkClass("/admin/auditoria")} text-rose-400 flex items-center gap-1`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Bitácora Forense
              </Link>
            </div>
          )}

          {/* Estado de la Sesión / Botón o Dropdown */}
          {loading ? (
            <div className="w-24 h-8 bg-slate-800/60 rounded-xl animate-pulse" />
          ) : currentUser && perfil ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-[11px] flex items-center justify-center">
                  {nombreCorto.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[11px] font-bold text-white leading-tight">
                    {nombreCorto}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 leading-tight">
                    {rolActivo || "ACTIVO"}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${menuAbierto ? "rotate-180" : ""}`} />
              </button>

              {/* Menú Desplegable */}
              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1">
                  <div className="px-3.5 py-2.5 border-b border-slate-800/80 mb-1">
                    <p className="text-xs font-bold text-white truncate">{perfil.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{perfil.correo}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60">
                      {rolActivo}
                    </span>
                  </div>

                  <Link
                    href="/perfil"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    <span>Mi Expediente</span>
                  </Link>

                  {rolActivo === "ESTUDIANTE" && (
                    <Link
                      href="/estudiante/calificaciones"
                      onClick={() => setMenuAbierto(false)}
                      className="flex md:hidden items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      <span>Calificaciones</span>
                    </Link>
                  )}

                  {rolActivo === "ADMIN" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-300 hover:bg-slate-800/70 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Panel Administrador</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-800/80 my-1" />

                  <button
                    type="button"
                    onClick={handleCerrarSesion}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
}