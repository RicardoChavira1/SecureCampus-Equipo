"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  RefreshCw,
  GraduationCap,
  Briefcase,
  UserCheck,
  Trash2,
  Edit2,
  X,
  Save
} from "lucide-react";

interface UsuarioItem {
  id: string;
  nombre: string;
  correo: string;
  matricula_nomina: string;
  rol: "ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN";
  activo: boolean;
  carrera?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);

  // Estados del CRUD
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // Formulario de Alta
  const [nombre, setNombre] = useState("");
  const [matricula, setMatricula] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN">("ESTUDIANTE");
  const [materiaInicial, setMateriaInicial] = useState("DESARROLLO SEGURO");
  const [creando, setCreando] = useState(false);

  // Estado para Edición Rápida (Modal)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMatricula, setEditMatricula] = useState("");

  // 1. Verificación RBAC de SysAdmin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists() && userDoc.data().rol === "ADMIN") {
          setEsAdmin(true);
          await cargarUsuarios();
        } else {
          setEsAdmin(false);
        }
      } catch (err) {
        console.error("Error validando permisos de SysAdmin:", err);
        setEsAdmin(false);
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Consulta de Usuarios en Firestore (READ)
  const cargarUsuarios = async () => {
    setCargandoLista(true);
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      const lista: UsuarioItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nombre: data.nombre || "Sin Nombre",
          correo: data.correo || "Sin Correo",
          matricula_nomina: data.matricula_nomina || "S/N",
          rol: data.rol || "ESTUDIANTE",
          activo: data.activo !== false,
          carrera: data.carrera || "",
        };
      });
      setUsuarios(lista);
    } catch (err) {
      console.error("Error al cargar lista de usuarios:", err);
      setMensaje({ tipo: "error", texto: "No se pudieron obtener los usuarios de Firestore." });
    } finally {
      setCargandoLista(false);
    }
  };

  // 3. Alta de Nuevo Usuario (CREATE)
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);

    try {
      const nuevoUid = `usr_${Date.now()}`;
      await setDoc(doc(db, "usuarios", nuevoUid), {
        nombre: nombre.trim().toUpperCase(),
        matricula_nomina: matricula.trim(),
        correo: correo.trim().toLowerCase(),
        rol,
        activo: true,
        carrera: "INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIONES",
        especialidad: rol === "ESTUDIANTE" ? "INGENIERÍA DE DATOS" : "DOCENCIA",
        estatusAcademico: "ACTIVO",
        promedioGeneral: rol === "ESTUDIANTE" ? 85 : null,
        creadoEn: serverTimestamp(),
        creadoPor: currentUser?.uid,
      });

      setMensaje({
        tipo: "exito",
        texto: `Usuario ${nombre} aprovisionado correctamente en Firestore con rol ${rol}.`,
      });

      setNombre("");
      setMatricula("");
      setCorreo("");
      setPassword("");
      await cargarUsuarios();
    } catch (err) {
      console.error("Error al aprovisionar usuario:", err);
      setMensaje({ tipo: "error", texto: "Error al registrar el usuario en Firestore." });
    } finally {
      setCreando(false);
    }
  };

  // 4. Modificación de Estado - Bloquear / Desbloquear (UPDATE)
  const toggleEstadoUsuario = async (userId: string, estadoActual: boolean) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), {
        activo: !estadoActual,
        actualizadoEn: serverTimestamp(),
        actualizadoPor: currentUser?.uid,
      });

      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !estadoActual } : u))
      );

      setMensaje({
        tipo: "exito",
        texto: `Usuario ${!estadoActual ? "desbloqueado y reactivado" : "suspendido"} con éxito.`,
      });
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setMensaje({ tipo: "error", texto: "Error al modificar el estado del usuario." });
    }
  };

  // 5. Cambio de Rol (UPDATE)
  const cambiarRolUsuario = async (userId: string, nuevoRol: "ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN") => {
    try {
      await updateDoc(doc(db, "usuarios", userId), {
        rol: nuevoRol,
        actualizadoEn: serverTimestamp(),
        actualizadoPor: currentUser?.uid,
      });

      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: nuevoRol } : u))
      );

      setMensaje({
        tipo: "exito",
        texto: `Rol actualizado a ${nuevoRol} exitosamente.`,
      });
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      setMensaje({ tipo: "error", texto: "No se pudo actualizar el rol institucional." });
    }
  };

  // 6. Guardar Edición Completa (UPDATE)
  const guardarEdicion = async () => {
    if (!usuarioEditando) return;
    try {
      await updateDoc(doc(db, "usuarios", usuarioEditando.id), {
        nombre: editNombre.trim().toUpperCase(),
        matricula_nomina: editMatricula.trim(),
        actualizadoEn: serverTimestamp(),
        actualizadoPor: currentUser?.uid,
      });

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioEditando.id
            ? { ...u, nombre: editNombre.trim().toUpperCase(), matricula_nomina: editMatricula.trim() }
            : u
        )
      );

      setMensaje({ tipo: "exito", texto: "Datos del usuario actualizados correctamente." });
      setUsuarioEditando(null);
    } catch (err) {
      console.error("Error al editar:", err);
      setMensaje({ tipo: "error", texto: "Error al actualizar los datos en Firestore." });
    }
  };

  // 7. Eliminar Usuario (DELETE)
  const handleEliminarUsuario = async (u: UsuarioItem) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar permanentemente al usuario ${u.nombre}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "usuarios", u.id));
      setUsuarios((prev) => prev.filter((item) => item.id !== u.id));
      setMensaje({ tipo: "exito", texto: `El usuario ${u.nombre} fue eliminado de Firestore.` });
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setMensaje({ tipo: "error", texto: "Error al intentar eliminar el registro de usuario." });
    }
  };

  // Filtro reactivo para la tabla
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.correo.toLowerCase().includes(filtro.toLowerCase()) ||
      u.matricula_nomina.includes(filtro) ||
      u.rol.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loadingAuth) {
    return (
      <main className="min-h-[85vh] bg-slate-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verificando credenciales SysAdmin...</span>
        </div>
      </main>
    );
  }

  if (!esAdmin) {
    return (
      <main className="min-h-[85vh] bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-6 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Acceso Restringido</h2>
          <p className="text-xs text-slate-400 mb-6">
            Esta pantalla es exclusiva para personal con rol ADMIN verificado en el sistema.
          </p>
          <button
            onClick={() => router.push("/perfil")}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Volver a mi Perfil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[85vh] bg-slate-950 text-white p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase bg-amber-950/70 text-amber-300 border border-amber-800/60 px-2.5 py-0.5 rounded-full font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Módulo de Control de Acceso (RBAC) · SysAdmin
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión Central de Usuarios y Plantillas
          </h1>
          <p className="text-xs text-slate-400">
            Aprovisionamiento, modificación de privilegios y control de estado de cuentas institucionales.
          </p>
        </div>

        {/* Notificaciones */}
        {mensaje && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
              mensaje.tipo === "exito"
                ? "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                : "bg-rose-950/50 border-rose-800/80 text-rose-300"
            }`}
          >
            {mensaje.tipo === "exito" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{mensaje.texto}</span>
          </div>
        )}

        {/* Sección 1: Formulario de Alta (CREATE) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Alta sin Consola Manual</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Al registrar a cualquier miembro, el sistema asocia las reglas institucionales, genera su identidad y siembra sus actas sin requerir intervención en la consola.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1.5 pt-4 border-t border-slate-800 font-mono">
              <p className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-blue-400" /> Estudiantes: Crea expediente y acta inicial.</p>
              <p className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Docentes: Habilita el portal de captura.</p>
              <p className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-purple-400" /> Jefaturas: Habilita apertura de grupos.</p>
            </div>
          </div>

          <form onSubmit={handleCrearUsuario} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="JUAN PÉREZ LÓPEZ"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Rol a Asignar</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ESTUDIANTE">ESTUDIANTE</option>
                  <option value="PROFESOR">PROFESOR</option>
                  <option value="JEFE_CARRERA">JEFE_CARRERA</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Número de Control / Nómina</label>
                <input
                  type="text"
                  required
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="22280001"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Correo Institucional</label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@toluca.tecnm.mx"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Contraseña de Acceso</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Materia Inicial</label>
                <select
                  value={materiaInicial}
                  onChange={(e) => setMateriaInicial(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="DESARROLLO SEGURO">DESARROLLO SEGURO</option>
                  <option value="REDES CONCURRENTES">REDES CONCURRENTES</option>
                  <option value="TALLER DE INVESTIGACIÓN">TALLER DE INVESTIGACIÓN</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creando}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-amber-600/20"
            >
              {creando ? "Aprovisionando en Firestore..." : "Generar Cuenta y Aprovisionar en Firestore"}
            </button>
          </form>
        </div>

        {/* Sección 2: CRUD y Gobernanza de Cuentas (READ, UPDATE, DELETE) */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Cuentas Institucionales Registradas
              </h2>
              <p className="text-xs text-slate-400">Control directo de roles, edición de información y desbloqueo de usuarios.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar por nombre, correo, rol..."
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-64"
                />
              </div>

              <button
                onClick={cargarUsuarios}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
                title="Recargar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargandoLista ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Nómina / Matrícula</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo Institucional</th>
                    <th className="px-4 py-3">Rol (RBAC)</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        No se encontraron usuarios registrados o coincidentes.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-semibold text-slate-300">{u.matricula_nomina}</td>
                        <td className="px-4 py-3 font-sans font-bold text-white">{u.nombre}</td>
                        <td className="px-4 py-3 text-slate-400">{u.correo}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.rol}
                            onChange={(e) => cambiarRolUsuario(u.id, e.target.value as any)}
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                          >
                            <option value="ESTUDIANTE">ESTUDIANTE</option>
                            <option value="PROFESOR">PROFESOR</option>
                            <option value="JEFE_CARRERA">JEFE_CARRERA</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          {u.activo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60">
                              Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Desbloquear / Bloquear */}
                            <button
                              onClick={() => toggleEstadoUsuario(u.id, u.activo)}
                              title={u.activo ? "Bloquear acceso" : "Desbloquear acceso"}
                              className={`p-1.5 rounded-lg border transition ${
                                u.activo 
                                  ? "bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/60" 
                                  : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60"
                              }`}
                            >
                              {u.activo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setUsuarioEditando(u);
                                setEditNombre(u.nombre);
                                setEditMatricula(u.matricula_nomina);
                              }}
                              title="Editar datos del usuario"
                              className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-300 hover:bg-blue-900/60 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => handleEliminarUsuario(u)}
                              title="Eliminar usuario permanentemente"
                              className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Edición Rápida */}
        {usuarioEditando && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-400" /> Modificar Usuario
                </h3>
                <button
                  onClick={() => setUsuarioEditando(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Nómina / Matrícula</label>
                  <input
                    type="text"
                    value={editMatricula}
                    onChange={(e) => setEditMatricula(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Correo (Solo Lectura)</label>
                  <input
                    type="text"
                    disabled
                    value={usuarioEditando.correo}
                    className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarEdicion}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}