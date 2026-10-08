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
  query,
  runTransaction,
  serverTimestamp,
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

type RolPermitido = "ESTUDIANTE" | "ADMIN";

export default function CargaAcademicaPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [rolActual, setRolActual] = useState<RolPermitido>("ESTUDIANTE");

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);

  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [noticia, setNoticia] = useState("");
  const [accesoDenegado, setAccesoDenegado] = useState(false);

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

      getDocs(
        query(
          collection(db, "usuarios"),
          where("rol", "==", "PROFESOR")
        )
      ),
    ]);

    const profesores = new Map<string, string>();

    profesoresSnap.forEach((d) => {
      const data = d.data();

      if (data.activo !== false) {
        profesores.set(
          d.id,
          data.nombre || data.correo || "Docente"
        );
      }
    });

    const listaGrupos: Grupo[] = gruposSnap.docs.map((d) => {
      const data = d.data();

      return {
        id: d.id,
        claveMateria: data.claveMateria || "",
        nombreMateria: data.nombreMateria || "",
        periodo: data.periodo || "",
        profesorUid: data.profesorUid || "",
        profesorNombre:
          profesores.get(data.profesorUid) || "Sin asignar",
        cupoMaximo: Number(data.cupoMaximo || 0),
        inscritosActuales: Math.max(
          0,
          Number(data.inscritosActuales || 0)
        ),
        horario: data.horario || "POR DEFINIR",
      };
    });

    const listaInscripciones: Inscripcion[] =
      inscripcionesSnap.docs.map((d) => ({
        id: d.id,
        grupoId: d.data().grupoId || "",
      }));

    setGrupos(listaGrupos);
    setInscripciones(listaInscripciones);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        try {
          const usuarioSnap = await getDoc(
            doc(db, "usuarios", currentUser.uid)
          );

          if (!usuarioSnap.exists()) {
            setAccesoDenegado(true);
            setErrorMsg(
              "No existe un perfil autorizado asociado a esta cuenta."
            );
            return;
          }

          const rol = usuarioSnap.data().rol;

          if (rol !== "ESTUDIANTE" && rol !== "ADMIN") {
            setAccesoDenegado(true);
            setErrorMsg(
              "Acceso restringido: esta vista es exclusiva para estudiantes."
            );
            return;
          }

          setRolActual(rol);
          setAccesoDenegado(false);

          await cargarDatos(currentUser.uid);
        } catch {
          setErrorMsg(
            "No se pudo cargar la oferta académica."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  const registrarAuditoria = async (
    accion: string,
    recurso: string
  ) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "auditoria_logs"), {
        usuarioUid: user.uid,
        rol: rolActual,
        accion,
        recurso,
        ip: "CLIENTE_WEB",
        timestamp: serverTimestamp(),
      });
    } catch {
      // La auditoría no debe impedir que termine
      // la operación principal.
    }
  };

  const inscribirse = async (grupo: Grupo) => {
    if (!user) return;

    if (gruposInscritos.has(grupo.id)) {
      setErrorMsg("Ya estás inscrito en este grupo.");
      return;
    }

    setProcesandoId(grupo.id);
    setErrorMsg("");
    setNoticia("");

    try {
      const grupoRef = doc(db, "grupos", grupo.id);

      /*
       * El ID se genera a partir del alumno y del grupo.
       * Esto evita crear dos documentos diferentes para
       * la misma inscripción.
       */
      const inscripcionId = `${user.uid}_${grupo.id}`;

      const inscripcionRef = doc(
        db,
        "inscripciones",
        inscripcionId
      );

      await runTransaction(db, async (transaction) => {
        /*
         * IMPORTANTE:
         * Todas las lecturas de la transacción se realizan
         * antes de efectuar escrituras.
         */

        const grupoSnap = await transaction.get(grupoRef);
        const inscripcionSnap =
          await transaction.get(inscripcionRef);

        if (!grupoSnap.exists()) {
          throw new Error("GRUPO_NO_EXISTE");
        }

        if (inscripcionSnap.exists()) {
          throw new Error("DUPLICADA");
        }

        const dataGrupo = grupoSnap.data();

        const cupoMaximo = Number(
          dataGrupo.cupoMaximo || 0
        );

        const inscritosActuales = Math.max(
          0,
          Number(dataGrupo.inscritosActuales || 0)
        );

        if (cupoMaximo <= 0) {
          throw new Error("CUPO_INVALIDO");
        }

        if (inscritosActuales >= cupoMaximo) {
          throw new Error("SIN_CUPO");
        }

        transaction.set(inscripcionRef, {
          inscripcionId,
          grupoId: grupo.id,
          alumnoUid: user.uid,
          inscritoPor: user.uid,
          fechaInscripcion: serverTimestamp(),
        });

        transaction.update(grupoRef, {
          inscritosActuales: inscritosActuales + 1,
        });
      });

      await registrarAuditoria(
        "INSCRIBIR_GRUPO",
        `grupos/${grupo.id}`
      );

      setNoticia(
        `Te inscribiste correctamente a ${grupo.nombreMateria}.`
      );

      await cargarDatos(user.uid);
    } catch (err) {
      let mensaje =
        "No se pudo completar la inscripción.";

      if (err instanceof Error) {
        if (err.message === "SIN_CUPO") {
          mensaje =
            "El grupo ya no tiene lugares disponibles.";
        } else if (err.message === "DUPLICADA") {
          mensaje =
            "Ya estás inscrito en este grupo.";
        } else if (err.message === "GRUPO_NO_EXISTE") {
          mensaje =
            "El grupo seleccionado ya no existe.";
        } else if (err.message === "CUPO_INVALIDO") {
          mensaje =
            "El grupo no tiene un cupo válido configurado.";
        }
      }

      setErrorMsg(mensaje);
    } finally {
      setProcesandoId(null);
    }
  };

  const darDeBaja = async (
    inscripcion: Inscripcion
  ) => {
    if (!user) return;

    setProcesandoId(inscripcion.grupoId);
    setErrorMsg("");
    setNoticia("");

    try {
      const inscripcionRef = doc(
        db,
        "inscripciones",
        inscripcion.id
      );

      const grupoRef = doc(
        db,
        "grupos",
        inscripcion.grupoId
      );

      await runTransaction(db, async (transaction) => {
        /*
         * La propiedad de la inscripción se comprueba
         * dentro de la propia transacción.
         */
        const inscripcionSnap =
          await transaction.get(inscripcionRef);

        const grupoSnap =
          await transaction.get(grupoRef);

        if (!inscripcionSnap.exists()) {
          throw new Error("INSCRIPCION_NO_EXISTE");
        }

        if (
          inscripcionSnap.data().alumnoUid !== user.uid
        ) {
          throw new Error("NO_AUTORIZADO");
        }

        const actuales = grupoSnap.exists()
          ? Math.max(
              0,
              Number(
                grupoSnap.data().inscritosActuales || 0
              )
            )
          : 0;

        transaction.delete(inscripcionRef);

        if (grupoSnap.exists()) {
          transaction.update(grupoRef, {
            inscritosActuales: Math.max(
              0,
              actuales - 1
            ),
          });
        }
      });

      await registrarAuditoria(
        "BAJA_GRUPO",
        `inscripciones/${inscripcion.id}`
      );

      setNoticia(
        "La materia fue retirada de tu carga académica."
      );

      await cargarDatos(user.uid);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "NO_AUTORIZADO"
      ) {
        setErrorMsg(
          "No tienes autorización para modificar esta inscripción."
        );
      } else if (
        err instanceof Error &&
        err.message === "INSCRIPCION_NO_EXISTE"
      ) {
        setErrorMsg(
          "La inscripción ya no existe."
        );
      } else {
        setErrorMsg(
          "No se pudo dar de baja la materia."
        );
      }
    } finally {
      setProcesandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          Cargando oferta académica...
        </p>
      </div>
    );
  }

  if (accesoDenegado) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />

        <h2 className="text-lg font-bold text-white">
          Acceso Denegado
        </h2>

        <p className="text-xs text-rose-300">
          {errorMsg}
        </p>

        <Link
          href="/perfil"
          className="inline-block px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          Volver a mi Perfil
        </Link>
      </div>
    );
  }

  const cargaActual = inscripciones
    .map((inscripcion) => ({
      inscripcion,
      grupo: grupos.find(
        (grupo) =>
          grupo.id === inscripcion.grupoId
      ),
    }))
    .filter(
      (
        item
      ): item is {
        inscripcion: Inscripcion;
        grupo: Grupo;
      } => item.grupo !== undefined
    );

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
            Consulta grupos disponibles y administra tu
            carga del periodo.
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

          <h2 className="text-lg font-bold text-white">
            Mi carga actual
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">
                    Clave
                  </th>

                  <th className="px-4 py-3">
                    Materia
                  </th>

                  <th className="px-4 py-3">
                    Profesor
                  </th>

                  <th className="px-4 py-3">
                    Horario
                  </th>

                  <th className="px-4 py-3">
                    Periodo
                  </th>

                  <th className="px-4 py-3 text-center">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {cargaActual.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Aún no tienes materias inscritas.
                    </td>
                  </tr>
                ) : (
                  cargaActual.map(
                    ({ inscripcion, grupo }) => (
                      <tr
                        key={inscripcion.id}
                        className="hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {grupo.claveMateria}
                        </td>

                        <td className="px-4 py-3">
                          {grupo.nombreMateria}
                        </td>

                        <td className="px-4 py-3">
                          {grupo.profesorNombre}
                        </td>

                        <td className="px-4 py-3">
                          {grupo.horario}
                        </td>

                        <td className="px-4 py-3">
                          {grupo.periodo}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              darDeBaja(
                                inscripcion
                              )
                            }
                            disabled={
                              procesandoId ===
                              grupo.id
                            }
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Dar de baja
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-400" />

          <h2 className="text-lg font-bold text-white">
            Grupos disponibles
          </h2>
        </div>

        {grupos.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-500">
            No hay grupos disponibles en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {grupos.map((grupo) => {
              const inscrito =
                gruposInscritos.has(grupo.id);

              const sinCupo =
                grupo.cupoMaximo <= 0 ||
                grupo.inscritosActuales >=
                  grupo.cupoMaximo;

              return (
                <div
                  key={grupo.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
                >
                  <div>
                    <div className="text-[11px] font-mono text-blue-400">
                      {grupo.claveMateria} ·{" "}
                      {grupo.periodo}
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {grupo.nombreMateria}
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <p>
                      <strong className="text-slate-300">
                        Profesor:
                      </strong>{" "}
                      {grupo.profesorNombre}
                    </p>

                    <p>
                      <strong className="text-slate-300">
                        Horario:
                      </strong>{" "}
                      {grupo.horario}
                    </p>

                    <p>
                      <strong className="text-slate-300">
                        Cupo:
                      </strong>{" "}
                      {grupo.inscritosActuales}/
                      {grupo.cupoMaximo}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      inscribirse(grupo)
                    }
                    disabled={
                      inscrito ||
                      sinCupo ||
                      procesandoId === grupo.id
                    }
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {inscrito
                      ? "Ya inscrito"
                      : sinCupo
                        ? "Sin cupo"
                        : procesandoId ===
                            grupo.id
                          ? "Procesando..."
                          : "Inscribirme"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}