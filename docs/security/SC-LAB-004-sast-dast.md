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

## 1. Pregunta guía
**¿Qué puede descubrir una herramienta al analizar el código fuente y qué puede descubrir al interactuar con una aplicación en ejecución?**  
El análisis estático (SAST) descubre debilidades estructurales internas como consultas SQL concatenadas, funciones deprecadas, falta de sanitización y secretos expuestos sin requerir el despliegue del sistema. La interacción en ejecución (DAST) descubre fallos observables en tiempo real desde el exterior, como Cross-Site Scripting (XSS) reflejado, cabeceras HTTP de seguridad ausentes y respuestas indebidas del servidor frente a peticiones anómalas.

---

## 2. Parte A · SAST con Semgrep (app.py)

### 2.1 Análisis humano inicial
- **Dato de entrada:** Variable `nombre` capturada desde consola mediante `input()`.
- **Destino del flujo:** Pasa directamente como parámetro a la función `buscar_estudiante()` concatenándose en la cadena SQL.
- **Riesgo identificado:** Inyección SQL (CWE-89) debido a la concatenación directa de cadenas sin parametrización.
- **Control preventivo propuesto:** Implementar consultas preparadas/parametrizadas mediante marcadores de posición `?` en el motor SQLite.

### 2.2 Ejecución formal de Semgrep
```bash
docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config auto /src/src