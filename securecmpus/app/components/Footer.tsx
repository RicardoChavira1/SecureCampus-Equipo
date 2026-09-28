export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Créditos de Asignatura */}
        <div>
          <p className="font-semibold text-slate-300">SecureCampus · Desarrollo Seguro (Secure SDLC)</p>
          <p className="text-[11px] text-slate-500">Control de Acceso Basado en Roles (RBAC) & Prevención IDOR/BOLA</p>
        </div>

        {/* Indicadores de Seguridad */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sesión Blindada
          </span>
          <span className="text-slate-600">|</span>
          <span>Semestre 2026</span>
        </div>

      </div>
    </footer>
  );
}