"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Edit3,
  LogOut,
  PlusCircle,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";

interface Profesor {
  uid: string;
  nombre: string;
}

interface Grupo {
  id: string;
  claveMateria: string;
  nombreMateria: string;
  periodo: string;
  profesorUid: string;
  cupoMaximo: number;
  horario: string;
  inscritosActuales: number;
}

const FORM_INICIAL = {
  claveMateria: "",
  nombreMateria: "",
  periodo: "2026-2",
  profesorUid: "",
  cupoMaximo: "30",
  horario: "",
};

export default function JefaturaGruposPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [noticia, setNoticia] = useState("");

  const profesoresPorUid = useMemo(
    () => new Map(profesores.map((p) => [p.uid, p.nombre])),
    [profesores]
  );

  const cargarDatos = async () => {
    const [gruposSnap, profesoresSnap] = await Promise.all([
      getDocs(collection(db, "grupos")),
      getDocs(query(collection(db, "usuarios"), where("rol", "==", "PROFESOR"))),
    ]);

    const listaGrupos: Grupo[] = gruposSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        claveMateria: data.claveMateria || "",
        nombreMateria: data.nombreMateria || "",
        periodo: data.periodo || "",
        profesorUid: data.profesorUid || "",
        cupoMaximo: Number(data.cupoMaximo || 0),
        horario: data.horario || "POR DEFINIR",
        inscritosActuales: Number(data.inscritosActuales || 0),
      };
    });

    const listaProfesores: Profesor[] = profesoresSnap.docs
      .filter((d) => d.data().activo !== false)
      .map((d) => ({
        uid: d.id,
        nombre: d.data().nombre || d.data().correo || "Docente",
      }));

    setGrupos(listaGrupos);
    setProfesores(listaProfesores);
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
          (usuarioSnap.data().rol !== "JEFE_CARRERA" &&
            usuarioSnap.data().rol !== "ADMIN")
        ) {
          setErrorMsg(
            "Acceso restringido: esta vista es exclusiva para Jefatura de Carrera."
          );
          return;
        }

        await cargarDatos();
      } catch {
        setErrorMsg("No se pudo cargar la gestión académica.");
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
        rol: "JEFE_CARRERA",
        accion,
        recurso,
        ip: "CLIENTE_WEB",
        timestamp: serverTimestamp(),
      });
    } catch {
      // La auditoría no debe bloquear la operación principal.
    }
  };

  const limpiarFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
  };

  const guardarGrupo = async (e: FormEvent) => {
    e.preventDefault();
    setNoticia("");
    setErrorMsg("");

    const claveMateria = form.claveMateria.trim().toUpperCase();
    const nombreMateria = form.nombreMateria.trim();
    const periodo = form.periodo.trim();
    const horario = form.horario.trim();
    const cupoMaximo = Number(form.cupoMaximo);

    if (
      !claveMateria ||
      !nombreMateria ||
      !periodo ||
      !form.profesorUid ||
      !horario
    ) {
      setErrorMsg("Completa todos los campos del grupo.");
      return;
    }

    if (!Number.isInteger(cupoMaximo) || cupoMaximo < 1 || cupoMaximo > 100) {
      setErrorMsg("El cupo debe ser un número entero entre 1 y 100.");
      return;
    }

    const duplicado = grupos.some(
      (g) =>
        g.id !== editandoId &&
        g.claveMateria.toUpperCase() === claveMateria &&
        g.periodo.toUpperCase() === periodo.toUpperCase()
    );

    if (duplicado) {
      setErrorMsg("Ya existe un grupo con esa clave de materia y periodo.");
      return;
    }

    setGuardando(true);

    try {
      if (editandoId) {
        const grupoActual = grupos.find((g) => g.id === editandoId);
        if (
          grupoActual &&
          cupoMaximo < Number(grupoActual.inscritosActuales || 0)
        ) {
          setErrorMsg(
            "El cupo no puede ser menor al número de alumnos ya inscritos."
          );
          return;
        }

        await updateDoc(doc(db, "grupos", editandoId), {
          claveMateria,
          nombreMateria,
          periodo,
          profesorUid: form.profesorUid,
          cupoMaximo,
          horario,
          actualizadoEn: serverTimestamp(),
        });

        await registrarAuditoria("ACTUALIZAR_GRUPO", `grupos/${editandoId}`);
        setNoticia("Grupo actualizado correctamente.");
      } else {
        if (!user) return;

        const nuevo = await addDoc(collection(db, "grupos"), {
          claveMateria,
          nombreMateria,
          periodo,
          profesorUid: form.profesorUid,
          creadoPor: user.uid,
          cupoMaximo,
          horario,
          inscritosActuales: 0,
          creadoEn: serverTimestamp(),
        });

        await updateDoc(nuevo, { grupoId: nuevo.id });
        await registrarAuditoria("CREAR_GRUPO", `grupos/${nuevo.id}`);
        setNoticia("Grupo creado correctamente.");
      }

      limpiarFormulario();
      await cargarDatos();
    } catch {
      setErrorMsg("No se pudo guardar el grupo. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const editarGrupo = (grupo: Grupo) => {
    setEditandoId(grupo.id);
    setForm({
      claveMateria: grupo.claveMateria,
      nombreMateria: grupo.nombreMateria,
      periodo: grupo.periodo,
      profesorUid: grupo.profesorUid,
      cupoMaximo: String(grupo.cupoMaximo),
      horario: grupo.horario === "POR DEFINIR" ? "" : grupo.horario,
    });
    setNoticia("");
    setErrorMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Cargando gestión de grupos...</p>
      </div>
    );
  }

  if (errorMsg && !user) {
    return null;
  }

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-950/70 border border-indigo-800/60 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Portal de Jefatura · Gestión Académica
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Gestión de Grupos y Materias
          </h1>
          <p className="text-xs text-slate-400">
            Apertura de grupos, asignación docente, horario y control de cupo.
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

      <form
        onSubmit={guardarGrupo}
        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5"
      >
        <div className="flex items-center gap-2">
          {editandoId ? (
            <Edit3 className="w-5 h-5 text-indigo-400" />
          ) : (
            <PlusCircle className="w-5 h-5 text-indigo-400" />
          )}
          <h2 className="text-lg font-bold text-white">
            {editandoId ? "Editar grupo" : "Abrir nuevo grupo"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ["Clave de materia", "claveMateria", "DS-401"],
            ["Nombre de materia", "nombreMateria", "Desarrollo Seguro"],
            ["Periodo", "periodo", "2026-2"],
            ["Horario", "horario", "Lun-Mié 10:00-12:00"],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {label}
              </label>
              <input
                type="text"
                required
                value={form[key as keyof typeof form]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={placeholder}
                maxLength={key === "nombreMateria" ? 100 : 50}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Profesor
            </label>
            <select
              required
              value={form.profesorUid}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, profesorUid: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Selecciona un docente</option>
              {profesores.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Cupo máximo
            </label>
            <input
              type="number"
              required
              min={1}
              max={100}
              value={form.cupoMaximo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cupoMaximo: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {guardando
              ? "Guardando..."
              : editandoId
              ? "Guardar cambios"
              : "Crear grupo"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-white">Grupos registrados</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Clave</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Profesor</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3 text-center">Cupo</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {grupos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay grupos registrados.
                  </td>
                </tr>
              ) : (
                grupos.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {g.claveMateria}
                    </td>
                    <td className="px-4 py-3">{g.nombreMateria}</td>
                    <td className="px-4 py-3">{g.periodo}</td>
                    <td className="px-4 py-3">
                      {profesoresPorUid.get(g.profesorUid) || "Sin asignar"}
                    </td>
                    <td className="px-4 py-3">{g.horario}</td>
                    <td className="px-4 py-3 text-center">
                      {g.inscritosActuales}/{g.cupoMaximo}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => editarGrupo(g)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
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
