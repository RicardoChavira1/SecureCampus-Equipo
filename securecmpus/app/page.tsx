import Link from "next/link";
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Briefcase, 
  Lock, 
  ArrowRight,
  FileText,
  Activity,
  KeyRound,
  Server,
  Cpu,
  Fingerprint
} from "lucide-react";

export default function Home() {
  const modulos = [
    {
      rol: "Estudiante",
      tag: "Alumno",
      icono: <GraduationCap className="w-6 h-6 text-blue-400" />,
      desc: "Consulta de historial académico, calificaciones en tiempo real y descarga de constancias con firma digital.",
      ruta: "/estudiante/calificaciones",
      border: "border-blue-500/20 hover:border-blue-500/60",
      accent: "from-blue-500/10 to-transparent",
      badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    },
    {
      rol: "Profesor",
      tag: "Docente",
      icono: <UserCheck className="w-6 h-6 text-emerald-400" />,
      desc: "Gestión de grupos asignados, control de listas de asistencia y captura protegida de actas de evaluación.",
      ruta: "/profesor/grupos",
      border: "border-emerald-500/20 hover:border-emerald-500/60",
      accent: "from-emerald-500/10 to-transparent",
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    },
    {
      rol: "Jefe de Carrera",
      tag: "Coordinación",
      icono: <Briefcase className="w-6 h-6 text-indigo-400" />,
      desc: "Padrón docente, apertura de secciones académicas y balanceo de matriculaciones con trazabilidad de cambios.",
      ruta: "/jefatura/grupos",
      border: "border-indigo-500/20 hover:border-indigo-500/60",
      accent: "from-indigo-500/10 to-transparent",
      badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    },
    {
      rol: "Administrador",
      tag: "SysAdmin",
      icono: <Lock className="w-6 h-6 text-amber-400" />,
      desc: "Administración integral RBAC, revocación de credenciales activas y supervisión forense de logs inmutables.",
      ruta: "/admin/dashboard",
      border: "border-amber-500/20 hover:border-amber-500/60",
      accent: "from-amber-500/10 to-transparent",
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    },
  ];

  const pilaresSeguridad = [
    {
      icono: <Fingerprint className="w-5 h-5 text-blue-400" />,
      titulo: "Autenticación & Dominio",
      detalle: "Acceso estricto limitado a dominios institucionales @toluca.tecnm.mx y @ittoluca.edu.mx con tokens JWT.",
    },
    {
      icono: <KeyRound className="w-5 h-5 text-emerald-400" />,
      titulo: "Aislamiento RBAC & Anti-IDOR",
      detalle: "Validación de propiedad en cada documento mediante Firestore Rules, impidiendo la manipulación de IDs ajenos.",
    },
    {
      icono: <Server className="w-5 h-5 text-amber-400" />,
      titulo: "Auditoría Forense Inmutable",
      detalle: "Bitácora en tiempo real donde las inserciones son permanentes y la edición o eliminación está bloqueada por diseño.",
    },
  ];

  return (
    <div className="relative space-y-16 py-8">
      {/* Resplandor decorativo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[130px] -z-10 pointer-events-none rounded-full" />

      {/* Sección Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2.5 bg-slate-900/80 border border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300 shadow-inner backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Secure SDLC · IT Toluca · Ciclo de Vida Seguro</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Gestión Escolar con <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Control Perimetral Blindado
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Plataforma centralizada bajo el modelo de Mínimo Privilegio (RBAC), consultas 
          parametrizadas contra inyecciones y trazabilidad de acciones en tiempo real.
        </p>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="group px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-blue-600/25 flex items-center gap-2 hover:scale-[1.02]"
          >
            Ingresar al Portal Institucional
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/recuperar"
            className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl font-semibold text-sm transition-all backdrop-blur-sm hover:text-white"
          >
            Recuperar Contraseña
          </Link>
        </div>

        {/* Barra de métricas institucionales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/60 max-w-2xl mx-auto text-center">
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
            <span className="block text-2xl font-black text-white font-mono">7</span>
            <span className="text-[11px] text-slate-400 font-medium">Colecciones Firestore</span>
          </div>
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
            <span className="block text-2xl font-black text-emerald-400 font-mono">100%</span>
            <span className="text-[11px] text-slate-400 font-medium">Protegido Anti-IDOR</span>
          </div>
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
            <span className="block text-2xl font-black text-blue-400 font-mono">4</span>
            <span className="text-[11px] text-slate-400 font-medium">Roles Segregados</span>
          </div>
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
            <span className="block text-2xl font-black text-indigo-400 font-mono">256-bit</span>
            <span className="text-[11px] text-slate-400 font-medium">Cifrado de Tokens</span>
          </div>
        </div>
      </section>

      {/* Portales por Rol */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Portales del Sistema por Rol
            </h2>
            <p className="text-xs text-slate-400">
              Cada vista cuenta con reglas de validación en tiempo de ejecución.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            10 Vistas Técnicas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {modulos.map((m, index) => (
            <Link
              key={index}
              href={m.ruta}
              className={`relative p-6 rounded-2xl bg-gradient-to-b ${m.accent} bg-slate-900/70 border ${m.border} transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-lg backdrop-blur-sm overflow-hidden`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-slate-800/90 rounded-xl w-fit border border-slate-700/50 shadow-inner group-hover:scale-105 transition-transform">
                    {m.icono}
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${m.badge}`}>
                    {m.tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {m.rol}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-blue-400">
                <span>Ingresar al módulo</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tarjetas de Pilares Defensivos (Blue Team) */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          Controles Defensivos Activos en la Arquitectura
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pilaresSeguridad.map((p, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/70 flex flex-col gap-2.5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {p.icono}
                </div>
                <h4 className="font-semibold text-white text-sm">{p.titulo}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {p.detalle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Barra de estado en vivo */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <p>
            <strong className="text-slate-200">Políticas Backend Activas:</strong> Autorización por token JWT, consultas parametrizadas y validación de propiedad de registros en cada petición.
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] shrink-0">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>OWASP Top 10 · 2026 Audit Ready</span>
        </div>
      </section>
    </div>
  );
}