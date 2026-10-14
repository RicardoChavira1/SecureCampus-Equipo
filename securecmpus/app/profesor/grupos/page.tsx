"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { 
  ShieldCheck, 
  ArrowLeft, 
  LogOut, 
  Users, 
  BookOpen, 
  Clock, 
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface GrupoDocente {
  id: string;
  claveMateria: string;
  nombreMateria: string;
  periodo: string;
  horario: string;
  cupoMaximo: number;
  inscritosActuales: number;
  numeroUnidades: number;
}

export default function ProfesorGruposPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [grupos, setGrupos] = useState<GrupoDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
        if (!userDoc.exists() || (userDoc.data().rol !== "PROFESOR" && userDoc.data().rol !== "ADMIN")) {
          setErrorMsg("Acceso restringido: Vista exclusiva para Docentes autorizados.");
          setLoading(false);
          return;
        }

        const esSysAdmin = userDoc.data().rol === "ADMIN";

        // Obtener grupos del docente o todos si es ADMIN
        const qGrupos = esSysAdmin
          ? query(collection(db, "grupos"))
          : query(collection(db, "grupos"), where("profesorUid", "==", currentUser.uid));

        const [gruposSnap, inscripcionesSnap] = await Promise.all([
          getDocs(qGrupos),
          getDocs(collection(db, "inscripciones"))
        ]);

        // Conteo real de inscripciones por grupo
        const conteoInscripciones = new Map<string, number>();
        inscripcionesSnap.forEach((insDoc) => {
          const gId = insDoc.data().grupoId;
          if (gId) {
            conteoInconteo(conteoInscripciones, gId);
          }
        });

        function conteoInconteo(mapa: Map<string, number>, id: string) {
          mapa.set(id, (mapa.get(id) || 0) + 1);
        }

        const lista: GrupoDocente[] = gruposSnap.docs.map((d) => {
          const data = d.data();
          const inscritosReales = conteoInscripciones.get(d.id) || 0;
          const inscritosDoc = Math.max(0, Number(data.inscritosActuales || 0));

          return {
            id: d.id,
            claveMateria: data.claveMateria || "S/C",
            nombreMateria: data.nombreMateria || "Materia sin título",
            periodo: data.periodo || "2026-2",
            horario: data.horario || "POR DEFINIR",
            cupoMaximo: Math.max(0, Number(data.cupoMaximo || 0)),
            inscritosActuales: Math.max(inscritosDoc, inscritosReales),
            numeroUnidades: Math.max(1, Number(data.numeroUnidades || 3)),
          };
        });

        setGrupos(lista);
      } catch (err) {
        console.error("Error al cargar grupos del docente:", err);
        setErrorMsg("Error al sincronizar los grupos asignados.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Cargando grupos académicos...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Acceso Denegado</h2>
        <p className="text-xs text-rose-300">{errorMsg}</p>
        <Link href="/perfil" className="inline-block px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300">
          Volver a mi Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portal Docente · Asignación Académica</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Grupos Académicos Asignados
          </h1>
          <p className="text-xs text-slate-400">
            Selecciona un grupo para capturar y asentar las calificaciones oficiales
          </p>
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
            onClick={async () => { await signOut(auth); router.push("/login"); }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid de Grupos */}
      {grupos.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No tienes grupos asignados</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            La Jefatura de Carrera aún no te ha vinculado a grupos para este periodo escolar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-lg space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1">
                  <span>{grupo.claveMateria}</span>
                  <span>{grupo.periodo}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {grupo.nombreMateria}
                </h2>
              </div>

              <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{grupo.horario}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Inscritos: <strong className="text-white">{grupo.inscritosActuales}</strong> / {grupo.cupoMaximo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Unidades Temáticas: <strong className="text-emerald-400">{grupo.numeroUnidades} U</strong>
                  </span>
                </div>
              </div>

              <Link
                href={`/profesor/calificaciones?grupoId=${grupo.id}`}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Capturar Calificaciones</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}