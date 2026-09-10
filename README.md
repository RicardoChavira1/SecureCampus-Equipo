# SecureCampus

**Curso:** Desarrollo Seguro  
**Proyecto:** Sistema Web Académico Institucional  
**Equipo de Desarrollo:**  
- Ricardo Lugo Chavira
- Vanessa Fernanda Colin Gerardo

-Joana Nataly Gomez Gomez
-Alan Ramses Gonzalez Ruiz

---

## 1. La Problemática

Un sistema académico institucional concentra información y operaciones críticas que no todos los usuarios deben utilizar de la misma manera:

- **Información sensible y de valor:** Perfiles personales, historiales de calificaciones, documentación oficial y solicitudes académicas requieren protección de confidencialidad e integridad.
- **Capacidades diferenciadas:** Estudiantes, profesores y administradores necesitan permisos y accesos operativos completamente distintos según su rol.
- **Seguridad más allá de la funcionalidad:** Una función que opera correctamente a nivel visual puede ser insegura si el backend no protege la identidad, los datos y los permisos en cada petición.

---

## 2. Nuestra Misión

Durante el semestre desarrollaremos **SecureCampus** como un equipo de desarrollo siguiendo prácticas formales de **Secure SDLC**:

- Analizar necesidades funcionales y evaluar riesgos de seguridad desde etapas tempranas (*Shift Left*).
- Diseñar e implementar controles defensivos contra fallas comunes (autorización rota, inyecciones, manipulación de parámetros).
- Incorporar la seguridad de manera continua en la arquitectura y no como un parche final.
- Versionar decisiones técnicas, análisis de amenazas y evidencias directamente en GitHub como bitácora del equipo.

---

## 3. Actores de SecureCampus

El sistema delimita las capacidades de tres actores principales aplicando el principio de mínimo privilegio:

###  Estudiante
- Perfil propio exclusivo.
- Consulta de calificaciones e historial académico propio.
- Gestión y descarga de documentos propios autorizados.
- Registro y seguimiento de solicitudes e historial.

###  Profesor
- Gestión de perfil docente.
- Consulta de grupos asignados y listas autorizadas.
- Captura, modificación y cierre de calificaciones de sus materias asignadas.

###  Administrador
- Administración integral de usuarios.
- Asignación y control de roles y permisos del sistema (RBAC).
- Supervisión mediante consulta y auditoría de logs.
- Aprobación de operaciones académicas condicionadas.
