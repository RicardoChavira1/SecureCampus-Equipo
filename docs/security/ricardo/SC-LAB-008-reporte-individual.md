# SC-LAB-008: Seguridad Móvil, Nube y Contenedores
**Estudiante:** Ricardo Lugo Chavira  
**Asignatura:** Desarrollo Seguro (Tema 4: Seguridad Móvil, Nube y Despliegue en Contenedores)  
**Proyecto:** SecureCampus  

---

## 1. Propósito y Entorno de Ejecución
* **Objetivo:** Evaluar los riesgos de almacenamiento en el lado del cliente mediante un simulador conceptual móvil (`/mobile-demo`), verificar que la autorización se aplica estrictamente en el servidor ante solicitudes externas y analizar el endurecimiento (*hardening*) de contenedores con Docker Desktop.
* **Verificación Automatizada (`pytest`):** 22 pruebas aprobadas (`22 passed`), cubriendo las 18 validaciones previas y 4 pruebas nuevas específicas para la seguridad móvil y endurecimiento.

---

## 2. Parte A: Simulador de Seguridad Móvil

### Experiencia 1: Almacenamiento Local (`localStorage`)
* **Guardar e Inspeccionar:** Al pulsar *Guardar marcador ficticio* e *Inspeccionar almacenamiento*, se almacena `DEMO-NO-ES-UN-TOKEN-REAL` en `localStorage`.
* **Persistencia:** Al recargar la página (`Cmd + R`), el dato persiste en el navegador hasta ser borrado manualmente con *Eliminar marcador* (retornando `null`).
* **Implicación de Seguridad:** `localStorage` es accesible mediante cualquier código JavaScript del mismo origen, por lo que nunca debe usarse para guardar contraseñas ni tokens de sesión reales (susceptible a robo vía XSS). Las sesiones auténticas de SecureCampus se resguardan en cookies con la bandera `HttpOnly`.

### Experiencia 2: Autorización desde el Cliente Móvil (`alumna_eli`)
* **Consulta Propia (`3/10`):** Devuelve **HTTP 200 OK** con la calificación de la estudiante autenticada.
* **Consulta Ajena (`4/20`):** Devuelve **HTTP 403 Forbidden** (`Acceso denegado`), ya que la calificación pertenece a otro estudiante.
* **Sin Sesión Activa:** Devuelve **HTTP 401 Unauthorized** (`Autenticación requerida`).
* **Conclusión Operativa:** Ocultar botones o restringir vistas en una aplicación móvil no sustituye la autorización en el servidor; la API valida permisos en cada petición.

### Experiencia 3: Comprobación del Protocolo
* Al verificar la dirección actual se observa el protocolo `http:` en `127.0.0.1:5000`, válido únicamente en entorno local de demostración. En entornos reales o en nube es obligatorio exigir cifrado **HTTPS/TLS** y cookies con bandera `Secure`.

---

## 3. Parte B: Endurecimiento (*Hardening*) en Contenedores Docker

El despliegue local mediante `docker compose up --build -d` ejecuta el servicio `securecampus` sobre `python:3.13-slim` y `gunicorn` en el puerto `127.0.0.1:5000->8000/tcp`, aplicando las siguientes medidas de seguridad definidas en `Dockerfile` y `compose.yaml`:

* **`USER scapp`:** Crea y ejecuta la aplicación con un usuario de sistema sin privilegios de administrador (`root`), limitando el impacto ante una posible ejecución remota de código.
* **`read_only: true` y `tmpfs: /tmp`:** Monta el sistema de archivos raíz del contenedor en modo de solo lectura para impedir modificaciones maliciosas, habilitando únicamente `/tmp` en memoria RAM (`noexec`, `nosuid`, tamaño máximo 32 MB) para los archivos temporales de Gunicorn.
* **`cap_drop: ALL` y `no-new-privileges: true`:** Elimina todas las capacidades privilegiadas del kernel Linux e impide la escalada de privilegios mediante binarios `setuid`.
* **Aislamiento de Red y Persistencia (`/data`):** Publica el puerto exclusivamente en la interfaz local (`127.0.0.1:5000`) y separa la base de datos SQLite en un volumen persistente externo (`securecampus_data:/data`) para evitar filtraciones dentro de la imagen.
* **Advertencia de Entorno (`SC_COOKIE_SECURE=0`):** Configurado en `0` exclusivamente para operar sobre HTTP en `localhost`; en producción debe establecerse en `1` bajo HTTPS/TLS obligatorio.

---

## 4. Registro de Observaciones (Riesgos y Controles)

| Situación Observada | Riesgo | Control Propuesto |
| :--- | :--- | :--- |
| **Marcador en `localStorage`** | Un dato accesible desde JavaScript podría exponerse ante ataques XSS. | Evitar secretos o tokens de sesión en almacenamiento accesible a scripts; usar cookies `HttpOnly`. |
| **Consulta a calificación ajena** | Exposición no autorizada de información académica (IDOR/BOLA). | Validar autorización y pertenencia en el servidor (`HTTP 403`). |
| **HTTP local** | El tráfico viaja en texto claro sin cifrado TLS. | Exigir HTTPS/TLS y bandera `Secure` en entornos reales. |
| **Contenedor con usuario `root`** | Exceso de privilegios y riesgo de compromiso del host. | Ejecutar procesos como usuario no privilegiado (`USER scapp`). |
| **Base de datos dentro de imagen** | Riesgo de pérdida de datos al destruir el contenedor y filtración al compartir la imagen. | Desacoplar la base en un volumen (`/data`) y excluir archivos `.db` de la imagen. |

---

## 5. Conclusiones Propias

1. **Riesgo de almacenamiento en el cliente (`localStorage`):** Se comprobó que los datos guardados en `localStorage` persisten tras recargar la página y son accesibles mediante JavaScript del mismo origen. Por ello, jamás deben almacenarse contraseñas ni tokens de sesión reales en este medio; la autenticación segura exige cookies con las banderas `HttpOnly`, `SameSite` y `Secure`.
2. **La seguridad en clientes móviles depende del servidor:** Ocultar botones o restringir opciones en una aplicación móvil o interfaz web no protege los datos, ya que cualquier usuario puede emitir peticiones HTTP directas. La comprobación de permisos en el backend resultó indispensable para permitir la consulta propia de `alumna_eli` (`HTTP 200` en `3/10`) y bloquear el acceso a calificaciones de terceros (`HTTP 403` en `4/20`).
3. **Endurecimiento (*Hardening*) de contenedores para despliegue en nube:** Ejecutar una aplicación en contenedores requiere aplicar el principio de mínimo privilegio a nivel de infraestructura: eliminar el usuario `root` (`USER scapp`), revocar capacidades del kernel (`cap_drop: ALL`), montar el sistema de archivos en modo solo lectura (`read_only: true`) y aislar la persistencia mediante volúmenes externos.
