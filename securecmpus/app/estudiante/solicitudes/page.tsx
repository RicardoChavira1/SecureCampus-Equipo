"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowLeft,
  LogOut,
  Send,
  AlertCircle
} from "lucide-react";

interface Solicitud {
  id: string;
  tipo: string;
  motivo: string;
  estatus: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  fechaCreacion?: any;
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tipo, setTipo] = useState("CONSTANCIA_ESTUDIOS");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      await cargarSolicitudes(u.uid);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const cargarSolicitudes = async (uid: string) => {
    try {
      const q = query(collection(db, "solicitudes"), where("alumnoUid", "==", uid));
      const snap = await getDocs(q);
      const docs: Solicitud[] = [];
      snap.forEach((d) => {
        const data = d.data();
        docs.push({
          id: d.id,
          tipo: data.tipo,
          motivo: data.motivo,
          estatus: data.estatus || "PENDIENTE",
          fechaCreacion: data.fechaCreacion
        });
      });
      setSolicitudes(docs);
    } catch {
      setMensaje({ tipo: "err", texto: "No se pudieron cargar las solicitudes." });
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEnviando(true);
    setMensaje(null);

    try {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, "solicitudes"), {
        alumnoUid: user.uid,
        alumnoNombre: userData?.nombre || "ESTUDIANTE",
        matricula: userData?.matricula_nomina || "S/M",
        tipo,
        motivo: motivo.trim(),
        estatus: "PENDIENTE",
        fechaCreacion: serverTimestamp()
      });

      // Registro en bitácora forense de auditoría
      await addDoc(collection(db, "auditoria_logs"), {
        usuarioUid: user.uid,
        usuarioCorreo: user.email,
        accion: "CREAR_SOLICITUD",
        modulo: "SOLICITUDES",
        detalles: `Solicitud registrada: ${tipo}`,
        severidad: "INFO",
        fecha: serverTimestamp()
      });

      setMotivo("");
      setMensaje({ tipo: "ok", texto: "Solicitud institucional enviada correctamente." });
      await cargarSolicitudes(user.uid);
    } catch {
      setMensaje({ tipo: "err", texto: "Error al enviar la solicitud." });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Cargando trámites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-blue-300 mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Ventanilla Digital · Servicios Escolares</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Trámites y Solicitudes</h1>
          <p className="text-xs text-slate-400">Genera y da seguimiento a tus gestiones académicas oficiales</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Mi Perfil</span>
          </Link>
          <button
            onClick={() => { signOut(auth); router.push("/login"); }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs border flex items-center gap-2 ${
          mensaje.tipo === "ok" ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" : "bg-rose-950/40 border-rose-500/40 text-rose-200"
        }`}>
          {mensaje.tipo === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleCrear} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>Nueva Solicitud</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo de Trámite</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="CONSTANCIA_ESTUDIOS">Constancia de Estudios con Calificaciones</option>
              <option value="JUSTIFICANTE_MEDICO">Validación de Justificante Médico</option>
              <option value="BAJA_TEMPORAL">Solicitud de Baja Temporal</option>
              <option value="CORRECCION_CALIFICACION">Revisión de Calificación Parcial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Motivo o Justificación</label>
            <textarea
              required
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe detalladamente el motivo de tu solicitud institucional..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{enviando ? "Enviando..." : "Enviar Solicitud"}</span>
          </button>
        </form>

        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Historial de Mis Trámites</h2>

          {solicitudes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No tienes trámites registrados actualmente.
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudes.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{s.tipo.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.motivo}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                    s.estatus === "APROBADA"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : s.estatus === "RECHAZADA"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  }`}>
                    {s.estatus === "APROBADA" && <CheckCircle2 className="w-3 h-3" />}
                    {s.estatus === "RECHAZADA" && <XCircle className="w-3 h-3" />}
                    {s.estatus === "PENDIENTE" && <Clock className="w-3 h-3" />}
                    <span>{s.estatus}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}