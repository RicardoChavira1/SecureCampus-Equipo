# SecureCampus

**Curso:** Desarrollo Seguro  
**Proyecto:** Sistema Web Académico Institucional  
**Equipo de Desarrollo:**  
- Colin Gerardo Vanessa Fernanda	22280383
- Gómez Gómez Joana Nataly 		    22280294
- González Ruiz Alan Ramses		    22280356
- Lugo Chavira Ricardo			    22280388


---

## 1. La Problemática

Un sistema académico institucional concentra información y operaciones críticas que no todos los usuarios deben utilizar de la misma manera:

- **Información sensible y de valor:** Perfiles personales, historiales de calificaciones, documentación oficial y solicitudes académicas requieren protección de confidencialidad e integridad.
- **Capacidades diferenciadas:** Estudiantes, profesores, administradores y jefes de carrera interactúan bajo necesidades operativas y niveles de privilegio específicos según su rol.
- **Seguridad más allá de la funcionalidad:** Una función que opera correctamente a nivel visual puede ser insegura si el backend no protege la identidad, los datos y los permisos en cada petición.

---

## 2. Nuestra Misión

Durante el semestre desarrollaremos **SecureCampus** como un equipo de desarrollo siguiendo prácticas formales de **Secure SDLC**:

- Analizar necesidades funcionales y evaluar riesgos de seguridad desde etapas tempranas (*Shift Left*).
- Diseñar e implementar controles defensivos contra fallas comunes (autorización rota, inyecciones, manipulación de parámetros).
- Incorporar la seguridad de manera continua en la arquitectura y no como un parche final.
- Versionar decisiones técnicas, análisis de amenazas y evidencias directamente en GitHub como bitácora del equipo.

---

## 3. Los actores de SecureCampus

Tres actores iniciales con necesidades distintas, complementados con la gestión académica del Jefe de Carrera:

### Estudiante
- Perfil propio.
- Calificaciones propias.
- Documentos propios.
- Solicitudes e historial.

### Profesor
- Perfil.
- Grupos asignados.
- Captura de calificaciones.
- Listas autorizadas.

### Administrador
- Perfil.
- Usuarios.
- Roles y permisos.
- Logs.
- Operaciones condicionadas.

### Jefe de Carrera
- Perfil.
- Dar de alta y baja profesores.
- Creación de grupos.
- Inscripción.

---


