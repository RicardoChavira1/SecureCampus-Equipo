# SC-LAB-003 — Costo de corrección y Shift Left
**Integrante:** Alan Ramses Gonzalez Ruiz
**Proyecto:** SecureCampus · Desarrollo Seguro

Análisis cualitativo de retrabajo y actividades tempranas de seguridad conforme al manual SC-LAB-003. No se asignan multiplicadores universales ni costos monetarios inventados.

## 1. Objetivo

Mostrar cómo una omisión de seguridad puede requerir más cambios si se detecta tarde, y proponer actividades Shift Left junto con controles continuos durante la operación.

## 2. Caso guiado: recuperación de contraseña

| Pregunta | Análisis |
| --- | --- |
| ¿Dónde se originó la omisión? | En requisitos: RF-010 solo exige recuperar contraseña, pero no define caducidad segura ni uso único del enlace. |
| ¿Dónde podría descubrirse? | En revisión temprana de requisitos, modelado de amenazas, pruebas de seguridad o tras un incidente. |
| ¿Qué cambiar si se encuentra en pruebas? | Criterios de aceptación, generación y almacenamiento del token, endpoint de validación, pruebas y documentación. |
| ¿Qué requisitos faltaron? | Enlaces de vida corta, un solo uso, invalidación tras cambio, almacenamiento protegido y límites de solicitudes. |
| ¿Qué mover a la izquierda? | Revisar historias de usuario con checklist de autenticación y diseñar casos negativos antes de programar. |

## 3. Reto integral

| Caso | Origen | Descubrimiento | Retrabajo / impacto | Shift Left | Control posterior |
| --- | --- | --- | --- | --- | --- |
| A · Administrador | Permisos ambiguos en requisito | Revisión o pruebas tardías | Cambiar matriz, API y pruebas de consultar vs modificar | Matriz de acciones por rol al diseñar | Logs y revisión periódica de permisos |
| B · Upload | Sin límites ni almacenamiento seguro | Pruebas de archivos maliciosos | Cambiar validaciones, servicio de archivos e infraestructura | Criterios de tipo, tamaño y ruta desde requisitos | Escaneo de archivos, alertas y parches |
| C · Dependencia | Dependencia correcta al inicio; nueva vulnerabilidad publicada después | Aviso de seguridad ocho meses más tarde y revisión retrasada dos meses | Evaluar exposición, actualizar biblioteca, probar regresiones y desplegar | Inventario, política de actualizaciones y SCA en CI | Monitoreo de avisos y respuesta a vulnerabilidades |

## 4. Escalera cualitativa de costo: enlace de recuperación

| Momento | Correcciones necesarias | Retrabajo cualitativo |
| --- | --- | --- |
| Requisitos | Definir token de un uso y caducidad apropiada | Bajo: se ajusta el texto y criterios |
| Diseño | Modificar esquema de token, estados y flujo | Bajo-medio: se revisan decisiones técnicas |
| Desarrollo | Cambiar código, modelos y pruebas unitarias | Medio: ya hay implementación que rehacer |
| Pruebas | Corregir requisito, diseño, implementación y pruebas | Alto: más artefactos afectados |
| Producción | Corregir y desplegar; invalidar enlaces vigentes y evaluar incidentes | Alto: además de retrabajo, hay exposición real y coordinación operativa |

## 5. Pregunta conceptual: dependencia nueva

Sí, Shift Left puede preparar al equipo incluso antes de que exista una vulnerabilidad pública: seleccionar dependencias mantenidas, inventariarlas (SBOM), establecer revisión de versiones, análisis SCA en CI y planes de actualización. Pero no sustituye la vigilancia y respuesta durante operación: una CVE futura no puede detectarse como conocida en el pasado.

## 6. Reflexión

| Pregunta | Respuesta |
| --- | --- |
| ¿Shift Left elimina seguridad en operación? | No. Los incidentes, cambios del entorno y vulnerabilidades nuevas requieren monitoreo, parches y respuesta continua. |
| ¿Una función puede cumplir el requisito y ser insegura? | Sí. Un enlace de recuperación puede funcionar y aun así permanecer válido durante siete días y aceptar múltiples usos. |
| ¿Qué decisión era más barata de corregir temprano? | Definir el uso único y tiempo de expiración del enlace en los requisitos, antes de implementar y probar el flujo. |

## 7. Conclusión

Shift Left significa tomar decisiones y ejecutar comprobaciones de seguridad antes, no concentrarlas exclusivamente en el inicio. Descubrir un problema tarde suele ampliar los componentes afectados, aunque el costo depende del contexto. La seguridad también se mantiene después del despliegue.

## Alcance de la evidencia

Contenido elaborado a partir del manual del profesor. No se declaran como ejecutadas pruebas ni acciones de GitHub que no estén verificadas.
