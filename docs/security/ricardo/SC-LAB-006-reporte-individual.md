# SC-LAB-006: Laboratorio Integrador - Seguridad en Backend y CI/CD
**Estudiante:** Ricardo Lugo Chavira  
**Asignatura:** Desarrollo Seguro (Bloque 2)  
**Proyecto:** SecureCampus  

---

## 1. Distribución de Roles y Alcance
* **Rol Asumido:** Backend, Identidad/Acceso y DevSecOps.
* **Módulos Trabajados:** 
  * `src/validators.py`: Validación estricta y tipada de entradas.
  * `src/permissions.py`: Control de acceso basado en relaciones (ReBAC).
  * `.github/workflows/security.yml`: Automatización de pruebas y auditoría con GitHub Actions.

---

## 2. Actividades y Decisiones de Seguridad

### Actividad A: Diseño Seguro y Resiliencia
* **Diagrama de Flujo Lógico:**  
  `Petición PUT` -> `Autenticación (Cookie HttpOnly)` -> `CSRF Token (Header)` -> `Autorización ReBAC (Profesor/Grupo)` -> `Validación Tipos (Decimal 0..100)` -> `Transacción Atómica (Grades + Outbox)`
* **Patrón Transactional Outbox:** La inserción de la calificación y el evento en `notification_outbox` se ejecutan dentro del mismo bloque de transacción (`with connect(...) as con:`). Si el servicio de correo o notificaciones falla o se degrada, la calificación no se revierte ni se bloquea.
* **Principio Fail-Safe Defaults:** A diferencia de las notificaciones, los controles de autorización (`403 Forbidden`) y autenticación (`401 Unauthorized`) no pueden degradarse; una falla en estos controles debe rechazar la petición inmediatamente para evitar escalamiento de privilegios o vulnerabilidades BOLA/IDOR.

### Actividad B: Validación Numérica Estricta (`src/validators.py`)
* Se implementó validación defensiva rechazando valores nulos (`None`), booleanos (`True`/`False`), valores infinitos o `NaN`, cadenas vacías, valores menores a 0 o mayores a 100, y entradas con más de dos decimales sin aplicar redondeo implícito.
* **Casos Validados:** 85 y 99.50 aceptados; 150, -1, 'hola', '', 'NaN', None y 99.999 rechazados con `ValueError` (mapeado a `400 Bad Request`).

### Actividad C: Control de Acceso por Recurso ReBAC (`src/permissions.py`)
* **Modificación (`puede_modificar`):** Exige que el rol sea `'profesor'`, comprueba que sea el titular asignado al grupo en la base de datos (`groups.professor_id == user['id']`) y valida que el alumno esté formalmente matriculado (`enrollments`).
* **Consulta (`puede_consultar`):** Los administradores no consultan notas por defecto. Un estudiante solo puede consultar su propia nota si está inscrito en el grupo (`user['id'] == student_id`). Un profesor solo consulta si es el titular del grupo y el estudiante está asignado a él.
* Manejo directo de filas SQLite mediante indexación de tupla/diccionario (`user['role']`, `user['id']`) para compatibilidad con `sqlite3.Row`.

### Actividad D: Criptografía, Sesiones y CSRF
* **Hash vs. Cifrado:** Las contraseñas no se cifran, se generan mediante hashes unidireccionales (`generate_password_hash` con salt y coste computacional mediante Werkzeug). El cifrado es reversible; el hash es estrictamente unidireccional.
* **Seguridad en Cookies:** La cookie de sesión `sc_session` incluye la directiva `HttpOnly` para mitigar robo por XSS, además de `SameSite=Lax` y `Secure` en producción.
* **Almacenamiento Mínimo:** En la base de datos no se guarda el token en crudo, sino su resumen `SHA-256` (`token_hash`) junto a su marca de expiración (`expires_at`).
* **CSRF Mitigation:** Las operaciones no idempotentes (`PUT`, `POST`) requieren la cabecera `X-CSRF-Token`, comparada usando `secrets.compare_digest` para neutralizar ataques de tiempo (timing attacks).

