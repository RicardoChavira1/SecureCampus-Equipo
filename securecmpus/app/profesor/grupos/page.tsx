"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, collection, query, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { 
  ShieldCheck, 
  ArrowLeft, 
  LogOut, 
  Save, 
  CheckCircle, 
  AlertCircle,
  FileEdit
} from "lucide-react";

interface ActaAlumno {
  id: string;
  alumnoNombre: string;
  matricula: string;
  materia: string;
  unidades: (number | null)[];
  calificacionFinal: number | null;
}

export default function ProfesorGruposPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [actas, setActas] = useState<ActaAlumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [noticia, setNoticia] = useState<string | null>(null);
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

        // Carga de actas escolares
        const q = query(collection(db, "calificaciones"));
        const snap = await getDocs(q);
        const lista: ActaAlumno[] = [];
        snap.forEach((d) => {
          const data = d.data();
          lista.push({
            id: d.id,
            alumnoNombre: data.alumnoNombre || "ESTUDIANTE",
            matricula: data.matricula || "S/M",
            materia: data.materia || "DESARROLLO SEGURO",
            unidades: data.unidades || [null, null, null],
            calificacionFinal: data.calificacionFinal ?? null,
          });
        });

        setActas(lista);
      } catch (err) {
        setErrorMsg("Error al obtener listas docentes.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCalificacionChange = (actaId: string, indexUnidad: number, valor: string) => {
    const num = valor === "" ? null : Math.min(100, Math.max(0, parseInt(valor, 10) || 0));
    setActas((prev) =>
      prev.map((acta) => {
        if (acta.id !== actaId) return acta;
        const nuevasUnidades = [...acta.unidades];
        nuevasUnidades[indexUnidad] = num;
        return { ...acta, unidades: nuevasUnidades };
      })
    );
  };

  const guardarCalificacion = async (acta: ActaAlumno) => {
    setGuardandoId(acta.id);
    setNoticia(null);
    try {
      const validas = acta.unidades.filter((u) => u !== null) as number[];
      const promedio = validas.length > 0 ? Math.round(validas.reduce((a, b) => a + b, 0) / validas.length) : null;

      await updateDoc(doc(db, "calificaciones", acta.id), {
        unidades: acta.unidades,
        calificacionFinal: promedio,
      });

      setNoticia(`Calificaciones de ${acta.alumnoNombre} guardadas con éxito en Firestore.`);
    } catch (err) {
      alert("Error al asentar notas en el servidor.");
    } finally {
      setGuardandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Cargando listas de evaluación...</p>
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
    <div className="space-y-6 py-6 max-w-6xl mx-auto px-4">
      {/* Encabezado Docente */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portal Docente · Captura Oficial de Actas</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Grupos Académicos Asignados
          </h1>
          <p className="text-xs text-slate-400">
            Ingreso y asentamiento directo de calificaciones para alumnos matriculados
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
            onClick={() => { signOut(auth); router.push("/login"); }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {noticia && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{noticia}</span>
        </div>
      )}

      {/* Tabla de Actas para el Profesor */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Materia</th>
              <th className="px-3 py-3 text-center">U1</th>
              <th className="px-3 py-3 text-center">U2</th>
              <th className="px-3 py-3 text-center">U3</th>
              <th className="px-4 py-3 text-center">Final</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {actas.map((acta) => (
              <tr key={acta.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-bold text-white">{acta.matricula}</td>
                <td className="px-4 py-3 font-sans text-slate-200">{acta.alumnoNombre}</td>
                <td className="px-4 py-3 font-sans text-slate-400">{acta.materia}</td>
                {[0, 1, 2].map((idx) => (
                  <td key={idx} className="px-3 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={acta.unidades[idx] ?? ""}
                      onChange={(e) => handleCalificacionChange(acta.id, idx, e.target.value)}
                      placeholder="-"
                      className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-center text-white text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-bold text-emerald-400">
                  {acta.calificacionFinal ?? "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => guardarCalificacion(acta)}
                    disabled={guardandoId === acta.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-sans font-semibold transition disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{guardandoId === acta.id ? "Guardando..." : "Guardar"}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}