# SC-LAB-007: Exploración Guiada de APIs REST y GraphQL
**Estudiante:** Ricardo Lugo Chavira  
**Asignatura:** Desarrollo Seguro (Tema 3: Seguridad en Aplicaciones Web y APIs)  
**Proyecto:** SecureCampus  

---

## 1. Propósito y Entorno de Ejecución
* **Objetivo:** Iniciar una API local en Python (`Flask` + `graphql-core`), ejecutar solicitudes autenticadas y no autorizadas sobre REST y GraphQL, analizar códigos de estado HTTP y comprobar que la autorización se aplica estrictamente en el servidor.
* **Verificación Automatizada (`pytest`):** 18 pruebas aprobadas (`18 passed in 6.92s`), cubriendo las 15 validaciones previas de seguridad y 3 pruebas específicas para GraphQL y control de acceso relacional.

---

## 2. Registro de Experiencias Guiadas y Evidencias

### Experiencia A: REST GET (`profe_ana`)
* **Caso Permitido (`GET /grades/3/10`):** Devuelve **HTTP 200 OK** con el JSON `{"grade": "85", "group_id": 10, "student_id": 3}`, ya que `profe_ana` es titular del grupo `10` (ISC401) y la alumna `3` (`alumna_eli`) está inscrita en él.
* **Caso Denegado (`GET /grades/4/20`):** Devuelve **HTTP 403 Forbidden** (`{"error": "Acceso denegado"}`), debido a que `profe_ana` no tiene asignación sobre el grupo `20` (ISC402).
* **Análisis:** Entre ambas solicitudes cambian los identificadores del recurso (`student_id` y `group_id`). Aunque `profe_ana` está autenticada con una cookie de sesión válida (`sc_session`), la autenticación por sí sola no basta porque únicamente identifica *quién es* el usuario; se requiere autorización en el servidor (ReBAC) para validar *qué recursos* tiene permitido consultar o modificar.

### Experiencia B: REST PUT y Validación (`profe_ana`)
* **Modificación Válida (`PUT /grades/3/10` con `88.50`):** Devuelve **HTTP 200 OK** exigiendo la cabecera `X-CSRF-Token` vinculada a la sesión.
* **Modificación No Autorizada (`PUT /grades/4/20`):** Devuelve **HTTP 403 Forbidden**.
* **Entrada Inválida (`PUT /grades/3/10` con `150`):** Devuelve **HTTP 400 Bad Request**, rechazando valores fuera del rango `[0, 100]`.

### Experiencia C: Control de Acceso por Rol (`alumna_eli`)
* **Consulta Propia (`GET /grades/3/10`):** Devuelve **HTTP 200 OK**.
* **Consulta Ajena (`GET /grades/4/20`):** Devuelve **HTTP 403 Forbidden**.
* **Intento de Modificación Propia (`PUT /grades/3/10`):** Devuelve **HTTP 403 Forbidden**.
* **Análisis:** Ser dueño de la lectura de una calificación no autoriza a modificarla debido al **Principio de Mínimo Privilegio (PoLP)** y la separación de funciones; la facultad de escritura corresponde exclusivamente al docente asignado a la materia para garantizar la integridad académica.

### Experiencia D: Consultas en GraphQL (`alumna_eli`)
* **Consulta Autorizada:** `query { grade(studentId: 3, groupId: 10) { studentId groupId grade } }` — Responde **HTTP 200 OK** entregando `data.grade` con los campos exactos solicitados.
* **Consulta Denegada:** `query { grade(studentId: 4, groupId: 20) { studentId groupId grade } }` — Responde **HTTP 403 Forbidden** bajo el arreglo `errors` (`"Acceso denegado"`), comprobando que el *resolver* de GraphQL aplica la misma validación `puede_consultar` que la API REST.

---

## 3. Comparativa Observada: REST vs. GraphQL

| Dimensión | API REST | API GraphQL |
| :--- | :--- | :--- |
| **Identificación del Recurso** | Mediante rutas explícitas en la URL (ej. `/grades/3/10`). | Mediante un único endpoint (`POST /graphql`) y argumentos en la consulta. |
| **Operaciones** | Verbos HTTP (`GET` para consultar, `PUT` para modificar). | En este laboratorio se implementaron consultas de lectura (`query`). |
| **Estructura de Respuesta** | JSON con estructura fija definida por el endpoint. | JSON encapsulado bajo las claves `data` o `errors` con solo los campos pedidos. |
| **Control de Acceso** | Validado por el servidor en cada ruta antes de acceder a SQLite. | Validado dentro del *resolver* en el servidor antes de consultar la base de datos. |

---

## 4. Preguntas de Reflexión

1. **¿Qué significa 200, 400, 401 y 403?**
   * **200 (OK):** La solicitud fue procesada correctamente; el usuario está autenticado y tiene autorización sobre el recurso solicitado.
   * **400 (Bad Request):** El servidor rechazó la petición porque los datos enviados son inválidos (por ejemplo, una calificación fuera de rango o no numérica) o la sintaxis de la consulta GraphQL es incorrecta.
   * **401 (Unauthorized):** El usuario no ha iniciado sesión o su cookie/token de sesión expiró o fue revocado (`Autenticación requerida`).
   * **403 (Forbidden):** El usuario sí está autenticado, pero el servidor le niega el acceso porque no tiene permisos sobre ese recurso específico o porque omitió/envió un token `X-CSRF-Token` inválido.

2. **¿Qué diferencia existe entre iniciar sesión y tener autorización?**
   * **Iniciar sesión (Autenticación)** es comprobar *quién es* el usuario mediante sus credenciales para otorgarle una sesión válida (`sc_session`). **Tener autorización** es verificar en el servidor *qué acciones y sobre qué recursos específicos* puede operar ese usuario ya autenticado (por ejemplo, que `profe_ana` solo pueda consultar y calificar a los alumnos inscritos en su grupo `10`, pero no en el `20`).

3. **¿Por qué una persona no debe poder consultar calificaciones de otros estudiantes cambiando los identificadores?**
   * Porque permitirlo representa una vulnerabilidad crítica de control de acceso conocida como **IDOR (Insecure Direct Object Reference)** o **BOLA (Broken Object Level Authorization)**. Si el backend confía en el ID que viene en la URL sin verificar a quién pertenece la sesión, se vulnera la confidencialidad y privacidad de los datos académicos de terceros.

4. **¿Qué cambia al consultar una calificación por REST o por GraphQL?**
   * **En REST**, el recurso se solicita mediante una ruta específica (`/grades/3/10`) y el servidor devuelve siempre una estructura JSON fija con todos los campos del recurso (`student_id`, `group_id`, `grade`). **En GraphQL**, las peticiones se envían a un único endpoint (`POST /graphql`) y el cliente elige exactamente qué campos desea recibir en el bloque de selección (por ejemplo, pedir solo `{ grade }`), evitando la transferencia innecesaria de datos (*over-fetching*).

5. **¿Qué pasaría si GraphQL omitiera la comprobación de permisos?**
   * Se abriría una brecha de seguridad (BOLA/IDOR) idéntica a la de una API REST desprotegida: cualquier usuario autenticado (como `alumna_eli`) podría consultar las calificaciones de cualquier otro estudiante del sistema simplemente cambiando los argumentos `studentId` y `groupId` en su consulta GraphQL, anulando por completo las restricciones impuestas en los endpoints REST.
