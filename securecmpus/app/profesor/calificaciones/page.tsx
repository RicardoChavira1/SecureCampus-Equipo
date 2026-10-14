"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { 
  ShieldCheck, 
  ArrowLeft, 
  LogOut, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Users,
  BookOpen
} from "lucide-react";

interface AlumnoActa {
  actaId: string;
  alumnoUid: string;
  noControl: string;
  nombreCompleto: string;
  unidades: (number | null)[];
  calificacionFinal: number | null;
  estatus: "Aprobada" | "No aprobada" | "En curso";
}

interface InfoGrupo {
  id: string;
  claveMateria: string;
  nombreMateria: string;
  periodo: string;
  numeroUnidades: number;
}

export default function ProfesorCalificacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const grupoId = searchParams.get("grupoId");

  const [user, setUser] = useState<User | null>(null);
  const [infoGrupo, setInfoGrupo] = useState<InfoGrupo | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoActa[]>([]);
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

        if (!grupoId) {
          setErrorMsg("No se especificó el identificador del grupo.");
          setLoading(false);
          return;
        }

        // 1. Obtener la información del grupo seleccionado
        const grupoDoc = await getDoc(doc(db, "grupos", grupoId));
        if (!grupoDoc.exists()) {
          setErrorMsg("El grupo solicitado no existe.");
          setLoading(false);
          return;
        }

        const dataG = grupoDoc.data();
        const unidadesGrupo = Math.max(1, Number(dataG.numeroUnidades || 3));

        setInfoGrupo({
          id: grupoDoc.id,
          claveMateria: dataG.claveMateria || "",
          nombreMateria: dataG.nombreMateria || "",
          periodo: dataG.periodo || "",
          numeroUnidades: unidadesGrupo,
        });

        // 2. Traer alumnos inscritos en este grupo específico
        const qInscritos = query(
          collection(db, "inscripciones"),
          where("grupoId", "==", grupoId)
        );
        const [inscripcionesSnap, usuariosSnap, calificacionesSnap] = await Promise.all([
          getDocs(qInscritos),
          getDocs(query(collection(db, "usuarios"), where("rol", "==", "ESTUDIANTE"))),
          getDocs(query(collection(db, "calificaciones"), where("grupoId", "==", grupoId)))
        ]);

        // Mapa de datos de alumnos por UID
        const mapaUsuarios = new Map<string, { noControl: string; nombre: string }>();
        usuariosSnap.forEach((u) => {
          const uData = u.data();
          mapaUsuarios.set(u.id, {
            noControl: uData.matricula_nomina || uData.matricula || "S/N",
            nombre: uData.nombre || uData.correo || "Estudiante",
          });
        });

        // Mapa de actas ya existentes en calificaciones
        const mapaCalificaciones = new Map<string, any>();
        calificacionesSnap.forEach((c) => {
          const cData = c.data();
          mapaCalificaciones.set(cData.alumnoUid, { id: c.id, ...cData });
        });

        // 3. Ensamblar la lista de alumnos
        const listaAlumnos: AlumnoActa[] = [];

        inscripcionesSnap.forEach((insDoc) => {
          const insData = insDoc.data();
          const alumnoUid = insData.alumnoUid;
          const datosUsuario = mapaUsuarios.get(alumnoUid) || {
            noControl: "S/N",
            nombre: "Estudiante",
          };

          const califDoc = mapaCalificaciones.get(alumnoUid);

          // Unidades
          let unidadesArr: (number | null)[] = [];
          if (Array.isArray(califDoc?.unidades)) {
            unidadesArr = [...califDoc.unidades];
          } else if (califDoc) {
            for (let i = 1; i <= unidadesGrupo; i++) {
              const val = califDoc[`u${i}`];
              unidadesArr.push(typeof val === "number" ? val : null);
            }
          }

          while (unidadesArr.length < unidadesGrupo) {
            unidadesArr.push(null);
          }
          unidadesArr = unidadesArr.slice(0, unidadesGrupo);

          listaAlumnos.push({
            actaId: califDoc?.id || `cal_${alumnoUid}_${grupoId}`,
            alumnoUid,
            noControl: datosUsuario.noControl,
            nombreCompleto: datosUsuario.nombre,
            unidades: unidadesArr,
            calificacionFinal: typeof califDoc?.calificacionFinal === "number" ? califDoc.calificacionFinal : null,
            estatus: califDoc?.estatus || "En curso",
          });
        });

        // Ordenar por Número de Control
        listaAlumnos.sort((a, b) => a.noControl.localeCompare(b.noControl));
        setAlumnos(listaAlumnos);

      } catch (err) {
        console.error("Error al cargar calificaciones del grupo:", err);
        setErrorMsg("Error al sincronizar el acta escolar.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, grupoId]);

  const handleCalificacionChange = (actaId: string, idxUnidad: number, valor: string) => {
    const num = valor === "" ? null : Math.min(100, Math.max(0, parseInt(valor, 10) || 0));
    setAlumnos((prev) =>
      prev.map((al) => {
        if (al.actaId !== actaId) return al;
        const arr = [...al.unidades];
        arr[idxUnidad] = num;
        return { ...al, unidades: arr };
      })
    );
  };

  const guardarCalificacion = async (alumno: AlumnoActa) => {
    if (!infoGrupo) return;
    setGuardandoId(alumno.actaId);
    setNoticia(null);

    try {
      const totalUnidades = infoGrupo.numeroUnidades;
      const validas = alumno.unidades.filter((u) => u !== null && typeof u === "number") as number[];
      
      const todasEvaluadas = validas.length === totalUnidades;
      const hayReprobada = validas.some((nota) => nota < 70);

      let promedio: number | null = null;
      let estatusFinal: "Aprobada" | "No aprobada" | "En curso" = "En curso";

      if (hayReprobada) {
        estatusFinal = "No aprobada";
        promedio = validas.length > 0 ? Math.round(validas.reduce((a, b) => a + b, 0) / validas.length) : null;
      } else if (todasEvaluadas && totalUnidades > 0) {
        estatusFinal = "Aprobada";
        promedio = Math.round(validas.reduce((a, b) => a + b, 0) / totalUnidades);
      } else {
        estatusFinal = "En curso";
        promedio = null;
      }

      const payload: Record<string, any> = {
        alumnoUid: alumno.alumnoUid,
        grupoId: infoGrupo.id,
        claveMateria: infoGrupo.claveMateria,
        nombreMateria: infoGrupo.nombreMateria,
        profesorUid: user?.uid || "",
        unidades: alumno.unidades,
        calificacionFinal: promedio,
        estatus: estatusFinal,
        creditos: 5,
        semestre: 9,
        actualizadoEn: serverTimestamp(),
      };

      alumno.unidades.forEach((nota, idx) => {
        payload[`u${idx + 1}`] = nota;
      });

      await setDoc(doc(db, "calificaciones", alumno.actaId), payload, { merge: true });

      setAlumnos((prev) =>
        prev.map((a) => (a.actaId === alumno.actaId ? { ...a, calificacionFinal: promedio, estatus: estatusFinal } : a))
      );

      setNoticia(`Calificaciones de [${alumno.noControl}] ${alumno.nombreCompleto} guardadas: ${estatusFinal}.`);
    } catch (err) {
      console.error("Error al guardar calificaciones:", err);
      alert("Error al asentar notas en el servidor.");
    } finally {
      setGuardandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Cargando acta oficial del grupo...</p>
      </div>
    );
  }

  if (errorMsg || !infoGrupo) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Error de Consulta</h2>
        <p className="text-xs text-rose-300">{errorMsg}</p>
        <Link href="/profesor/grupos" className="inline-block px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300">
          Volver a Mis Grupos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acta de Evaluación Oficial</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {infoGrupo.nombreMateria}
          </h1>
          <p className="text-xs text-slate-400">
            {infoGrupo.claveMateria} · Periodo {infoGrupo.periodo} · {infoGrupo.numeroUnidades} Unidades Temáticas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profesor/grupos"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Mis Grupos</span>
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

      {noticia && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{noticia}</span>
        </div>
      )}

      {/* Tabla Oficial de Alumnos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Alumnos Matriculados en el Grupo
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">No. Control</th>
                <th className="px-4 py-3">Estudiante</th>
                {Array.from({ length: infoGrupo.numeroUnidades }, (_, i) => (
                  <th key={i} className="px-3 py-3 text-center">
                    U{i + 1}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Final</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {alumnos.length === 0 ? (
                <tr>
                  <td colSpan={5 + infoGrupo.numeroUnidades} className="px-4 py-8 text-center text-slate-500 font-sans">
                    Aún no hay alumnos inscritos en este grupo.
                  </td>
                </tr>
              ) : (
                alumnos.map((alumno) => (
                  <tr key={alumno.actaId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-white tracking-wider">
                      {alumno.noControl}
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-200">
                      {alumno.nombreCompleto}
                    </td>

                    {/* Casillas de Unidades */}
                    {Array.from({ length: infoGrupo.numeroUnidades }, (_, idx) => (
                      <td key={idx} className="px-2 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={alumno.unidades[idx] ?? ""}
                          onChange={(e) => handleCalificacionChange(alumno.actaId, idx, e.target.value)}
                          placeholder="-"
                          className="w-12 py-1 bg-slate-950 border border-slate-700 rounded-lg text-center text-white text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </td>
                    ))}

                    <td className="px-4 py-3 text-center font-bold text-white">
                      {alumno.calificacionFinal !== null ? (
                        <span className={alumno.calificacionFinal >= 70 ? "text-emerald-400" : "text-rose-400"}>
                          {alumno.calificacionFinal}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-sans">
                      {alumno.estatus === "Aprobada" ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          Aprobada
                        </span>
                      ) : alumno.estatus === "No aprobada" ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-full">
                          No aprobada
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                          En curso
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => guardarCalificacion(alumno)}
                        disabled={guardandoId === alumno.actaId}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-sans font-semibold transition disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{guardandoId === alumno.actaId ? "..." : "Guardar"}</span>
                      </button>
                    </td>
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