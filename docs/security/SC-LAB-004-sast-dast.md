# SC-LAB-004: Análisis de Seguridad Estático y Dinámico (SAST + DAST)

- **Proyecto:** SecureCampus Security Lab
- **Curso:** Desarrollo Seguro
- **Fecha:** Septiembre 2026
- **Integrantes del equipo:**
  - Ricardo Lugo Chavira
  - Vanessa Fernanda Colin Gerardo
  - Joana Nataly Gomez Gomez
  - Alan Ramses Gonzalez Ruiz

---

## Objetivo

Analizar una miniaplicación vulnerable utilizando técnicas SAST y DAST para identificar vulnerabilidades, corregirlas y validar las correcciones mediante reanálisis.

---

# Entorno

- Windows
- PowerShell
- VS Code
- Python 3.14.7
- Flask 3.1.3
- Docker Desktop
- Semgrep Community
- OWASP ZAP

---

# Parte A - SAST con Semgrep

## Análisis humano previo

### ¿Qué dato controla el usuario?

El usuario controla el parámetro `nombre`.

### ¿A dónde llega ese dato?

Llega a una consulta SQL y posteriormente al resultado mostrado por la aplicación.

### ¿Qué riesgo observas?

Existe riesgo de SQL Injection debido a la concatenación directa de la entrada del usuario dentro de una consulta SQL.

### ¿Qué control propondrías?

Utilizar consultas parametrizadas para evitar la manipulación de la consulta SQL.

---

## Ejecución de Semgrep

### Comando utilizado

```powershell
docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config auto /src/src
```

### Hallazgo principal

**Regla/Hallazgo**

```text
python.sqlalchemy.security.sqlalchemy-execute-raw-query.sqlalchemy-execute-raw-query
```

**Archivo/Línea**

```text
src/app.py
cursor.execute(consulta)
```

### Evidencia aportada

Semgrep detectó una consulta SQL construida mediante concatenación de información controlada por el usuario, identificando un posible escenario de SQL Injection.

### ¿Coincide con el análisis humano?

Sí. El análisis manual identificó que la variable `nombre` era concatenada directamente dentro de la consulta SQL.

---

## Corrección aplicada

Código vulnerable:

```python
consulta = (
    "SELECT id, nombre, correo "
    "FROM estudiantes "
    "WHERE nombre = '" + nombre + "'"
)

cursor.execute(consulta)
```

Código corregido:

```python
consulta = (
    "SELECT id, nombre, correo "
    "FROM estudiantes "
    "WHERE nombre = ?"
)

cursor.execute(consulta, (nombre,))
```

---

## Reanálisis

Después de sustituir la concatenación por una consulta parametrizada, el riesgo de SQL Injection quedó mitigado.

Un resultado sin hallazgos no garantiza que la aplicación sea completamente segura, únicamente indica que las reglas ejecutadas no detectaron problemas en ese momento.

---

# Parte B - DAST con OWASP ZAP

## Inicio de la aplicación

Comando ejecutado:

```powershell
python src\webapp.py
```

Verificación desde Docker:

```powershell
docker run --rm curlimages/curl http://host.docker.internal:5000
```

El contenedor pudo acceder correctamente a la aplicación.

---

## Baseline Scan

Comando utilizado:

```powershell
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:5000
```

### Hallazgos observados

| Hallazgo | Observación | Requiere análisis |
|-----------|-----------|-----------|
| Missing Anti-clickjacking Header | Falta cabecera de protección | Sí |
| X-Content-Type-Options Header Missing | Falta cabecera HTTP | Sí |
| CSP Header Not Set | No existe política CSP | Sí |

---

## Active Scan

Comando utilizado:

```powershell
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://host.docker.internal:5000
```

### Hallazgo principal

Cross Site Scripting (Reflected) [40012]

---

# Validación manual de XSS

## Entrada utilizada

```html
<script>alert(1)</script>
```

## Resultado esperado vulnerable

La entrada debería ser interpretada y ejecutada por el navegador.

---

# Corrección del XSS

Código vulnerable:

```python
return f"""
<p>Estudiante buscado: {nombre}</p>
"""
```

Código corregido:

```python
template_resultado = """
<p>Estudiante buscado: {{ nombre }}</p>
"""

return render_template_string(
    template_resultado,
    nombre=nombre
)
```

Flask aplica escaping automático al utilizar variables dentro de la plantilla.

---

# Retesting

## Prueba normal

Entrada:

```text
María
```

Resultado:

La búsqueda continuó funcionando correctamente.

## Prueba XSS

Entrada:

```html
<script>alert(1)</script>
```

Resultado:

La cadena se mostró como texto y no se ejecutó código JavaScript.

La vulnerabilidad XSS reflejada quedó mitigada.

---

# Comparación SAST vs DAST

| Criterio | SAST | DAST |
|-----------|-----------|-----------|
| Objeto de análisis | Código fuente | Aplicación en ejecución |
| Requiere ejecutar la aplicación | No | Sí |
| Perspectiva | Interna | Externa |
| Evidencia obtenida | SQL Injection | XSS y configuración HTTP |
| Fortaleza | Detecta problemas en el código | Detecta comportamiento observable |
| Limitación | No observa ejecución real | No analiza todo el código |

---

# Reflexión

## 1. ¿Por qué 0 findings en SAST no equivale a aplicación segura?

Porque las reglas ejecutadas pueden no detectar todas las vulnerabilidades existentes y podrían existir problemas de lógica de negocio, configuración o autorización.

## 2. ¿Por qué un WARN de ZAP debe validarse antes de declararlo vulnerabilidad?

Porque algunas advertencias requieren contexto adicional y podrían no representar una vulnerabilidad real.

## 3. ¿Qué diferencia observaste entre baseline y active scan?

El baseline realiza observación pasiva mientras que el active scan interactúa activamente con la aplicación buscando vulnerabilidades.

## 4. ¿Por qué 200 OK no descarta una vulnerabilidad

Porque el código HTTP 200 OK únicamente indica que el servidor procesó la solicitud correctamente y envió una respuesta. Sin embargo, la respuesta puede seguir conteniendo comportamientos inseguros o vulnerabilidades, como XSS, divulgación de información o fallos de autorización. Una aplicación puede funcionar correctamente y seguir siendo vulnerable.
