"use client";

import Link from "next/link";
import { useState } from "react";

// Tipado de roles según el análisis de arquitectura
export type RolUsuario = "ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN" | null;

interface HeaderProps {
  rolActivo?: RolUsuario;
  nombreUsuario?: string;
}

export default function Header({ rolActivo = null, nombreUsuario = "Usuario" }: HeaderProps) {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logotipo y Nombre del Sistema */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow">
              SC
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">SecureCampus</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">
                SDLC Seguro
              </span>
            </div>
          </Link>
        </div>

        {/* Navegación Condicional según el Rol */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          {rolActivo === "ESTUDIANTE" && (
            <>
              <Link href="/estudiante/calificaciones" className="text-slate-300 hover:text-white transition">
                Calificaciones
              </Link>
              <Link href="/estudiante/solicitudes" className="text-slate-300 hover:text-white transition">
                Solicitudes
              </Link>
              <Link href="/estudiante/documentos" className="text-slate-300 hover:text-white transition">
                Documentos
              </Link>
            </>
          )}

          {rolActivo === "PROFESOR" && (
            <>
              <Link href="/profesor/grupos" className="text-slate-300 hover:text-white transition">
                Mis Grupos
              </Link>
              <Link href="/profesor/calificaciones" className="text-slate-300 hover:text-white transition">
                Actas
              </Link>
            </>
          )}

          {rolActivo === "JEFE_CARRERA" && (
            <>
              <Link href="/jefatura/profesores" className="text-slate-300 hover:text-white transition">
                Docentes
              </Link>
              <Link href="/jefatura/grupos" className="text-slate-300 hover:text-white transition">
                Grupos
              </Link>
              <Link href="/jefatura/inscripciones" className="text-slate-300 hover:text-white transition">
                Inscripciones
              </Link>
            </>
          )}

          {rolActivo === "ADMIN" && (
            <Link href="/admin/dashboard" className="text-amber-400 hover:text-amber-300 font-semibold transition">
              Auditoría y Roles
            </Link>
          )}

          {/* Menú de Usuario / Sesión */}
          {rolActivo ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <Link
                href="/perfil"
                className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 px-3 py-1.5 rounded-md text-slate-200 transition"
              >
                {nombreUsuario} ({rolActivo})
              </Link>
              <Link
                href="/login"
                className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
              >
                Salir
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-md font-semibold transition shadow"
            >
              Acceso
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}