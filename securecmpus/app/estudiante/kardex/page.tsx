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
  Award, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  XCircle
} from "lucide-react";

interface MateriaKardex {
  id: string;
  semestre: number;
  clave: string;
  nombre: string;
  creditos: number;
  calificacion: number | string;
  estatus: "Aprobada" | "No aprobada" | "En curso";
  periodo: string;
}

const TOTAL_CREDITOS_CARRERA = 260;

export default function KardexPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [materiasKardex, setMateriasKardex] = useState<MateriaKardex[]>([]);
  
  const [resumen, setResumen] = useState({
    creditosAcreditados: 0,
    totalCreditos: TOTAL_CREDITOS_CARRERA,
    porcentaje: 0,
    promedioGeneral: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (!userDoc.exists()) {
          setErrorMsg("No se encontró el perfil de usuario asociado.");
          setLoading(false);
          return;
        }

        // Consultar inscripciones, grupos y calificaciones
        const [inscripcionesSnap, gruposSnap, calificacionesSnap] = await Promise.all([
          getDocs(query(collection(db, "inscripciones"), where("alumnoUid", "==", user.uid))),
          getDocs(collection(db, "grupos")),
          getDocs(query(collection(db, "calificaciones"), where("alumnoUid", "==", user.uid)))
        ]);

        const mapaGrupos = new Map<string, any>();
        gruposSnap.forEach((g) => mapaGrupos.set(g.id, g.data()));

        const mapaCalificaciones = new Map<string, any>();
        calificacionesSnap.forEach((c) => {
          const cData = c.data();
          if (cData.grupoId) {
            mapaCalificaciones.set(cData.grupoId, cData);
          }
        });

        const materiasCalculadas: MateriaKardex[] = [];
        let creditosAcumulados = 0;
        let sumaCalificacionesAprobadas = 0;
        let materiasAprobadasCount = 0;

        inscripcionesSnap.forEach((inscDoc) => {
          const inscData = inscDoc.data();
          const grupoId = inscData.grupoId;
          const grupoInfo = mapaGrupos.get(grupoId);
          const califInfo = mapaCalificaciones.get(grupoId);

          const creditosMateria = 5;
          const totalUnidadesRequeridas = Number(grupoInfo?.numeroUnidades || 3);

          const calificacionesUnidades: (number | null)[] = [];
          if (Array.isArray(califInfo?.unidades)) {
            for (let i = 0; i < totalUnidadesRequeridas; i++) {
              calificacionesUnidades.push(
                typeof califInfo.unidades[i] === "number" ? califInfo.unidades[i] : null
              );
            }
          } else if (califInfo) {
            for (let i = 1; i <= totalUnidadesRequeridas; i++) {
              const val = califInfo[`u${i}`];
              calificacionesUnidades.push(typeof val === "number" ? val : null);
            }
          }

          const unidadesEvaluadas = calificacionesUnidades.filter((u) => u !== null) as number[];
          const todasEvaluadas = unidadesEvaluadas.length === totalUnidadesRequeridas;
          const hayReprobada = unidadesEvaluadas.some((nota) => nota < 70);

          let estatus: "Aprobada" | "No aprobada" | "En curso" = "En curso";
          let notaAMostrar: number | string = "-";

          if (hayReprobada) {
            estatus = "No aprobada";
            notaAMostrar = Math.round(unidadesEvaluadas.reduce((a, b) => a + b, 0) / unidadesEvaluadas.length);
          } else if (todasEvaluadas && totalUnidadesRequeridas > 0) {
            estatus = "Aprobada";
            const prom = Math.round(unidadesEvaluadas.reduce((a, b) => a + b, 0) / totalUnidadesRequeridas);
            notaAMostrar = prom;

            creditosAcumulados += creditosMateria;
            sumaCalificacionesAprobadas += prom;
            materiasAprobadasCount += 1;
          } else {
            estatus = "En curso";
            notaAMostrar = "-";
          }

          materiasCalculadas.push({
            id: inscDoc.id,
            semestre: 1,
            clave: grupoInfo?.claveMateria || "S/C",
            nombre: grupoInfo?.nombreMateria || "Materia Inscrita",
            creditos: creditosMateria,
            calificacion: notaAMostrar,
            estatus,
            periodo: grupoInfo?.periodo || "2026-2",
          });
        });

        setMateriasKardex(materiasCalculadas);

        const promedioFinal = materiasAprobadasCount > 0 
          ? Number((sumaCalificacionesAprobadas / materiasAprobadasCount).toFixed(2)) 
          : 0;

        const porcentajeAvance = Number(((creditosAcumulados / TOTAL_CREDITOS_CARRERA) * 100).toFixed(1));

        setResumen({
          creditosAcreditados: creditosAcumulados,
          totalCreditos: TOTAL_CREDITOS_CARRERA,
          porcentaje: porcentajeAvance,
          promedioGeneral: promedioFinal,
        });

      } catch (err) {
        console.error("Error al cargar Kárdex:", err);
        setErrorMsg("Error al sincronizar el expediente reticular.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Calculando avance reticular y créditos...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Error de Consulta</h2>
        <p className="text-xs text-rose-300">{errorMsg}</p>
        <Link href="/perfil" className="inline-block px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300">
          Volver a mi Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-blue-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Portal del Estudiante · Kárdex Dinámico</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Kárdex y Avance Reticular
          </h1>
          <p className="text-xs text-slate-400">
            Acreditación sujeta a unidades completas aprobadas (Reglamento TecNM)
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

      {/* Tarjetas de Avance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avance de Créditos</span>
            <GraduationCap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {resumen.creditosAcreditados} / {resumen.totalCreditos}
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">
              ({resumen.porcentaje}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(100, resumen.porcentaje)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Promedio General Acreditado</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {resumen.promedioGeneral > 0 ? resumen.promedioGeneral : "-"}
            </span>
            {resumen.promedioGeneral > 0 && <span className="text-xs text-slate-500">/ 100</span>}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Estatus: <strong className={resumen.creditosAcreditados > 0 ? "text-emerald-400" : "text-slate-400"}>
              {resumen.creditosAcreditados > 0 ? "REGULAR" : "INICIAL"}
            </strong>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Meta de Titulación</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white block">
            260 Créditos
          </span>
          <p className="text-[11px] text-slate-500 font-mono">
            {materiasKardex.filter(m => m.estatus === "Aprobada").length} materias acreditadas
          </p>
        </div>
      </div>

      {/* Tabla Oficial de Asignaturas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> Historial de Asignaturas Cursadas y en Curso
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {materiasKardex.length} {materiasKardex.length === 1 ? "materia registrada" : "materias registradas"}
          </span>
        </div>

        {materiasKardex.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Sin materias en el Kárdex</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Aún no has inscrito materias para este ciclo. Dirígete a la sección de Carga Académica para iniciar tu retícula.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-center">Sem.</th>
                  <th className="px-4 py-3">Clave</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3 text-center">Créd.</th>
                  <th className="px-4 py-3 text-center">Calificación</th>
                  <th className="px-4 py-3 text-center">Estatus</th>
                  <th className="px-4 py-3 text-center">Periodo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {materiasKardex.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-center text-slate-400 font-bold">{m.semestre}</td>
                    <td className="px-4 py-2.5 text-slate-500">{m.clave}</td>
                    <td className="px-4 py-2.5 font-sans font-bold text-slate-200">{m.nombre}</td>
                    <td className="px-4 py-2.5 text-center text-slate-400">{m.creditos}</td>
                    <td className="px-4 py-2.5 text-center font-bold">
                      {typeof m.calificacion === "number" ? (
                        <span className={m.calificacion >= 70 ? "text-emerald-400" : "text-rose-400"}>
                          {m.calificacion}
                        </span>
                      ) : (
                        <span className="text-slate-500">{m.calificacion}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      {m.estatus === "Aprobada" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" /> Aprobada
                        </span>
                      ) : m.estatus === "En curso" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
                          <Clock className="w-3 h-3" /> En curso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60">
                          <XCircle className="w-3 h-3" /> No aprobada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-500 text-[10px]">
                      {m.periodo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}