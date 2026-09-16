# SC-LAB-003 · Shift Left Analysis
**Equipo SecureCampus**

Este documento presenta el análisis colaborativo del laboratorio SC-LAB-003, enfocado en el costo de corrección y la aplicación de prácticas Shift Left en el ciclo de desarrollo seguro.

---

## 1. Caso A · Administrador
El requisito inicial permitía consultar calificaciones sin definir condiciones claras.  
Se identificó que **consultar** y **modificar** requieren permisos distintos.

- **Origen del problema:** Requisitos mal definidos.  
- **Descubrimiento:** Pruebas funcionales.  
- **Retrabajo/impacto:** Ajuste de roles, actualización de base de datos y documentación.  
- **Actividad Shift Left:** Definir permisos desde requisitos y modelar roles en diseño.  
- **Control posterior:** Revisiones de acceso y pruebas de autorización continuas.

---

## 2. Caso B · Upload
Se aceptaban archivos de usuarios autenticados sin restricciones de tipo, tamaño ni almacenamiento seguro.

- **Origen del problema:** Requisitos incompletos.  
- **Descubrimiento:** Pruebas de seguridad o explotación en producción.  
- **Retrabajo/impacto:** Reescribir validaciones, modificar almacenamiento y limpiar archivos inseguros.  
- **Actividad Shift Left:** Definir políticas de tipo, tamaño y almacenamiento desde requisitos.  
- **Control posterior:** Escaneo antivirus, validación de metadatos y monitoreo de almacenamiento.

---

## 3. Caso C · Dependencia
Una biblioteca sin vulnerabilidades conocidas al inicio publicó una vulnerabilidad crítica meses después, no detectada por dos meses.

- **Origen del problema:** Gestión insuficiente de dependencias.  
- **Descubrimiento:** Operación continua.  
- **Retrabajo/impacto:** Actualización de librería, pruebas de compatibilidad y despliegue de parches.  
- **Actividad Shift Left:** Inventario de dependencias y alertas automáticas desde el inicio.  
- **Control posterior:** Monitoreo continuo con herramientas SCA y respuesta rápida a vulnerabilidades.

---

## 4. Escalera de costo cualitativa (Caso B · Upload)

| Momento     | ¿Qué habría que corregir/revisar? | Costo/retrabajo |
|-------------|-----------------------------------|-----------------|
| Requisitos  | Definir tipos y tamaños de archivo. | Bajo – solo ajustar documento. |
| Diseño      | Añadir validaciones y almacenamiento seguro. | Medio – modificar arquitectura. |
| Desarrollo  | Reescribir código de subida y validación. | Medio–Alto – afecta varios módulos. |
| Pruebas     | Detectar fallos y rehacer casos de prueba. | Alto – retrabajo en pruebas y desarrollo. |
| Producción  | Limpiar archivos inseguros y desplegar parches. | Muy alto – afecta usuarios y reputación. |

---

## 5. Pregunta con truco conceptual
**¿Puede Shift Left ayudar con una vulnerabilidad que todavía no existía públicamente?**  
Sí. Aunque no se pueda prever la vulnerabilidad específica, se pueden preparar procesos de gestión de dependencias: inventario de librerías, alertas automáticas y planes de actualización. Esto reduce el tiempo de reacción cuando aparece una nueva vulnerabilidad.

---

## 6. Reflexión
- Shift Left no elimina la necesidad de mantener controles de seguridad en operación. Su objetivo es detectar y prevenir problemas lo antes posible durante el desarrollo, reduciendo el retrabajo y el costo de corregir vulnerabilidades. Aun así, el monitoreo, la actualización de dependencias y la respuesta ante nuevas amenazas siguen siendo necesarios cuando el sistema ya está en producción.
- Una funcionalidad puede cumplir requisitos funcionales y seguir siendo insegura si no se definieron criterios de seguridad.  
- La decisión más barata de corregir antes fue separar permisos en el caso del administrador.

---
"# SC-LAB-003 Shift Left Analysis" 
