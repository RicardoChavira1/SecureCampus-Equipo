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
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
// Importamos módulos de Auth y App para instanciar la creación aislada
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
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
  bloqueadoPorSeguridad?: boolean;
  intentosFallidos?: number;
  carrera?: string;
}

// Oferta académica oficial del Instituto Tecnológico de Toluca (TecNM)
const CARRERAS_ITTOLUCA = [
  "INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIONES",
  "INGENIERÍA EN SISTEMAS COMPUTACIONALES",
  "INGENIERÍA MECATRÓNICA",
  "INGENIERÍA ELECTRÓNICA",
  "INGENIERÍA ELECTROMECÁNICA",
  "INGENIERÍA INDUSTRIAL",
  "INGENIERÍA QUÍMICA",
  "INGENIERÍA EN GESTIÓN EMPRESARIAL",
  "INGENIERÍA EN LOGÍSTICA",
  "NO APLICA / PERSONAL ADMINISTRATIVO",
];

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
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA" | "ADMIN">("ESTUDIANTE");
  const [carrera, setCarrera] = useState(CARRERAS_ITTOLUCA[0]);
  const [creando, setCreando] = useState(false);

  // Estado para Edición Rápida (Modal)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMatricula, setEditMatricula] = useState("");
  const [editCarrera, setEditCarrera] = useState("");

  // 1. Verificación RBAC de SysAdmin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoadingAuth(false);
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists() && userDoc.data().rol === "ADMIN") {
          setEsAdmin(true);
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

  // Carga de usuarios tras confirmar permisos
  useEffect(() => {
    if (esAdmin) {
      cargarUsuarios();
    }
  }, [esAdmin]);

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
          bloqueadoPorSeguridad: data.bloqueadoPorSeguridad || false,
          intentosFallidos: data.intentosFallidos || 0,
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

  // 3. Alta de Nuevo Usuario en Authentication + Firestore simultáneamente
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);

    const usuarioLimpio = correoUsuario.replace(/@.*$/, "").trim().toLowerCase();
    const correoInstitucionalCompleto = `${usuarioLimpio}@toluca.tecnm.mx`;

    try {
      // Configuración de la app secundaria en memoria para no desloguear al Admin
      const appConfig = auth.app.options;
      const secondaryApp = getApps().find(a => a.name === "SecondaryApp") || initializeApp(appConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // A) Crear cuenta en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        correoInstitucionalCompleto,
        password
      );

      const nuevoAuthUid = userCredential.user.uid;

      // Cerrar la sesión secundaria inmediatamente para que quede limpio
      await secondarySignOut(secondaryAuth);

      // B) Registrar el perfil en Firestore usando exactamente el mismo UID de Authentication
      await setDoc(doc(db, "usuarios", nuevoAuthUid), {
        uid: nuevoAuthUid,
        nombre: nombre.trim().toUpperCase(),
        matricula_nomina: matricula.trim(),
        correo: correoInstitucionalCompleto,
        rol,
        activo: true,
        bloqueadoPorSeguridad: false,
        intentosFallidos: 0,
        carrera: rol === "ADMIN" ? "NO APLICA / PERSONAL ADMINISTRATIVO" : carrera,
        estatusAcademico: "ACTIVO",
        promedioGeneral: null,
        creadoEn: serverTimestamp(),
        creadoPor: currentUser?.uid,
      });

      // C) Emisión de log forense
      try {
        await addDoc(collection(db, "auditoria_logs"), {
          accion: "ALTA_USUARIO",
          usuarioAfectado: correoInstitucionalCompleto,
          uidAfectado: nuevoAuthUid,
          ejecutadoPor: currentUser?.email || currentUser?.uid,
          modulo: "ADMIN_DASHBOARD",
          severidad: "MEDIA",
          fecha: serverTimestamp(),
          detalle: `SysAdmin aprovisionó cuenta en Auth y Firestore para ${nombre.trim().toUpperCase()} (${correoInstitucionalCompleto}) con rol ${rol}`,
        });
      } catch (logErr) {
        console.warn("Log de auditoría no persistido:", logErr);
      }

      setMensaje({
        tipo: "exito",
        texto: `Usuario ${nombre} aprovisionado con éxito en Firebase Authentication y Firestore.`,
      });

      setNombre("");
      setMatricula("");
      setCorreoUsuario("");
      setPassword("");
      await cargarUsuarios();
    } catch (err: any) {
      console.error("Error al aprovisionar usuario:", err);
      let errorTexto = "Error al registrar el usuario.";
      if (err.code === "auth/email-already-in-use") {
        errorTexto = "El correo ya está registrado en Firebase Authentication.";
      } else if (err.code === "auth/weak-password") {
        errorTexto = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === "auth/invalid-email") {
        errorTexto = "El formato de correo institucional no es válido.";
      }
      setMensaje({ tipo: "error", texto: errorTexto });
    } finally {
      setCreando(false);
    }
  };

  // 4. Modificación de Estado y Desbloqueo Real en Firestore (UPDATE / GOBERNANZA)
  const toggleEstadoUsuario = async (u: UsuarioItem) => {
    try {
      const estaBloqueado = !u.activo || u.bloqueadoPorSeguridad;
      const nuevoEstadoActivo = estaBloqueado;

      await updateDoc(doc(db, "usuarios", u.id), {
        activo: nuevoEstadoActivo,
        bloqueadoPorSeguridad: !nuevoEstadoActivo,
        intentosFallidos: nuevoEstadoActivo ? 0 : 5,
        desbloqueadoEn: nuevoEstadoActivo ? serverTimestamp() : null,
        actualizadoEn: serverTimestamp(),
        actualizadoPor: currentUser?.uid,
      });

      try {
        await addDoc(collection(db, "auditoria_logs"), {
          accion: nuevoEstadoActivo ? "DESBLOQUEO_MANUAL_CUENTA" : "BLOQUEO_ADMINISTRATIVO",
          usuarioAfectado: u.correo,
          ejecutadoPor: currentUser?.email || currentUser?.uid,
          modulo: "ADMIN_DASHBOARD",
          severidad: nuevoEstadoActivo ? "MEDIA" : "ALTA",
          fecha: serverTimestamp(),
          detalle: `SysAdmin ${nuevoEstadoActivo ? "desbloqueó y reseteó a 0 los intentos de" : "suspendió"} la cuenta ${u.nombre}`,
        });
      } catch (logErr) {
        console.warn("No se pudo registrar log de auditoría:", logErr);
      }

      setUsuarios((prev) =>
        prev.map((item): UsuarioItem => {
          if (item.id !== u.id) return item;
          return {
            ...item,
            activo: Boolean(nuevoEstadoActivo),
            bloqueadoPorSeguridad: !nuevoEstadoActivo,
            intentosFallidos: nuevoEstadoActivo ? 0 : 5,
          };
        })
      );

      setMensaje({
        tipo: "exito",
        texto: nuevoEstadoActivo
          ? `Cuenta de ${u.nombre} desbloqueada en Firestore. Sus parámetros de seguridad volvieron a 0.`
          : `Cuenta de ${u.nombre} suspendida administrativamente.`,
      });
    } catch (err) {
      console.error("Error al actualizar estado en Firestore:", err);
      setMensaje({ tipo: "error", texto: "Error al modificar los parámetros en Firestore. Verifica las reglas de seguridad." });
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
        carrera: editCarrera,
        actualizadoEn: serverTimestamp(),
        actualizadoPor: currentUser?.uid,
      });

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioEditando.id
            ? { 
                ...u, 
                nombre: editNombre.trim().toUpperCase(), 
                matricula_nomina: editMatricula.trim(),
                carrera: editCarrera 
              }
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
    const confirmar = window.confirm(`¿Estás seguro de eliminar permanentemente al usuario ${u.nombre}? Esta acción no se puede revertir.`);
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
      u.rol.toLowerCase().includes(filtro.toLowerCase()) ||
      (u.carrera && u.carrera.toLowerCase().includes(filtro.toLowerCase()))
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
            Aprovisionamiento simultáneo en Authentication y Firestore con gobernanza de seguridad.
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
                El sistema crea las credenciales en **Firebase Authentication** y asocia de inmediato su perfil en **Firestore** con el mismo UID oficial.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1.5 pt-4 border-t border-slate-800 font-mono">
              <p className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-blue-400" /> Estudiantes: Expediente y carga reticular.</p>
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
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Correo Institucional (Usuario)
                </label>
                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-amber-500">
                  <input
                    type="text"
                    required
                    value={correoUsuario}
                    onChange={(e) => {
                      const val = e.target.value.replace(/@.*$/, "").trim().toLowerCase();
                      setCorreoUsuario(val);
                    }}
                    placeholder="jefatura.quimica"
                    className="w-full px-3 py-2 bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                  <span className="px-3 py-2 text-[11px] font-mono text-amber-400/90 bg-slate-900 border-l border-slate-800 select-none whitespace-nowrap">
                    @toluca.tecnm.mx
                  </span>
                </div>
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
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Carrera / Adscripción (TecNM Toluca)</label>
                <select
                  value={carrera}
                  onChange={(e) => setCarrera(e.target.value)}
                  disabled={rol === "ADMIN"}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                >
                  {CARRERAS_ITTOLUCA.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creando}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-amber-600/20"
            >
              {creando ? "Creando en Authentication y Firestore..." : "Generar Cuenta y Aprovisionar en Firestore"}
            </button>
          </form>
        </div>

        {/* Sección 2: CRUD y Gobernanza de Cuentas */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Cuentas Institucionales Registradas
              </h2>
              <p className="text-xs text-slate-400">Control directo de roles, edición de información y reactivación inmediata de cuentas bloqueadas.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar por nombre, correo, carrera..."
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
                    <th className="px-4 py-3">Carrera / Adscripción</th>
                    <th className="px-4 py-3">Correo Institucional</th>
                    <th className="px-4 py-3">Rol (RBAC)</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        No se encontraron usuarios registrados o coincidentes.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const estaBloqueado = !u.activo || u.bloqueadoPorSeguridad;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-semibold text-slate-300">{u.matricula_nomina}</td>
                          <td className="px-4 py-3 font-sans font-bold text-white">{u.nombre}</td>
                          <td className="px-4 py-3 font-sans text-slate-400 text-[11px]">
                            {u.carrera || "NO ASIGNADA"}
                          </td>
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
                            {!estaBloqueado ? (
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
                              <button
                                onClick={() => toggleEstadoUsuario(u)}
                                title={!estaBloqueado ? "Bloquear acceso" : "Desbloquear de inmediato (resetear intentos en Firestore)"}
                                className={`p-1.5 rounded-lg border transition ${
                                  !estaBloqueado 
                                    ? "bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/60" 
                                    : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60"
                                }`}
                              >
                                {!estaBloqueado ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => {
                                  setUsuarioEditando(u);
                                  setEditNombre(u.nombre);
                                  setEditMatricula(u.matricula_nomina);
                                  setEditCarrera(u.carrera || CARRERAS_ITTOLUCA[0]);
                                }}
                                title="Editar datos del usuario"
                                className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-300 hover:bg-blue-900/60 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

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
                      );
                    })
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
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Carrera / Adscripción</label>
                  <select
                    value={editCarrera}
                    onChange={(e) => setEditCarrera(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {CARRERAS_ITTOLUCA.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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