# SC-LAB-008 — Seguridad móvil y contenedores Docker

**Integrante:** Alan Ramses Gonzalez Ruiz  
**Asignatura / proyecto:** Desarrollo Seguro · SecureCampus  
**Fecha del reporte original:** 16 de noviembre de 2026  
**Modalidad:** simulador móvil web y contenedor local

## 1. Objetivo

Reconocer riesgos de almacenamiento accesible por JavaScript, distinguir autenticación de autorización y HTTP de HTTPS/TLS, y revisar medidas de endurecimiento de la aplicación desplegada en Docker. Se utilizaron solamente cuentas y datos de demostración.

## 2. Pruebas iniciales

Entorno: Windows, VS Code, Python 3.12.10, Flask/GraphQL/SQLite, Edge y Docker Desktop. La ruta del simulador fue `http://127.0.0.1:5000/mobile-demo`.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m pip install -r requirements.txt
python -m pytest -q
python run.py
```

**Resultado observado:** `22 passed in 36.94s`. El servidor Flask y `/mobile-demo` funcionaron correctamente.

## 3. Almacenamiento local

Se guardó en `localStorage` el marcador ficticio `DEMO-NO-ES-UN-TOKEN-REAL`.

| Acción | Resultado |
| --- | --- |
| Guardar marcador | Valor almacenado |
| Recargar e inspeccionar | Persistió el mismo valor |
| Eliminar e inspeccionar | Se obtuvo `null` |

**Interpretación:** JavaScript del mismo origen puede acceder a `localStorage`. Por eso no debe usarse para almacenar contraseñas o secretos de sesión reales. Se empleó únicamente un marcador de prueba.

## 4. Sesión y permisos

| Escenario | Respuesta | Significado |
| --- | --- | --- |
| Solicitud 3/10 sin iniciar sesión | **401** | Autenticación requerida |
| `profe_ana` consulta 3/10 | **200** | Acceso permitido; calificación 85 |
| `profe_ana` consulta 4/20 | **403** | Acceso denegado por permisos |

El simulador utilizó la sesión real mediante cookie `HttpOnly`; la autorización se comprobó en el servidor. Ocultar el botón de consulta no reemplaza la validación de permisos.

## 5. Protocolo de comunicación

El simulador mostró `Protocolo observado: http:` y `Host: 127.0.0.1:5000`. El uso de HTTP sin TLS se limitó a este laboratorio local con datos ficticios. Para un despliegue real se requiere HTTPS/TLS y cookies con `Secure`.

## 6. Contenedor Docker

Después de detener el servidor Flask y verificar Docker Desktop se ejecutó:

```powershell
docker info
docker compose up --build -d
docker compose ps
docker compose logs --tail=50 securecampus
docker compose down
```

Se creó la imagen, red, volumen y contenedor. El estado llegó a **healthy**, con puerto `127.0.0.1:5000` del host dirigido a `8000` del contenedor. Los logs de Gunicorn mostraron un **WORKER TIMEOUT**, seguido por el reinicio del worker; al volver a comprobar, el contenedor continuaba healthy. Finalmente, `docker compose down` eliminó el contenedor y la red, conservando el volumen.

### Endurecimiento identificado

| Ubicación | Control |
| --- | --- |
| `Dockerfile` | `USER scapp` para evitar ejecutarse como root |
| `compose.yaml` | `read_only: true` |
| `compose.yaml` | `tmpfs` con `noexec` y `nosuid` |
| `compose.yaml` | `no-new-privileges:true` y `cap_drop: ALL` |
| `compose.yaml` | `pids_limit: 100` |
| `compose.yaml` | Publicación local `127.0.0.1:5000` y comprobación `healthcheck` |
| `compose.yaml` | `SC_COOKIE_SECURE=0` solamente para demostrar HTTP local |

## 7. Reflexión y conclusión

Una cookie `HttpOnly` no puede leerse directamente desde JavaScript, a diferencia de `localStorage`. Las respuestas 401, 200 y 403 mostraron que iniciar sesión no equivale a tener autorización sobre todos los registros. Docker facilita el aislamiento, pero un contenedor saludable puede experimentar incidencias y tampoco implica que la imagen no tenga vulnerabilidades.

**Conclusión:** se aprobaron 22 pruebas y se completaron las dos rutas de la práctica: simulador móvil y Docker. No se modificó el código original. Este Markdown adapta el reporte previo a la organización personal del repositorio.

**Fuente:** reporte previo `SC-LAB-008_Alan_Gonzalez_Reporte_Evidencias.pdf`; no se reproducen capturas.
