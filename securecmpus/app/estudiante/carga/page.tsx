"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  LogOut,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";

interface Grupo {
  id: string;
  claveMateria: string;
  nombreMateria: string;
  periodo: string;
  profesorUid: string;
  profesorNombre: string;
  cupoMaximo: number;
  inscritosActuales: number;
  horario: string;
}

interface Inscripcion {
  id: string;
  grupoId: string;
}

export default function CargaAcademicaPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [noticia, setNoticia] = useState("");

  const gruposInscritos = useMemo(
    () => new Set(inscripciones.map((i) => i.grupoId)),
    [inscripciones]
  );

  const cargarDatos = async (uid: string) => {
    const [gruposSnap, inscripcionesSnap, profesoresSnap] = await Promise.all([
      getDocs(collection(db, "grupos")),
      getDocs(
        query(
          collection(db, "inscripciones"),
          where("alumnoUid", "==", uid)
        )
      ),
      getDocs(query(collection(db, "usuarios"), where("rol", "==", "PROFESOR"))),
    ]);

    const profesores = new Map<string, string>();
    profesoresSnap.forEach((d) => {
      profesores.set(d.id, d.data().nombre || d.data().correo || "Docente");
    });

    const listaGrupos: Grupo[] = gruposSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        claveMateria: data.claveMateria || "",
        nombreMateria: data.nombreMateria || "",
        periodo: data.periodo || "",
        profesorUid: data.profesorUid || "",
        profesorNombre: profesores.get(data.profesorUid) || "Sin asignar",
        cupoMaximo: Number(data.cupoMaximo || 0),
        inscritosActuales: Number(data.inscritosActuales || 0),
        horario: data.horario || "POR DEFINIR",
      };
    });

    const listaInscripciones: Inscripcion[] = inscripcionesSnap.docs.map((d) => ({
      id: d.id,
      grupoId: d.data().grupoId,
    }));

    setGrupos(listaGrupos);
    setInscripciones(listaInscripciones);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        const usuarioSnap = await getDoc(doc(db, "usuarios", currentUser.uid));

        if (
          !usuarioSnap.exists() ||
          (usuarioSnap.data().rol !== "ESTUDIANTE" &&
            usuarioSnap.data().rol !== "ADMIN")
        ) {
          setErrorMsg(
            "Acceso restringido: esta vista es exclusiva para estudiantes."
          );
          return;
        }

        await cargarDatos(currentUser.uid);
      } catch {
        setErrorMsg("No se pudo cargar la oferta académica.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const registrarAuditoria = async (accion: string, recurso: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "auditoria_logs"), {
        usuarioUid: user.uid,
        rol: "ESTUDIANTE",
        accion,
        recurso,
        ip: "CLIENTE_WEB",
        timestamp: serverTimestamp(),
      });
    } catch {
      // La auditoría no debe bloquear la operación principal.
    }
  };

  const inscribirse = async (grupo: Grupo) => {
    if (!user || gruposInscritos.has(grupo.id)) return;

    setProcesandoId(grupo.id);
    setErrorMsg("");
    setNoticia("");

    try {
      const grupoRef = doc(db, "grupos", grupo.id);

      await runTransaction(db, async (transaction) => {
        const grupoSnap = await transaction.get(grupoRef);

        if (!grupoSnap.exists()) {
          throw new Error("GRUPO_NO_EXISTE");
        }

        const data = grupoSnap.data();
        const cupoMaximo = Number(data.cupoMaximo || 0);
        const inscritosActuales = Number(data.inscritosActuales || 0);

        if (inscritosActuales >= cupoMaximo) {
          throw new Error("SIN_CUPO");
        }

        const propiaSnap = await getDocs(
          query(
            collection(db, "inscripciones"),
            where("alumnoUid", "==", user.uid),
            where("grupoId", "==", grupo.id)
          )
        );

        if (!propiaSnap.empty) {
          throw new Error("DUPLICADA");
        }

        const nuevaInscripcion = doc(collection(db, "inscripciones"));
        transaction.set(nuevaInscripcion, {
          inscripcionId: nuevaInscripcion.id,
          grupoId: grupo.id,
          alumnoUid: user.uid,
          inscritoPor: user.uid,
          fechaInscripcion: serverTimestamp(),
        });

        transaction.update(grupoRef, {
          inscritosActuales: inscritosActuales + 1,
        });
      });

      await registrarAuditoria("INSCRIBIR_GRUPO", `grupos/${grupo.id}`);
      setNoticia(`Te inscribiste correctamente a ${grupo.nombreMateria}.`);
      await cargarDatos(user.uid);
    } catch (err) {
      const mensaje =
        err instanceof Error && err.message === "SIN_CUPO"
          ? "El grupo ya no tiene lugares disponibles."
          : err instanceof Error && err.message === "DUPLICADA"
          ? "Ya estás inscrito en este grupo."
          : "No se pudo completar la inscripción.";
      setErrorMsg(mensaje);
    } finally {
      setProcesandoId(null);
    }
  };

  const darDeBaja = async (inscripcion: Inscripcion) => {
    if (!user) return;

    setProcesandoId(inscripcion.grupoId);
    setErrorMsg("");
    setNoticia("");

    try {
      const inscripcionRef = doc(db, "inscripciones", inscripcion.id);
      const inscripcionSnap = await getDoc(inscripcionRef);

      if (
        !inscripcionSnap.exists() ||
        inscripcionSnap.data().alumnoUid !== user.uid
      ) {
        throw new Error("NO_AUTORIZADO");
      }

      const grupoRef = doc(db, "grupos", inscripcion.grupoId);

      await runTransaction(db, async (transaction) => {
        const grupoSnap = await transaction.get(grupoRef);
        const actuales = grupoSnap.exists()
          ? Number(grupoSnap.data().inscritosActuales || 0)
          : 0;

        transaction.delete(inscripcionRef);

        if (grupoSnap.exists()) {
          transaction.update(grupoRef, {
            inscritosActuales: Math.max(0, actuales - 1),
          });
        }
      });

      await registrarAuditoria(
        "BAJA_GRUPO",
        `inscripciones/${inscripcion.id}`
      );
      setNoticia("La materia fue retirada de tu carga académica.");
      await cargarDatos(user.uid);
    } catch {
      setErrorMsg("No se pudo dar de baja la materia.");
    } finally {
      setProcesandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Cargando oferta académica...</p>
      </div>
    );
  }

  const cargaActual = inscripciones
    .map((ins) => ({
      inscripcion: ins,
      grupo: grupos.find((g) => g.id === ins.grupoId),
    }))
    .filter((x) => x.grupo);

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-blue-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Portal del Estudiante · Reinscripción
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Carga Académica
          </h1>
          <p className="text-xs text-slate-400">
            Consulta grupos disponibles y administra tu carga del periodo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Mi Perfil
          </Link>
          <button
            onClick={async () => {
              await signOut(auth);
              router.push("/login");
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {noticia && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {noticia}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Mi carga actual</h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Clave</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Profesor</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cargaActual.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Aún no tienes materias inscritas.
                    </td>
                  </tr>
                ) : (
                  cargaActual.map(({ inscripcion, grupo }) => (
                    <tr key={inscripcion.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {grupo!.claveMateria}
                      </td>
                      <td className="px-4 py-3">{grupo!.nombreMateria}</td>
                      <td className="px-4 py-3">{grupo!.profesorNombre}</td>
                      <td className="px-4 py-3">{grupo!.horario}</td>
                      <td className="px-4 py-3">{grupo!.periodo}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => darDeBaja(inscripcion)}
                          disabled={procesandoId === grupo!.id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Dar de baja
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Grupos disponibles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grupos.map((g) => {
            const inscrito = gruposInscritos.has(g.id);
            const sinCupo = g.inscritosActuales >= g.cupoMaximo;

            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
              >
                <div>
                  <div className="text-[11px] font-mono text-blue-400">
                    {g.claveMateria} · {g.periodo}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {g.nombreMateria}
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <p>
                    <strong className="text-slate-300">Profesor:</strong>{" "}
                    {g.profesorNombre}
                  </p>
                  <p>
                    <strong className="text-slate-300">Horario:</strong>{" "}
                    {g.horario}
                  </p>
                  <p>
                    <strong className="text-slate-300">Cupo:</strong>{" "}
                    {g.inscritosActuales}/{g.cupoMaximo}
                  </p>
                </div>

                <button
                  onClick={() => inscribirse(g)}
                  disabled={inscrito || sinCupo || procesandoId === g.id}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {inscrito
                    ? "Ya inscrito"
                    : sinCupo
                    ? "Sin cupo"
                    : procesandoId === g.id
                    ? "Procesando..."
                    : "Inscribirme"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
