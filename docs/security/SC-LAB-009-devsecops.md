# SC-LAB-009: DevSecOps y Despliegue Seguro de SecureCampus
**Estudiante:** Ricardo Lugo Chavira  
**Asignatura:** Desarrollo Seguro (Tema 3.5: Prácticas DevSecOps y despliegue seguro)  
**Proyecto:** SecureCampus  

---

## 1. Propósito y Controles Ejecutados
* **Objetivo:** Integrar pruebas automatizadas y análisis de seguridad dentro del ciclo de desarrollo de SecureCampus mediante `pytest`, análisis estático (`Bandit`), auditoría de dependencias (`pip-audit`), revisión del flujo CI/CD en GitHub Actions (`security.yml`) y construcción de imagen en Docker.
* **Evidencia A — Pruebas Automatizadas (`pytest`):** Ejecución local exitosa (`python -m pytest -q`) validando las reglas de control de acceso, validación de entradas y endpoints REST/GraphQL.
* **Evidencia B — Análisis Estático SAST (`Bandit`):** Escaneo sobre `src/` (`python -m bandit -r src -ll -ii`) analizando 171 líneas de código con `0` hallazgos de severidad media o alta (`Medium: 0`, `High: 0`).
* **Evidencia C — Auditoría de Dependencias SCA (`pip-audit`):** Verificación de `requirements.txt` (`python -m pip_audit -r requirements.txt`) confirmando `No known vulnerabilities found` en `Flask`, `Werkzeug` y `graphql-core`.
* **Evidencia D — Pipeline CI/CD (`.github/workflows/security.yml`):** Revisión del flujo automatizado configurado para ejecutarse ante `push`, `pull_request` y `workflow_dispatch` en `ubuntu-latest`, encadenando los trabajos `security` (`pytest`, `Bandit`, `pip-audit`) y `container` (construcción Docker y escaneo con Trivy).
* **Evidencia E — Construcción de Imagen Docker:** Construcción exitosa de `securecampus:lab009` (`docker build -t securecampus:lab009 .`) aplicando usuario sin privilegios (`USER scapp`), sistema de archivos de solo lectura y aislamiento de puertos/volúmenes.

---

## 2. Preguntas para Reflexionar

1. **¿Qué diferencia existe entre ejecutar las pruebas en tu computadora y ejecutarlas en GitHub Actions?**
   Cuando se ejecutan de forma local hay que correrlas manualmente, se pueden olvidar y el entorno propio de la máquina ya tiene configuraciones previas que podrían disfrazar algún fallo. En GitHub Actions se ejecutan automáticamente cada vez que alguien sube cambios al repositorio y en un entorno limpio desde cero (`ubuntu-latest`), asegurando que todo funcione igual para todo el equipo y deteniendo cambios inseguros antes de integrarlos.

2. **¿Por qué es útil analizar tanto el código propio como las dependencias?**
   Porque aunque nuestro código en `src/` esté bien programado y salga limpio en Bandit, el proyecto depende de librerías externas como `Flask`, `Werkzeug` o `graphql-core` que no escribimos nosotros. Si alguna de esas librerías tiene una vulnerabilidad pública conocida, un atacante podría aprovecharla igual, por lo que auditar dependencias con `pip-audit` permite detectarlas y actualizarlas a tiempo.

3. **¿Por qué una imagen Docker que se construye correctamente puede contener vulnerabilidades?**
   Que `docker build` termine sin errores solo indica que las instrucciones del `Dockerfile` son sintácticamente válidas y que los paquetes se instalaron bien. Sin embargo, la imagen base (`python:3.13-slim`) o las bibliotecas del sistema operativo incluidas dentro pueden contener fallos de seguridad conocidos que solo un escáner de imágenes como Trivy puede detectar.

4. **¿Qué haría tu equipo ante un aviso crítico antes de publicar una aplicación?**
   Frenaríamos inmediatamente la publicación para no exponer el sistema con ese fallo, revisaríamos el reporte para identificar qué archivo o dependencia genera la alerta, aplicaríamos el parche o actualización necesaria y volveríamos a correr toda la suite de controles (`pytest`, Bandit, `pip-audit` y Trivy) para comprobar que el problema quedó resuelto sin romper funcionalidades antes de liberar.

---

## 3. Reflexión Final
Con esta práctica quedó claro cómo se automatiza la seguridad dentro de un proyecto real sin depender únicamente de revisiones manuales. Cada herramienta cubre una capa distinta: `pytest` comprueba que los permisos y funciones respondan correctamente, `Bandit` busca patrones inseguros en nuestro código Python, `pip-audit` revisa que las librerías externas estén libres de vulnerabilidades conocidas y `Trivy` audita la imagen de contenedor antes de desplegar. Comprender el flujo en GitHub Actions (`security.yml`) demuestra cómo los pipelines de integración continua funcionan como una barrera preventiva objetiva ante cada cambio del equipo, aunque obtener una ejecución en verde siempre debe complementarse con criterio humano y buenas configuraciones de endurecimiento.
