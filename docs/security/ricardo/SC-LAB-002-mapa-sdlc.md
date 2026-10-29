# SC-LAB-002: Mapa de Seguridad a lo largo del SDLC

- **Proyecto:** SecureCampus
- **Curso:** Desarrollo Seguro
- **Fecha:** Septiembre 2026
- **Integrantes del equipo:**
  - Ricardo Lugo Chavira
  - Vanessa Fernanda Colin Gerardo
  - Joana Nataly Gomez Gomez
  - Alan Ramses Gonzalez Ruiz

---

## 1. Pregunta Guía
**¿En qué momento del ciclo de vida debemos actuar para prevenir, detectar o responder?**  
Debemos actuar desde las fases tempranas (Requisitos y Diseño) aplicando Shift Left para prevenir vulnerabilidades de arquitectura y negocio. Posteriormente, se implementa en Desarrollo, se valida en Pruebas y se audita continuamente en Despliegue y Operación para detectar y responder a incidentes.

---

## 2. Actividad Guiada: Calificaciones (Caso IDOR /calificaciones/125 -> /calificaciones/126)

| Fase | ¿Qué debería hacerse? | Control / Evidencia |
| :--- | :--- | :--- |
| **Requisitos** | Definir que un alumno solo puede consultar su propio historial académico. | Requisito no funcional de seguridad (RNF) y caso de mal uso documentado. |
| **Diseño** | Diseñar middleware de autorización que cruce la sesión activa con el recurso pedido. | Diagrama de secuencia con validación de propiedad (`token.id == recurso.id`). |
| **Desarrollo** | Implementar la verificación en el backend antes de consultar la base de datos. | Código de middleware validando sesión y parámetros de ruta. |
| **Pruebas** | Ejecutar pruebas unitarias negativas intentando consultar IDs ajenos. | Suite de pruebas automatizadas con respuesta esperada `HTTP 403 Forbidden`. |
| **Despliegue** | Escaneo estático en CI/CD y verificación de cabeceras seguras en servidor. | Pipeline de CI/CD ejecutando análisis SAST sin fallos de control de acceso. |
| **Operación** | Monitoreo y trazabilidad de peticiones anómalas en endpoints de consulta. | Logs centralizados y alertas por intentos repetidos de acceso a otros registros. |

---

## 3. Reto por Equipo: Matriz de Escenarios

| Escenario | Requisitos | Diseño | Desarrollo | Pruebas | Despliegue | Operación |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **A · Documentos** | Acceso a documentos restringido estrictamente al dueño o admin. | URLs prefirmadas de corta expiración (signed URLs). | Endpoint que valida token firmado antes de descargar archivo. | Pruebas de caja negra forzando URLs directas sin autorización. | Almacenamiento privado sin acceso público a nivel de red. | Alertas por descargas masivas desde una misma IP o cuenta. |
| **B · Token** | Política de cero secretos o llaves dentro del control de versiones. | Configuración de variables de entorno y archivo `.gitignore`. | Pre-commit hooks locales (ej. gitleaks) para bloquear commits. | Análisis de secretos automatizado en pipeline de CI/CD. | Gestor de secretos en servidor inyectando llaves en runtime. | Trazabilidad y rotación inmediata de credenciales comprometidas. |
| **C · Profesor** | Regla de negocio: captura restringida a grupos asignados formalmente. | Modelo de datos relacional ligando docente, grupo y materia. | Middleware RBAC en `POST/PUT /calificaciones` validando asignación. | Pruebas unitarias alterando parámetros para calificar grupos ajenos. | Verificación de esquemas de BD y políticas de integridad referencial. | Registro de auditoría con fecha, hora y profesor en cada captura. |
| **D · Login** | Límite de intentos fallidos y reglas de bloqueo de cuentas. | Diseño de Rate Limiting por IP/usuario y soporte de Captcha. | Middleware de rate limit y retardos progresivos en `/login`. | Pruebas de fuerza bruta simuladas para verificar corte de peticiones. | Configuración de reglas WAF contra ataques volumétricos. | Monitoreo en tiempo real y alertas ante ráfagas de autenticación fallida. |

---

## 4. Clasificación Conceptual

1. **Hook de pre-commit y `.gitignore` (Escenario B):** Representa el concepto **Shift Left**, ya que traslada el control de seguridad al punto más inicial posible (la computadora del desarrollador), impidiendo que las credenciales se incorporen al repositorio.
2. **URLs prefirmadas para descargas (Escenario A):** Representa el concepto **Security by Design**, ya que se diseña un mecanismo seguro con expiración temporal desde la arquitectura en vez de depender de parches posteriores.

---

## 5. Reflexión

1. **¿Qué riesgo necesitó controles en más fases?**  
   El control de acceso a calificaciones y documentos (IDOR/BOLA), ya que requiere definición funcional, arquitectura de autorización, codificación defensiva, pruebas negativas y bitácoras de auditoría en producción.
2. **¿Qué habría ocurrido si el equipo hubiera esperado hasta pruebas?**  
   Si el equipo hubiera esperado hasta la fase de pruebas, las vulnerabilidades ya podrían estar presentes en el diseño y en el código del sistema. Corregirlas en ese momento implicaría modificar componentes ya desarrollados, repetir pruebas y posiblemente rediseñar controles de acceso. Por eso es más conveniente integrar la seguridad desde requisitos y diseño, y mantenerla durante las demás fases del SDLC.
3. **¿Qué control depende de una regla de negocio y cuál puede automatizarse?**  
   - *Regla de negocio:* La asignación y validación de que un profesor solo capture calificaciones en su grupo (Escenario C).
   - *Automatizable:* El bloqueo de peticiones por fuerza bruta (Rate Limiting) y la detección de tokens mediante herramientas SAST y pre-commit hooks (Escenario B y D).
