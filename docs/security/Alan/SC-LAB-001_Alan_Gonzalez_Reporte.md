# SC-LAB-001 — Identificación inicial de riesgos y controles
**Integrante:** Alan Ramses Gonzalez Ruiz
**Proyecto:** SecureCampus · Desarrollo Seguro

Análisis de cuatro escenarios académicos de SecureCampus conforme al SC-LAB-001. Este registro presenta el razonamiento y los controles propuestos a partir del manual; no afirma una ejecución técnica no documentada.

## 1. Propósito y escenario

SecureCampus administra perfiles, calificaciones, documentos, solicitudes y permisos de estudiantes, profesores y administradores. La meta es distinguir activos, amenazas, vulnerabilidades, ataques, impactos, riesgos y controles.

## 2. Caso guiado: acceso a perfiles

| Elemento | Análisis y justificación |
| --- | --- |
| Activo | Información personal del perfil del estudiante. |
| Amenaza | Consulta indebida por un usuario que tiene sesión iniciada. |
| Vulnerabilidad | La consulta permite acceder a un perfil distinto sin revisar si pertenece al solicitante. |
| Ataque | María cambia /perfil/125 por /perfil/126 y recibe datos de otra persona. |
| Impacto | Divulgación de datos y pérdida de confidencialidad. |
| Riesgo | Acceso horizontal no autorizado mediante cambio de identificador (IDOR/BOLA). |
| Control | Validar en el servidor que el usuario autenticado tenga permiso sobre el perfil solicitado; probar accesos cruzados y registrar rechazos. |

## 3. Matriz inicial de riesgos

| Escenario | Activo | Amenaza | Vulnerabilidad | Ataque | Impacto | Control |
| --- | --- | --- | --- | --- | --- | --- |
| Calificaciones | Calificaciones y expediente | Lectura o alteración no autorizada | Ausencia de autorización por estudiante/grupo | Cambiar ID o enviar actualización ajena | Divulgación o modificación académica | Verificar pertenencia y permisos en servidor; pruebas negativas y auditoría |
| Documentos | Archivos académicos | Descarga de archivos privados | Acceso por ID sin control de propiedad | Solicitar documento de otro usuario | Filtración de información | Comprobar propietario y autorización antes de descargar |
| Autenticación | Cuentas y sesiones | Acceso ilegítimo | Intentos ilimitados y sesiones débiles | Fuerza bruta o reutilización de sesión | Suplantación de identidad | Limitación de intentos; cookies seguras; expiración de sesión |
| Roles y permisos | Privilegios administrativos | Escalamiento de privilegios | Solo se ocultan opciones en la interfaz | Invocar endpoint restringido directamente | Cambios no autorizados en usuarios | RBAC/ReBAC del lado del servidor; mínimo privilegio; logs |

## 4. Justificación de las prioridades

La exposición de calificaciones y documentos afecta información que debe ser confidencial. El primer control debe ser la autorización de cada recurso en el servidor; iniciar sesión no equivale a tener permiso para consultar o modificar cualquier registro. La autenticación reduce suplantaciones, pero no resuelve por sí sola el acceso horizontal indebido.

## 5. Reflexión

| Pregunta | Respuesta |
| --- | --- |
| ¿Amenaza y vulnerabilidad son lo mismo? | No. La amenaza es quien o lo que podría causar daño; la vulnerabilidad es la debilidad que lo permite. Un estudiante curioso es una posible amenaza, y la falta de validación de propiedad es la vulnerabilidad. |
| ¿Puede existir una vulnerabilidad no explotada? | Sí. La ausencia de una comprobación de permisos puede existir aunque nadie haya intentado aprovecharla. |
| ¿Estar autenticado permite acceder a todo? | No. La autenticación identifica a la persona; la autorización define qué recursos y acciones puede utilizar. |
| ¿Qué control definir desde requisitos/diseño? | La autorización por recurso y por rol, porque condiciona el modelo de datos, los endpoints y las pruebas de aceptación. |
| ¿Activo más crítico? | Las calificaciones y sus permisos de modificación, por su impacto académico y la necesidad de conservar integridad y confidencialidad. |

## 6. Conclusión

El análisis revela que proteger SecureCampus no consiste solo en exigir un inicio de sesión. Cada operación debe verificar permisos sobre el recurso concreto y registrar eventos importantes. Los controles propuestos se plantean desde el diseño y deben comprobarse mediante pruebas posteriores.

## Alcance de la evidencia

Contenido elaborado a partir del manual del profesor. No se declaran como ejecutadas pruebas ni acciones de GitHub que no estén verificadas.