### Actividad E: Auditoría de Dependencias y Tratamiento de Errores
* **Consultas Parametrizadas:** Todas las sentencias SQL en `app.py` y `permissions.py` utilizan comodines posicionales `?` para prevenir inyección SQL.
* **Manejo de Errores:** Las excepciones no exponen trazas de pila (stacktraces) al cliente; devuelven payloads JSON genéricos con códigos HTTP adecuados (400, 401, 403, 404).
* **Auditoría de Dependencias:** Ejecución de `pip-audit -r requirements.txt` arrojó cero vulnerabilidades conocidas (*No known vulnerabilities found*).

---

## 3. Matriz de Permisos y Resultados

| Caso / Actor | Método / Acción | HTTP Esperado | Resultado Obtenido |
| :--- | :--- | :---: | :---: |
| Profesor propio | PUT / Actualizar nota | 200 OK | Aprobado (`Calificación guardada`) |
| Profesor ajeno al grupo | PUT / Actualizar nota | 403 Forbidden | Aprobado (`Acceso denegado`) |
| Estudiante propio e inscrito | GET / Consultar nota | 200 OK | Aprobado (`grade: XX`) |
| Estudiante ajeno al recurso | GET / Consultar nota | 403 Forbidden | Aprobado (`Acceso denegado`) |
| Petición sin sesión | GET / Consultar nota | 401 Unauthorized | Aprobado (`Autenticación requerida`) |
| Petición sin CSRF | PUT / Actualizar nota | 403 Forbidden | Aprobado (`CSRF inválido`) |

---

## 4. Registro de Evidencias (CI/CD y Pruebas)

* **Pruebas Unitarias:** 15 pruebas de seguridad aprobadas en entorno local (`15 passed in 5.76s`).
* **Auditoría:** `pip-audit` ejecutado exitosamente sin vulnerabilidades.
* **Pipeline GitHub Actions:** Flujo configurado en `.github/workflows/security.yml` sobre Ubuntu runner con Python 3.11.
* **Enlace al Pull Request:** [PR #1: SecureCampus-Equipo](https://github.com/RicardoChavira1/SecureCampus-Equipo/pull/1)
* **Estado de Integración:** `All checks have passed` (2 checks exitosos: pytest y pip-audit).

---

## 5. Reflexión Individual

* **¿Qué control fue más difícil de implementar?**  
  La autorización basada en relaciones (ReBAC) en `permissions.py`. El principal reto radicó en validar correctamente las relaciones cruzadas entre los identificadores en SQLite (`groups.professor_id` y `enrollments`) interactuando con los objetos nativos `sqlite3.Row` devueltos por el framework, asegurando que ante cualquier inconsistencia la respuesta fuera un `403 Forbidden` estricto sin generar excepciones no controladas.
* **¿Qué prueba brindó mayor confianza?**  
  Las pruebas negativas parametrizadas en `test_grade_invalid` y `test_professor_other_group_forbidden`. Verificar que el sistema rechaza sistemáticamente valores anómalos (`NaN`, infinitos, booleanos) y que bloquea modificaciones entre profesores de grupos distintos valida que el modelo de seguridad no depende de la confianza en el cliente, sino de reglas duras en el servidor.
* **¿Qué medidas faltan antes de un despliegue en producción?**  
  1. Reemplazar la base local monohilo SQLite por un motor transaccional cliente-servidor (PostgreSQL) con pool de conexiones.  
  2. Implementar autenticación multifactor (MFA) y mecanismos de limitación de tasa (*Rate Limiting*) para mitigar ataques de fuerza bruta.  
  3. Fijar las acciones de GitHub Actions mediante hashes criptográficos completos (SHA de commit) en lugar de etiquetas de versión flotantes, aplicando además políticas de protección de ramas con revisiones obligatorias.
