"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { 
  ShieldCheck, 
  ArrowLeft, 
  LogOut, 
  BookOpen, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

interface CalificacionMateria {
  id: string;
  semestre: number;
  nombre: string;
  creditos: number;
  unidades: (number | null)[];
  calificacionFinal: number | null;
}

export default function CalificacionesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [calificaciones, setCalificaciones] = useState<CalificacionMateria[]>([]);
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
        // 1. Verificación de Rol
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setErrorMsg("No se encontró el expediente escolar asociado a esta cuenta.");
          setLoading(false);
          return;
        }

        const dataUsuario = userDocSnap.data();
        if (dataUsuario.rol !== "ESTUDIANTE" && dataUsuario.rol !== "ADMIN") {
          setErrorMsg("Acceso restringido: Esta vista es exclusiva para alumnos matriculados.");
          setLoading(false);
          return;
        }

        // 2. Consulta a la base de datos ligada exclusivamente al usuario autenticado (Anti-IDOR)
        const q = query(
          collection(db, "calificaciones"),
          where("alumnoUid", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        const materiasDb: CalificacionMateria[] = [];
        querySnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          materiasDb.push({
            id: docSnap.id,
            semestre: d.semestre || 9,
            nombre: d.materia || "Materia sin nombre",
            creditos: d.creditos || 5,
            unidades: d.unidades || [null, null, null, null, null, null, null, null, null],
            calificacionFinal: d.calificacionFinal ?? null,
          });
        });

        setCalificaciones(materiasDb);
      } catch (err: unknown) {
        setErrorMsg("No se pudo cargar la información académica en este momento. Intenta más tarde.");
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
        <p className="text-slate-400 text-xs font-medium">Consultando expediente académico...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Aviso del Sistema</h2>
        <p className="text-xs text-rose-300">{errorMsg}</p>
        <Link
          href="/perfil"
          className="inline-block px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          Regresar a mi Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      {/* Cabecera Institucional */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-blue-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Portal del Estudiante · Periodo Escolar Vigente</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Consulta de Calificaciones
          </h1>
          <p className="text-xs text-slate-400">
            TecNM / Instituto Tecnológico de Toluca · Reporte Oficial de Evaluación
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
            onClick={handleCerrarSesion}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Estado Vacío Institucional (Sin fugas técnicas) */}
      {calificaciones.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Sin calificaciones registradas para este periodo</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Actualmente no se tienen actas de evaluación emitidas o capturadas por los docentes. Si consideras que se trata de una inconsistencia con tu carga académica, comunícate con la División de Estudios Profesionales o Servicios Escolares.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">Sem.</th>
                  <th className="px-4 py-3.5">Materia</th>
                  <th className="px-4 py-3.5 text-center">Créd.</th>
                  <th className="px-3 py-3.5 text-center">U1</th>
                  <th className="px-3 py-3.5 text-center">U2</th>
                  <th className="px-3 py-3.5 text-center">U3</th>
                  <th className="px-3 py-3.5 text-center">U4</th>
                  <th className="px-3 py-3.5 text-center">U5</th>
                  <th className="px-3 py-3.5 text-center">U6</th>
                  <th className="px-3 py-3.5 text-center">U7</th>
                  <th className="px-3 py-3.5 text-center">U8</th>
                  <th className="px-3 py-3.5 text-center">U9</th>
                  <th className="px-4 py-3.5 text-center text-blue-400 font-bold">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {calificaciones.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400">{m.semestre}</td>
                    <td className="px-4 py-3 font-semibold text-white font-sans">{m.nombre}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{m.creditos}</td>
                    {m.unidades.map((u, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        {u !== null ? (
                          <span className={`px-2 py-0.5 rounded ${u >= 70 ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-slate-300'}`}>
                            {u}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-white">
                      {m.calificacionFinal ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pie Institucional */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          Registros avalados bajo política de consulta confidencial del alumno
        </span>
        <span className="text-slate-500 font-medium">Sistema Integral de Información Escolar</span>
      </div>
    </div>
  );
}