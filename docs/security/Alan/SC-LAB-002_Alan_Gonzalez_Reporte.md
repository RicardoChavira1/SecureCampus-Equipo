# SC-LAB-002 — Mapa de seguridad a lo largo del Secure SDLC
**Integrante:** Alan Ramses Gonzalez Ruiz
**Proyecto:** SecureCampus · Desarrollo Seguro

Propuesta de controles por fase y por escenario, basada en el manual SC-LAB-002. Es un mapa de diseño, no un registro de despliegues efectivamente ejecutados.

## 1. Objetivo

Vincular riesgos académicos con las seis fases del ciclo de vida: Requisitos, Diseño, Desarrollo, Pruebas, Despliegue y Operación/Mantenimiento, diferenciando controles preventivos, detectivos y correctivos.

## 2. Caso guiado: calificaciones

Que un estudiante pueda cambiar /calificaciones/125 por /calificaciones/126 ilustra una falla de autorización horizontal. La sesión válida no autoriza la consulta de calificaciones ajenas. Se requiere una regla de negocio que compruebe propiedad o relación legítima con el recurso.

## 3. Mapa general por fases

| Fase | Actividad de seguridad | Control / evidencia propuesta |
| --- | --- | --- |
| Requisitos | Identificar datos sensibles, acciones y roles permitidos | Matriz de autorización y criterios de aceptación |
| Diseño | Modelar amenazas y decisiones de acceso | Reglas RBAC/ReBAC y límites de confianza |
| Desarrollo | Implementar controles del lado servidor | Validaciones, consultas parametrizadas y revisión de código |
| Pruebas | Verificar casos permitidos y prohibidos | Pruebas negativas de IDOR, validación y autenticación |
| Despliegue | Configurar mínimos privilegios y secretos | HTTPS, variables de entorno y configuración segura |
| Operación/Mantenimiento | Detectar incidentes y actualizar componentes | Logs, alertas, revisión de dependencias y parches |

## 4. Cuatro escenarios integrados

| Escenario | Requisitos | Diseño | Desarrollo | Pruebas | Despliegue | Operación |
| --- | --- | --- | --- | --- | --- | --- |
| A · Documentos | Solo propietario y autorizados descargan | Autorización por recurso | Comprobar propietario en endpoint | Solicitar documento ajeno: 403 | Almacenamiento restringido | Auditar accesos rechazados |
| B · Token en commit | Prohibir secretos versionados | Gestor de secretos | Usar variables de entorno | Escaneo de secretos en CI | Inyectar secreto seguro | Rotar tokens expuestos |
| C · Profesor | Solo grupos asignados | Relación profesor-grupo | Comprobar relación en servidor | Modificar grupo ajeno: 403 | Privilegios mínimos | Auditar modificaciones |
| D · Login | Proteger ante intentos masivos | Rate limit y bloqueo gradual | Contador y retardo seguro | Simular 100 fallos en 10 min | Configurar límites de tráfico | Alertar patrones de abuso |

## 5. Clasificación conceptual

| Decisión | Concepto | Justificación |
| --- | --- | --- |
| Definir desde requisitos que un profesor solo edite grupos asignados | Security by Design | La autorización se incorpora al modelo y a las reglas del sistema, no se añade al final. |
| Incluir análisis automático de secretos antes de aceptar cambios | Shift Left / Secure SDLC | Se detecta un error potencial antes del despliegue y se integra al proceso de desarrollo. |
| Iniciar permisos restringidos para cuentas nuevas | Security by Default | La configuración inicial reduce privilegios sin depender de ajustes manuales. |

## 6. Reflexión

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué riesgo del 001 requiere más fases? | El acceso indebido a información académica: se define en requisitos, se modela en diseño, se implementa en desarrollo, se prueba, se configura en despliegue y se monitorea en operación. |
| ¿Qué pasaría si esperáramos a pruebas? | Habría que rehacer reglas, endpoints y casos de prueba ya construidos, con más retrabajo y riesgo de omisiones. |
| ¿Qué depende del negocio y qué se automatiza? | La relación estudiante-recurso y profesor-grupo es regla de negocio; su verificación se automatiza con pruebas y controles en CI. |

## 7. Conclusión

Secure SDLC distribuye responsabilidades durante toda la vida del sistema. El control temprano previene errores de diseño, mientras que las pruebas y el monitoreo detectan problemas nuevos o no previstos. Ninguna etapa sustituye a las demás.

## Alcance de la evidencia

Contenido elaborado a partir del manual del profesor. No se declaran como ejecutadas pruebas ni acciones de GitHub que no estén verificadas.
