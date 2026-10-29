# SC-LAB-001: Identificación inicial de activos, amenazas, vulnerabilidades, ataques, impactos, riesgos y controles

- **Proyecto:** SecureCampus
- **Curso:** Desarrollo Seguro
- **Fecha:** Septiembre 2026
- **Integrantes del equipo:**
  - Ricardo Lugo Chavira
  - Vanessa Fernanda Colin Gerardo
  - Joana Nataly Gomez Gomez
  - Alan Ramses Gonzalez Ruiz

---

## 1. Actividad guiada: Consulta de perfiles (/perfil/125 -> /perfil/126)

| Elemento | Respuesta del equipo | Justificación |
| :--- | :--- | :--- |
| **Activo** | Datos personales y expediente académico del estudiante (nombre, matrícula, contacto). | Información privada con valor de confidencialidad institucional y normativo. |
| **Amenaza** | Consulta no autorizada de perfiles ajenos por parte de un usuario autenticado. | Un alumno con sesión activa altera intencionalmente las consultas para ver datos de otros compañeros. |
| **Vulnerabilidad** | Falla de autorización a nivel de objeto (IDOR / BOLA). | El backend recibe el ID de la URL y devuelve los datos sin validar que coincida con la sesión activa. |
| **Ataque** | Manipulación de parámetros en la URL (parámetro `/perfil/126`). | Modificación manual del ID numérico directamente en la barra de direcciones del navegador. |
| **Impacto** | Pérdida de confidencialidad y exposición indebida de datos personales. | Violación a las políticas institucionales de privacidad y filtración de información privada. |
| **Riesgo** | Riesgo Alto. | Probabilidad alta por facilidad de ejecución e impacto crítico en la confidencialidad de los alumnos. |
| **Control** | Validación estricta de autorización y pertenencia en el backend. | Middleware que verifique que el `usuario_id` del token o sesión activa coincida con el perfil consultado. |

---

## 2. Reto por equipo: Matriz de análisis de seguridad

| Escenario | Activo | Amenaza | Vulnerabilidad | Ataque | Impacto | Control |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Calificaciones** | Integridad del historial de notas y actas académicas. | Alteración fraudulenta de calificaciones por parte de alumnos. | Endpoints de captura sin validación de docente asignado al grupo. | Petición HTTP manipulada (POST/PUT) enviando calificaciones alteradas. | Pérdida de integridad y actas académicas alteradas de forma fraudulenta. | RBAC estricto en backend validando rol de docente y asignación formal de materia. |
| **2. Documentos** | Archivos oficiales de los alumnos (kardex, constancias, certificados). | Descarga no autorizada y filtración de expedientes de otros alumnos. | Enlaces de descarga directos con identificadores numéricos predecibles. | Fuerza bruta o scraping cambiando el ID en la URL de descarga de documentos. | Pérdida de confidencialidad y filtración de expedientes confidenciales. | Generación de URLs prefirmadas de corta duración y validación previa de permisos. |
| **3. Autenticación** | Credenciales de acceso a cuentas de alumnos, profesores y admin. | Robo de contraseñas por ataques automatizados de fuerza bruta. | Formulario de login sin limitación de tasa (*rate limiting*) ni bloqueo tras intentos. | Envío masivo y automatizado de combinaciones de usuario y contraseña al `/login`. | Compromiso total de cuentas, suplantación de identidad y acceso no autorizado. | Rate limiting en endpoints de login, captcha tras 3 intentos fallidos y soporte 2FA. |
| **4. Roles y permisos (Admin)** | Operaciones administrativas de asignación de privilegios. | Escalada de privilegios verticales por usuarios de menor nivel. | Rutas de administración expuestas sin verificación de rol en el servidor. | Invocación directa a rutas administrativas vía API o herramientas HTTP. | Pérdida de control del sistema y acceso completo e irrestricto a los datos. | Middlewares de autorización en rutas protegidas validando privilegios en backend. |

---

## 3. Preguntas de reflexión

1. **¿Una amenaza y una vulnerabilidad son lo mismo? Explica con un ejemplo de SecureCampus.**  
   No. La vulnerabilidad es la debilidad interna del sistema (por ejemplo, que el endpoint `/perfil/{id}` no valide quién solicita la información), mientras que la amenaza es el actor o situación externa que aprovecha esa debilidad (por ejemplo, un estudiante que cambia deliberadamente el ID en la URL para ver datos ajenos).

2. **¿Puede existir una vulnerabilidad aunque todavía nadie la haya explotado?**  
   Sí. El error de diseño o programación existe en el código desde el momento en que se implementa, sin importar si algún atacante ya lo ha descubierto o ejecutado.

3. **¿Un usuario autenticado está automáticamente autorizado para cualquier recurso?**  
   No. La autenticación solo responde "¿quién eres?" verificando las credenciales; la autorización define "¿qué puedes hacer?" sobre un recurso específico. Un estudiante con sesión válida no tiene autorización para modificar calificaciones ni ver documentos de terceros.

4. **¿Qué control de los propuestos debería definirse desde requisitos o diseño? ¿Por qué?**  
   El modelo de Control de Acceso Basado en Roles (RBAC) y la validación en backend. Diseñarlo desde el inicio previene tener que rediseñar la base de datos, las consultas y los controladores cuando el proyecto ya esté avanzado.

5. **¿Qué activo consideran más crítico y por qué?**  
   Las cuentas y credenciales del Administrador. Si un atacante compromete este rol, obtiene control total de la base de datos, pudiendo alterar calificaciones, exponer documentos y desactivar registros de auditoría.

---

## 4. Pregunta de salida

- **¿Qué protegerías primero en SecureCampus y qué podría impedir que ese activo permanezca seguro?**  
   El control de autorización por roles y permisos debería definirse desde la etapa de requisitos y diseño, porque desde el inicio se debe establecer qué acciones puede realizar cada tipo de usuario. Esto ayuda a evitar que estudiantes, profesores o administradores accedan a funciones o información que no les corresponden y reduce la necesidad de hacer cambios grandes cuando el sistema ya esté desarrollado.
