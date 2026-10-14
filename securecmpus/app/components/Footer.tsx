import React from "react";
import { Shield, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 text-slate-400 text-xs py-8 mt-auto">
      {/* Resplandor superior sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Fila principal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Bloque Identidad & Seguridad */}
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <p className="font-bold text-slate-200 tracking-wide text-sm">
                SecureCampus <span className="text-blue-400 font-mono text-xs">v1.0</span>
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Desarrollo Seguro (Secure SDLC) · Tecnológico Nacional de México / IT Toluca
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Arquitectura RBAC · Aislamiento Anti-IDOR · Cifrado en Reposo
            </p>
          </div>

          {/* Redes Sociales: YouTube, TikTok e Instagram */}
          <div className="flex items-center gap-3">
            {/* YouTube */}
            <a
              href="https://www.youtube.com/@rosquetobey_1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Canal de YouTube @rosquetobey_1"
              className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-red-500/60 hover:bg-red-500/10 transition-all duration-300 shadow-inner hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@rosqueto.bey"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Cuenta de TikTok @rosqueto.bey"
              className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-all duration-300 shadow-inner hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.34 6.34 0 0 0 6.34-6.32V9.08a8.16 8.16 0 0 0 4.79 1.54V7.17a4.85 4.85 0 0 1-.89-.48z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/rosquetobey1/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Perfil de Instagram @rosquetobey1"
              className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-pink-500/60 hover:bg-pink-500/10 transition-all duration-300 shadow-inner hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>

        </div>

        {/* Separador */}
        <div className="border-t border-slate-900" />

        {/* Fila inferior: Estado de sesión & Auditoría */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Perímetro Seguro Activo
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-amber-400" />
              OWASP Top 10 Compliant
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="font-mono text-[10px]">Semestre 2026</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              Términos del Servicio
            </span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              Privacidad y Datos
            </span>
          </div>

        </div>

      </div>
    </footer>
  );
}