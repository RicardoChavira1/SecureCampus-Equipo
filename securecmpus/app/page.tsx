import Link from "next/link";
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Briefcase, 
  Lock, 
  ArrowRight,
  FileText
} from "lucide-react";

export default function Home() {
  const modulos = [
    {
      rol: "Estudiante",
      icono: <GraduationCap className="w-6 h-6 text-blue-400" />,
      desc: "Consulta de calificaciones, descarga de constancias y seguimiento de solicitudes.",
      ruta: "/estudiante/calificaciones",
      color: "border-blue-900/40 hover:border-blue-500",
    },
    {
      rol: "Profesor",
      icono: <UserCheck className="w-6 h-6 text-emerald-400" />,
      desc: "Gestión de grupos asignados, listas de alumnos y captura de actas de evaluación.",
      ruta: "/profesor/grupos",
      color: "border-emerald-900/40 hover:border-emerald-500",
    },
    {
      rol: "Jefe de Carrera",
      icono: <Briefcase className="w-6 h-6 text-indigo-400" />,
      desc: "Padrón docente, apertura de grupos académicos y asignación de matriculaciones.",
      ruta: "/jefatura/grupos",
      color: "border-indigo-900/40 hover:border-indigo-500",
    },
    {
      rol: "Administrador",
      icono: <Lock className="w-6 h-6 text-amber-400" />,
      desc: "Gestión central de usuarios, asignación de permisos (RBAC) y bitácora de auditoría.",
      ruta: "/admin/dashboard",
      color: "border-amber-900/40 hover:border-amber-500",
    },
  ];

  return (
    <div className="space-y-12 py-6">
      {/* Sección Hero Institucional */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full text-xs font-semibold text-blue-300">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Plataforma Académica Segura · Secure SDLC</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Gestión Escolar con Control de Acceso Estricto
        </h1>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Plataforma centralizada con aislamiento de privilegios (RBAC), protección 
          contra accesos no autorizados a registros (IDOR) y trazabilidad completa de operaciones.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            Ingresar al Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/recuperar"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition"
          >
            Recuperar Contraseña
          </Link>
        </div>
      </section>

      {/* Módulos y Portales del Equipo */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Portales del Sistema por Rol
          </h2>
          <span className="text-xs text-slate-500 font-mono">10 Vistas Técnicas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {modulos.map((m, index) => (
            <Link
              key={index}
              href={m.ruta}
              className={`p-6 rounded-2xl bg-slate-900/60 border ${m.color} transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group shadow-sm`}
            >
              <div className="space-y-3">
                <div className="p-3 bg-slate-800/80 rounded-xl w-fit">
                  {m.icono}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {m.rol}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-blue-400">
                <span>Acceder al módulo</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Franja de Control de Seguridad */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p>
            <strong className="text-slate-200">Políticas de Backend Activas:</strong> Autorización por token, consultas parametrizadas y validación de propiedad de registros en cada petición.
          </p>
        </div>
        <span className="text-slate-500 font-mono text-[11px] shrink-0">
          OWASP Top 10 · 2026
        </span>
      </section>
    </div>
  );
}