import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function sembrarBaseDeDatos() {
  console.log("Iniciando la siembra automática de SecureCampus en Firestore...");

  // 1. USUARIOS
  await setDoc(doc(db, "usuarios", "USER_ADMIN_01"), {
    nombre: "Administrador Central",
    correo: "admin@ittoluca.edu.mx",
    rol: "ADMIN",
    matricula_nomina: "ADM-001",
    activo: true,
    creadoEn: Timestamp.now()
  });

  await setDoc(doc(db, "usuarios", "USER_DOCENTE_01"), {
    nombre: "Dr. Roberto García",
    correo: "rgarcia@ittoluca.edu.mx",
    rol: "PROFESOR",
    matricula_nomina: "DOC-102",
    activo: true,
    creadoEn: Timestamp.now()
  });

  await setDoc(doc(db, "usuarios", "USER_ALUMNO_01"), {
    nombre: "Ricardo Lugo Chavira",
    correo: "22280388@ittoluca.edu.mx",
    rol: "ESTUDIANTE",
    matricula_nomina: "22280388",
    activo: true,
    creadoEn: Timestamp.now()
  });

  // 2. GRUPOS
  await setDoc(doc(db, "grupos", "GRP_DS_401"), {
    claveMateria: "DS-401",
    nombreMateria: "Desarrollo Seguro",
    periodo: "2026-2",
    profesorUid: "USER_DOCENTE_01",
    creadoPor: "USER_ADMIN_01",
    cupoMaximo: 30
  });

  // 3. INSCRIPCIONES
  await setDoc(doc(db, "inscripciones", "INS_001"), {
    grupoId: "GRP_DS_401",
    alumnoUid: "USER_ALUMNO_01",
    inscritoPor: "USER_ADMIN_01",
    fechaInscripcion: Timestamp.now()
  });

  // 4. CALIFICACIONES
  await setDoc(doc(db, "calificaciones", "CAL_001"), {
    grupoId: "GRP_DS_401",
    alumnoUid: "USER_ALUMNO_01",
    profesorUid: "USER_DOCENTE_01",
    parcial1: 95,
    parcial2: 90,
    calificacionFinal: 93,
    cerrado: false,
    actualizadoEn: Timestamp.now()
  });

  // 5. SOLICITUDES
  await setDoc(doc(db, "solicitudes", "SOL_001"), {
    alumnoUid: "USER_ALUMNO_01",
    tipoSolicitud: "Constancia de Estudios",
    motivo: "Trámite de servicio social",
    estado: "PENDIENTE",
    respuestaAdmin: "",
    creadoEn: Timestamp.now()
  });

  // 6. DOCUMENTOS
  await setDoc(doc(db, "documentos", "DOC_001"), {
    alumnoUid: "USER_ALUMNO_01",
    tipoDocumento: "Kardex",
    urlArchivo: "https://securecampus.storage/kardex/22280388.pdf",
    firmadoPor: "USER_ADMIN_01",
    emitidoEn: Timestamp.now()
  });

  // 7. AUDITORIA_LOGS
  await setDoc(doc(db, "auditoria_logs", "LOG_INIT_01"), {
    usuarioUid: "USER_ADMIN_01",
    rol: "ADMIN",
    accion: "INICIALIZACION_SISTEMA",
    recurso: "sistema/seed",
    ip: "127.0.0.1",
    timestamp: Timestamp.now()
  });

  console.log("¡Siembra completada! Las 7 colecciones ya existen en Firestore.");
  process.exit(0);
}

sembrarBaseDeDatos().catch((error) => {
  console.error("Error al poblar Firestore:", error);
  process.exit(1);
});