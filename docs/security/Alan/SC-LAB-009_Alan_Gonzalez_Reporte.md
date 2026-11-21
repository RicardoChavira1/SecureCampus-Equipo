# SC-LAB-009 — DevSecOps y despliegue seguro de SecureCampus

**Integrante:** Alan Ramses Gonzalez Ruiz  
**Proyecto:** SecureCampus · Desarrollo Seguro · Tema 3.5  
**Fecha de elaboración del registro:** 20 de noviembre de 2026  
**Tipo:** registro de controles, reflexión y conclusión conforme a `docs/EVIDENCIAS_PLANTILLA.md`

## 1. Controles y resultados

| Control | Comando / archivo | Resultado real | Interpretación |
| --- | --- | --- | --- |
| Pruebas | `python -m pytest -q` | **22 passed in 21.48s** | Los escenarios automatizados existentes aprobaron |
| SAST | `python -m bandit -r src -ll -ii` | **No issues identified**; 171 líneas analizadas | Sin hallazgos de severidad y confianza incluidas por el filtro aplicado |
| Dependencias | `python -m pip_audit -r requirements.txt` | **No known vulnerabilities found** | No se reportaron vulnerabilidades conocidas en las dependencias analizadas en ese momento |
| CI en GitHub | `.github/workflows/security.yml` | **Revisado localmente, no ejecutado en GitHub** | Se identificaron disparadores y jobs del pipeline |
| Imagen y Trivy | `docker build -t securecampus:lab009 .`; `docker images` | **Docker construido; Trivy no ejecutado** | `12/12 FINISHED`; imagen `securecampus:lab009` listada con tamaño de disco de 190 MB |

## 2. Lectura del pipeline

El archivo `.github/workflows/security.yml` permite ejecuciones con `push`, `pull_request` y `workflow_dispatch`.

**Trabajo `security`:** descarga repositorio → prepara Python 3.12 → instala dependencias → ejecuta `pytest` → ejecuta Bandit → ejecuta `pip-audit`.

**Trabajo `container`:** descarga repositorio → construye la imagen con `docker build -t securecampus:lab009 .` → utiliza Trivy con `vuln-type: 'os,library'`, severidades `HIGH,CRITICAL` y `exit-code: '1'` para fallar ante hallazgos correspondientes. `ignore-unfixed: true` excluye hallazgos sin corrección disponible en ese análisis.

La ruta GitHub Actions fue **opcional** y no se ejecutó remotamente. La construcción local con Docker tampoco demuestra por sí sola ausencia de vulnerabilidades; **no hay resultado real de escaneo Trivy** en esta práctica.

## 3. Reflexión (preguntas de la plantilla)

**1. ¿Qué control impide integrar un cambio con pruebas fallidas?**  
Las pruebas automatizadas, si GitHub Actions y las reglas de protección de ramas están configuradas para exigir su aprobación antes de integrar. Si `pytest` falla, debe revisarse el cambio.

**2. ¿En qué se diferencia SAST de auditar dependencias?**  
Bandit analiza patrones potencialmente inseguros en nuestro propio código; `pip-audit` consulta vulnerabilidades conocidas de bibliotecas de terceros. Ambos controles se complementan.

**3. ¿Por qué un pipeline en verde no garantiza seguridad absoluta?**  
Porque las pruebas y analizadores solo cubren determinados escenarios y reglas; pueden quedar fallas de lógica, configuración, autorización o vulnerabilidades que aún no se conocen.

**4. ¿Qué harías al detectar una vulnerabilidad crítica en una imagen?**  
Detener la publicación, identificar el componente afectado, actualizarlo o mitigarlo, reconstruir la imagen y repetir el escaneo y las pruebas antes de desplegar.

## 4. Conclusión del equipo (8 líneas)

En este laboratorio aplicamos controles de DevSecOps al proyecto SecureCampus.  
Las pruebas automatizadas terminaron con 22 casos aprobados.  
Bandit no reportó problemas en el análisis realizado al código fuente.  
`pip-audit` tampoco detectó vulnerabilidades conocidas en las dependencias revisadas.  
Revisamos cómo GitHub Actions organiza estos controles en un pipeline.  
Además, construimos localmente la imagen Docker y verificamos que se creó.  
No ejecutamos el pipeline remoto ni el escaneo Trivy, porque corresponden a la ruta opcional.  
Concluimos que combinar varias herramientas mejora la revisión, aunque no garantiza seguridad total.

## 5. Evidencias disponibles

En la práctica se conservaron capturas de `pytest`, Bandit, `pip-audit`, tres vistas del YAML `security.yml` y el comando `docker images` con la imagen construida. **Esta edición Markdown registra sus resultados, sin incrustar imágenes**, conforme a la decisión de documentar las prácticas en texto.

**Fuente:** guía SC-LAB-009, plantilla `docs/EVIDENCIAS_PLANTILLA.md` y registro personal `SC-LAB-009_Registro_de_Evidencias_Completado`.
