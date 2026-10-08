"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Lock,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

interface AuditLog {
  id: string;
  usuarioCorreo?: string;
  accion: string;
  modulo: string;
  detalles: string;
  severidad: "INFO" | "WARNING" | "CRITICAL";
  fecha?: any;
}

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState("");
  const [filtroSeveridad, setFiltroSeveridad] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      // Verificación estricta de ADMIN
      const docSnap = await getDoc(doc(db, "usuarios", u.uid));
      if (!docSnap.exists() || docSnap.data().rol !== "ADMIN") {
        setErrorAcceso("Acceso Denegado: Esta vista es de uso exclusivo para Auditores y Administradores.");
        setLoading(false);
        return;
      }

      await cargarLogs();
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const cargarLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "auditoria_logs"), orderBy("fecha", "desc"), limit(50));
      const snap = await getDocs(q);
      const lista: AuditLog[] = [];
      snap.forEach((d) => {
        const data = d.data();
        lista.push({
          id: d.id,
          usuarioCorreo: data.usuarioCorreo || "SISTEMA",
          accion: data.accion || "EVENTO",
          modulo: data.modulo || "GENERAL",
          detalles: data.detalles || "",
          severidad: data.severidad || "INFO",
          fecha: data.fecha
        });
      });
      setLogs(lista);
    } catch {
      // Si la colección aún no tiene índice ordenado, carga sin orden estricto
      const snap = await getDocs(collection(db, "auditoria_logs"));
      const lista: AuditLog[] = [];
      snap.forEach((d) => {
        const data = d.data();
        lista.push({
          id: d.id,
          usuarioCorreo: data.usuarioCorreo || "SISTEMA",
          accion: data.accion || "EVENTO",
          modulo: data.modulo || "GENERAL",
          detalles: data.detalles || "",
          severidad: data.severidad || "INFO",
          fecha: data.fecha
        });
      });
      setLogs(lista);
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter((l) => {
    const matchSeveridad = filtroSeveridad === "TODOS" || l.severidad === filtroSeveridad;
    const matchBusqueda =
      l.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.detalles.toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.usuarioCorreo && l.usuarioCorreo.toLowerCase().includes(busqueda.toLowerCase()));
    return matchSeveridad && matchBusqueda;
  });

  if (errorAcceso) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <Lock className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Privilegios Insuficientes</h2>
        <p className="text-xs text-rose-300">{errorAcceso}</p>
        <Link href="/perfil" className="inline-block px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300">
          Regresar a mi Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-950/70 border border-rose-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-rose-300 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Módulo Forense · OWASP A09 Security Logging</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bitácora de Auditoría del Sistema</h1>
          <p className="text-xs text-slate-400">Trazabilidad en tiempo real de eventos, accesos y operaciones críticas</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarLogs}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Dashboard Admin
          </Link>
          <button
            onClick={() => { signOut(auth); router.push("/login"); }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por usuario, acción o detalle..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filtroSeveridad}
            onChange={(e) => setFiltroSeveridad(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="TODOS">Todas las severidades</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Severidad</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron registros de auditoría coincidentes.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.severidad === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : log.severidad === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        {log.severidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.modulo}</td>
                    <td className="px-4 py-3 font-semibold text-white">{log.accion}</td>
                    <td className="px-4 py-3 text-slate-300 font-sans text-[11px]">{log.usuarioCorreo}</td>
                    <td className="px-4 py-3 text-slate-400 font-sans text-xs">{log.detalles}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}