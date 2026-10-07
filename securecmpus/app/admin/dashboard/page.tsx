"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User, getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { auth, db } from "../../../lib/firebase";
import { 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Lock, 
  GraduationCap, 
  Briefcase, 
  UserCheck 
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState("");

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [matricula, setMatricula] = useState("");
  const [rol, setRol] = useState<"ESTUDIANTE" | "PROFESOR" | "JEFE_CARRERA">("ESTUDIANTE");
  const [materiaInicial, setMateriaInicial] = useState("DESARROLLO SEGURO");
  const [submitting, setSubmitting] = useState(false);
  const [notificacion, setNotificacion] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      // Verificación estricta de privilegios ADMIN
      const adminDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
      if (!adminDoc.exists() || adminDoc.data().rol !== "ADMIN") {
        setErrorAcceso("Acceso denegado: Se requieren privilegios de Administrador del Sistema.");
        setLoading(false);
        return;
      }

      setAdminUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotificacion(null);

    const correoLimpio = correo.trim().toLowerCase();

    // Validación perimetral de dominio institucional
    if (!correoLimpio.endsWith("@toluca.tecnm.mx") && !correoLimpio.endsWith("@ittoluca.edu.mx")) {
      setNotificacion({
        tipo: "error",
        texto: "El correo debe pertenecer al dominio institucional (@toluca.tecnm.mx o @ittoluca.edu.mx).",
      });
      setSubmitting(false);
      return;
    }

    try {
      // 1. Instancia secundaria para no desconectar al administrador activo
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const secondaryApp = getApps().find((a) => a.name === "SecondaryAdminApp") 
        || initializeApp(firebaseConfig, "SecondaryAdminApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Creación criptográfica de identidad en Firebase Authentication
      const cred = await createUserWithEmailAndPassword(secondaryAuth, correoLimpio, password);
      const newUid = cred.user.uid;
      await signOut(secondaryAuth);

      // 3. Auto-aprovisionamiento del documento en Firestore
      await setDoc(doc(db, "usuarios", newUid), {
        nombre: nombre.trim().toUpperCase(),
        correo: correoLimpio,
        matricula_nomina: matricula.trim(),
        carrera: "INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIONES",
        especialidad: rol === "ESTUDIANTE" ? "INGENIERÍA DE DATOS" : "DOCENCIA",
        promedioGeneral: rol === "ESTUDIANTE" ? 85.0 : null,
        estatusAcademico: "ACTIVO",
        rol: rol,
        activo: true,
        creadoPor: adminUser?.uid,
        creadoEn: serverTimestamp(),
      });

      // 4. Si el nuevo usuario es ESTUDIANTE, generamos automáticamente su acta inicial
      if (rol === "ESTUDIANTE") {
        await addDoc(collection(db, "calificaciones"), {
          alumnoUid: newUid,
          alumnoNombre: nombre.trim().toUpperCase(),
          matricula: matricula.trim(),
          materia: materiaInicial,
          semestre: 9,
          creditos: 5,
          unidades: [null, null, null, null, null, null, null, null, null],
          calificacionFinal: null,
          cerrado: false,
          fechaAsignacion: serverTimestamp(),
        });
      }

      setNotificacion({
        tipo: "ok",
        texto: `Usuario ${rol} aprovisionado correctamente (UID: ${newUid}). Las colecciones y registros se sincronizaron automáticamente.`,
      });

      // Limpiar formulario
      setNombre("");
      setCorreo("");
      setPassword("");
      setMatricula("");
    } catch (err: any) {
      setNotificacion({
        tipo: "error",
        texto: err.message || "Error al procesar el alta institucional.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Verificando jerarquía RBAC de Administrador...</p>
      </div>
    );
  }

  if (errorAcceso) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-4">
        <Lock className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Privilegios Insuficientes</h2>
        <p className="text-xs text-rose-300">{errorAcceso}</p>
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
    <div className="space-y-8 py-6 max-w-6xl mx-auto px-4">
      {/* Cabecera de Administración */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-700/50 px-3 py-1 rounded-full text-[11px] font-semibold text-amber-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Módulo de Control de Acceso (RBAC) · SysAdmin</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Gestión Central de Usuarios y Plantillas
          </h1>
          <p className="text-xs text-slate-400">
            Aprovisionamiento automático de credenciales en Firebase Auth y colecciones en Firestore
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Mi Perfil
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

      {notificacion && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm border flex items-start gap-3 ${
            notificacion.tipo === "ok"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/40 text-rose-200"
          }`}
        >
          {notificacion.tipo === "ok" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Panel Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">Alta sin Consola Manual</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Al registrar a cualquier miembro, el sistema asocia las reglas institucionales, genera su identidad criptográfica y siembra sus actas sin requerir intervención manual en bases de datos.
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Estudiantes: Crea expediente y acta inicial.</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Docentes: Habilita el portal de captura.</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Jefaturas: Habilita apertura de grupos.</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCrearUsuario} className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="RICARDO LUGO CHAVIRA"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Rol a Asignar</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              >
                <option value="ESTUDIANTE">ESTUDIANTE</option>
                <option value="PROFESOR">PROFESOR</option>
                <option value="JEFE_CARRERA">JEFE DE CARRERA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Número de Control / Nómina</label>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="22280388"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Correo Institucional</label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="l22280388@toluca.tecnm.mx"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contraseña de Acceso</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {rol === "ESTUDIANTE" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Materia Inicial</label>
                <select
                  value={materiaInicial}
                  onChange={(e) => setMateriaInicial(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="DESARROLLO SEGURO">DESARROLLO SEGURO</option>
                  <option value="SISTEMAS OPERATIVOS II">SISTEMAS OPERATIVOS II</option>
                  <option value="BASES DE DATOS NO RELACIONALES">BASES DE DATOS NO RELACIONALES</option>
                  <option value="INGENIERÍA DEL CONOCIMIENTO">INGENIERÍA DEL CONOCIMIENTO</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-amber-600/20"
          >
            {submitting ? "Sincronizando Identidad y Colecciones..." : "Generar Cuenta y Aprovisionar en Firestore"}
          </button>
        </form>
      </div>
    </div>
  );
}