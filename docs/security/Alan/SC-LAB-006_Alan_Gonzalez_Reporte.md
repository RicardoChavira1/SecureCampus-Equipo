# SC-LAB-006 — Desarrollo seguro de calificaciones, validación, acceso y CI/CD

**Integrante:** Alan Ramses Gonzalez Ruiz  
**Asignatura / proyecto:** Desarrollo Seguro · SecureCampus  
**Fecha del reporte original:** 1 de noviembre de 2026  
**Alcance:** API educativa Flask y SQLite

## 1. Objetivo

Corregir y comprobar controles de validación de calificaciones y autorización en una API educativa, revisar la protección de contraseñas y sesiones, y ejecutar pruebas automáticas, auditoría de dependencias e integración continua.

## 2. Arquitectura y riesgos (E1)

La solicitud para modificar una calificación sigue esta secuencia:

`Autenticación → CSRF → Autorización por recurso → Validación → Base de datos + notification_outbox → Respuesta HTTP`

| Riesgo | Control o respuesta |
| --- | --- |
| Profesor intenta modificar un grupo ajeno | Comprobar asignaciones en `groups` y `enrollments`; rechazar con 403 |
| Falla el servicio de notificaciones | Guardar el evento en `notification_outbox` para procesamiento posterior, sin omitir autorizaciones |
| Calificación inválida | Verificar rango, tipo y precisión; devolver 400 |
| Sesión expirada o revocada | Rechazar acceso sin sesión válida con 401 |

La notificación puede diferirse; la autorización no debe omitirse para permitir que una operación “funcione”.

## 3. Validación (E2)

En `src/validators.py` se completó `validar_calificacion()`. Se aceptan valores entre 0 y 100 con hasta dos decimales y se rechazan booleanos, cadenas vacías, texto no numérico, `NaN`, infinito y valores fuera de rango; no se redondean cifras de más.

| Momento de la práctica | Resultado de pytest |
| --- | --- |
| Ejecución inicial | **11 failed, 4 passed** |
| Después de la validación | **3 failed, 12 passed** |
| Después de corregir permisos | **15 passed** |

Casos como `85` y `99.50` se aceptaron; `150`, `-1`, `99.999`, `True`, `False` y entradas no numéricas se rechazaron conforme a las reglas.

## 4. Autorización por recurso (E3)

En `src/permissions.py` se completaron `puede_modificar` y `puede_consultar` usando información de SQLite.

| Perfil | Consulta | Modificación |
| --- | --- | --- |
| Profesor | Calificaciones de grupos asignados | Solo estudiantes de esos grupos |
| Estudiante | Solo su propia calificación | No permitido |
| Administrador | No habilitado por defecto en la implementación | No permitido por defecto |
| Sin sesión | No | No |

Se verificaron tres pruebas negativas de acceso: `test_professor_other_group_forbidden`, `test_student_cannot_modify` y `test_student_cannot_read_other_student`. **Resultado: 3 passed.** Autenticarse no autoriza acciones sobre cualquier recurso.

## 5. Contraseñas, sesiones y CSRF (E4)

- Contraseñas: `generate_password_hash` y `check_password_hash` para evitar almacenamiento de contraseñas en texto plano.
- Sesiones: `secrets.token_urlsafe(32)` genera un token; en SQLite se guarda el hash SHA-256 del token y no el token original. Caducidad configurada: **1800 segundos**.
- `/logout`: invalida la sesión en el servidor.
- Cookie: `HttpOnly` impide lectura directa por JavaScript, `SameSite=Lax` reduce ciertos riesgos entre sitios y `Secure` debe activarse con HTTPS fuera del entorno local de prueba.
- Modificaciones: requieren comprobación CSRF.

Un hash se utiliza para verificación y no es equivalente a cifrado reversible.

## 6. Dependencias, SQL y archivos (E5)

Las consultas SQL inspeccionadas usan parámetros (`?`) y los errores HTTP no exponen trazas internas del servidor. En la auditoría:

```powershell
python -m pip_audit -r requirements.txt
```

**Resultado observado:** `No known vulnerabilities found`. Versiones documentadas: Flask **3.1.3** y Werkzeug **3.1.9**. El resultado describe las dependencias evaluadas en ese momento y no garantiza ausencia total de riesgos.

Para la descarga de constancias se propuso un endpoint por ID con sesión y autorización del propietario, tomando la ruta del documento desde la base de datos; fue una **propuesta de diseño, no una función implementada**.

## 7. GitHub Actions y trazabilidad (E6)

El reporte original registra el uso de `.github/workflows/security.yml` con `pytest` y `pip-audit` ante `push` y `pull_request`, así como la integración de tres Pull Requests en la rama `main` del repositorio individual:

- Repositorio: `https://github.com/Alanrui78/SecureCampus_SC-LAB-006`.
- PR #1: `https://github.com/Alanrui78/SecureCampus_SC-LAB-006/pull/1`.
- PR #2: `https://github.com/Alanrui78/SecureCampus_SC-LAB-006/pull/2`.
- PR #3: `https://github.com/Alanrui78/SecureCampus_SC-LAB-006/pull/3`.

Esta información proviene del reporte previo; no se ha repetido el pipeline en el proceso de convertirlo a Markdown. Para producción serían recomendables protección de ramas y acciones fijadas a SHA verificables.

## 8. Reflexión y conclusión

**Control más difícil:** la autorización, porque fue necesario comprobar roles y asignaciones reales en la base de datos, no solo la existencia de una sesión. **Pruebas más útiles:** los escenarios negativos que terminaron en 403 y las 15 pruebas aprobadas al finalizar. **Antes de producción:** exigir HTTPS, reforzar la gestión de secretos, ampliar monitoreo y pruebas, revisar dependencias y endurecer la configuración de despliegue.

El laboratorio mostró que una función puede operar y seguir siendo insegura. Las correcciones en validación y autorización se comprobaron mediante pruebas automatizadas y se documentaron con CI/CD. Los resultados son evidencia útil, pero no sustituyen una revisión de seguridad integral.

**Fuente:** reporte personal previo `SC-LAB-006_Alan_Gonzalez_Reporte_Evidencias.pdf` y guía del estudiante; las capturas originales no se reproducen en esta versión Markdown.
