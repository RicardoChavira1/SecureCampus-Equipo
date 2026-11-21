# SC-LAB-007 — Explorador visual de APIs REST y GraphQL

**Integrante:** Alan Ramses Gonzalez Ruiz  
**Asignatura / proyecto:** Desarrollo Seguro · SecureCampus  
**Fecha del reporte original:** 16 de noviembre de 2026  
**Modalidad:** práctica local guiada con cuentas ficticias

## 1. Propósito

Explorar las operaciones REST y GraphQL de SecureCampus y comparar la autenticación, autorización por recurso y validación de calificaciones, sin modificar el código original proporcionado.

## 2. Preparación y pruebas

Se trabajó con Windows, VS Code, PowerShell, Python 3.12.10, Flask y SQLite. La aplicación se ejecutó en `http://127.0.0.1:5000`.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pytest -q
python run.py
```

**Resultado real:** `18 passed`. La interfaz educativa y las opciones REST/GraphQL funcionaron en el navegador.

## 3. API REST

| Comprobación | Resultado | Interpretación |
| --- | --- | --- |
| `GET` de estudiante 3, grupo 10 con `profe_ana` | **200** | Consulta permitida |
| `PUT` de calificación `150` con `profe_ana` | **400** | Valor inválido |
| `GET` o `PUT` sin sesión | **401** | Autenticación necesaria |
| `profe_ana` intenta acceder al grupo 20 | **403** | Permisos insuficientes |
| `alumna_eli` intenta modificar una nota | **403** | Estudiante sin permiso de escritura |

Durante los retos guiados también se practicaron actualizaciones autorizadas con cuentas de demostración. La autorización se valida en el servidor, no solo por botones visibles.

## 4. Autenticación frente a autorización

El servidor diferencia una solicitud sin sesión (401) de otra con sesión válida pero acceso indebido (403). En el proyecto se identificó además el uso de cookie `HttpOnly` para la sesión y token CSRF para solicitudes que modifican datos.

| Escenario | Resultado |
| --- | --- |
| `profe_ana` consulta 3/10 | 200 |
| `profe_ana` consulta 4/20 | 403 |
| `alumna_eli` consulta su propia calificación 3/10 | 200 |
| `alumna_eli` consulta una calificación ajena | 403 |
| `alumna_eli` intenta `PUT` | 403 |

## 5. API GraphQL

La consulta de ejemplo fue:

```graphql
query {
  grade(studentId: 3, groupId: 10) {
    studentId
    groupId
    grade
  }
}
```

La operación autorizada devolvió **HTTP 200**; la consulta a un recurso ajeno devolvió **403** y una consulta sin sesión **401**. En este laboratorio GraphQL se utilizó para lectura y REST para consultas y modificaciones.

## 6. Retos A–E

| Reto | Actividad principal | Resultado |
| --- | --- | --- |
| A | `profe_ana` consulta grupo propio y grupo ajeno | Permitido / 403 |
| B | `alumna_eli` consulta su calificación y otra ajena | Permitido / 403 |
| C | Estudiante intenta modificar una calificación | 403 |
| D | Profesor intenta establecer 150 | 400 |
| E | Comparación de consulta REST frente a GraphQL | Coincidencia de datos autorizados |

Los cinco retos se completaron en la interfaz del laboratorio.

## 7. Reflexión y cierre

REST organiza operaciones mediante rutas y métodos HTTP como `GET` y `PUT`; GraphQL permite seleccionar los campos dentro de una consulta. Ambos deben aplicar controles de autenticación y autorización del lado del servidor. Las respuestas 200, 400, 401 y 403 permitieron diferenciar éxito, entrada inválida, falta de sesión y ausencia de permiso.

**Conclusión:** se aprobaron las 18 pruebas automatizadas y se completó la exploración guiada sin modificar el código original. Este Markdown resume el reporte académico adicional: el README no exigía expresamente un informe separado.

**Fuente:** reporte previo `SC-LAB-007_Alan_Gonzalez_Reporte_Evidencias.pdf`; no se reproducen capturas.
