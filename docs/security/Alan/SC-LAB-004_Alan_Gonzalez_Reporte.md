# SC-LAB-004 — Análisis SAST + DAST

## Integrante

Alan Ramses Gonzalez Ruiz

## Objetivo

Aplicar técnicas de análisis estático y dinámico de seguridad sobre los módulos asignados del proyecto SecureCampus, utilizando Semgrep para SAST y OWASP ZAP para DAST.

El propósito fue identificar posibles vulnerabilidades y configuraciones inseguras, aplicar las correcciones correspondientes y repetir los análisis para comprobar los cambios realizados.

---

## Alcance asignado

El análisis se realizó sobre los siguientes módulos:

- `app/admin/auditoria/`
- `app/admin/dashboard/`
- `app/components/`
- `app/layout.tsx`
- `app/page.tsx`

El enfoque principal fue la protección de rutas administrativas y la seguridad perimetral de la aplicación.

---

## Entorno utilizado

Para realizar la práctica se utilizó:

- Windows
- PowerShell
- Docker Desktop
- Node.js
- npm
- Next.js
- TypeScript
- Firebase
- Semgrep Community
- OWASP ZAP
- Git
- GitHub

La aplicación analizada fue SecureCampus y el proyecto Next.js se encuentra dentro del directorio:

`securecmpus`

---

# 1. Verificación previa del proyecto

Antes de realizar las pruebas de seguridad se verificó la compilación de TypeScript mediante:

`npx tsc --noEmit`

Inicialmente se encontró un error en:

`app/layout.tsx`

El componente `Header` estaba siendo utilizado con propiedades que ya no existían:

`<Header rolActivo="ADMIN" nombreUsuario="Ricardo (Dev)" />`

La llamada fue corregida a:

`<Header />`

Después del cambio se volvió a ejecutar:

`npx tsc --noEmit`

El comando terminó sin reportar errores.

La corrección fue registrada en Git mediante el commit:

`fix: corregir uso del Header en layout`

---

# 2. Análisis humano previo

Antes de ejecutar las herramientas automáticas se revisaron los archivos correspondientes al alcance asignado.

En los módulos administrativos se observó que el acceso depende de la autenticación mediante Firebase y de la comprobación del rol del usuario.

Las páginas administrativas verifican al usuario autenticado y posteriormente consultan su información para comprobar que tenga el rol `ADMIN`.

También se revisaron componentes globales como `Header`, `layout.tsx` y `page.tsx`.

Estas validaciones ayudan a limitar el acceso desde la interfaz, pero la seguridad de los datos también depende de las reglas de acceso configuradas en Firebase y de que la autorización sea validada correctamente en cada operación.

Por esta razón, un análisis automático sin hallazgos no es suficiente para afirmar que no existen problemas de autorización o lógica de negocio.

---

# 3. Análisis SAST con Semgrep

Se utilizó Semgrep Community mediante Docker para realizar el análisis estático de los archivos asignados.

## Archivos analizados

- `app/layout.tsx`
- `app/page.tsx`
- `app/components/Header.tsx`
- `app/components/Footer.tsx`
- `app/admin/auditoria/page.tsx`
- `app/admin/dashboard/page.tsx`

## Procedimiento

Inicialmente se intentó analizar varias rutas al mismo tiempo, pero el proceso permaneció ejecutándose durante demasiado tiempo.

Por esta razón se realizó el análisis archivo por archivo.

Ejemplo del comando utilizado:

`docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config auto /src/securecmpus/app/layout.tsx`

El mismo procedimiento se repitió para los demás archivos asignados.

## Resultados

- `app/layout.tsx`: 0 findings
- `app/page.tsx`: 0 findings
- `app/components/Header.tsx`: 0 findings
- `app/components/Footer.tsx`: 0 findings
- `app/admin/auditoria/page.tsx`: 0 findings
- `app/admin/dashboard/page.tsx`: 0 findings

Semgrep ejecutó 210 reglas aplicables de TypeScript/TSX por archivo.

## Interpretación

Semgrep no detectó patrones inseguros mediante las reglas ejecutadas.

Sin embargo, obtener 0 findings no significa que la aplicación sea completamente segura, ya que SAST puede no detectar problemas relacionados con:

- configuración;
- autorización;
- lógica de negocio;
- reglas de acceso;
- comportamiento en tiempo de ejecución.

Por esta razón se complementó el análisis mediante DAST.

---

# 4. Preparación para DAST

La aplicación SecureCampus se ejecutó localmente mediante:

`npm run dev`

La aplicación quedó disponible en:

`http://localhost:3000`

Posteriormente se verificó que Docker pudiera comunicarse correctamente con la aplicación mediante:

`docker run --rm curlimages/curl http://host.docker.internal:3000`

La respuesta obtenida contenía correctamente el HTML de SecureCampus.

Esto confirmó que OWASP ZAP podía acceder a la aplicación desde Docker.

---

# 5. Baseline DAST inicial con OWASP ZAP

Se ejecutó un Baseline Scan mediante:

`docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3000`

## Resultado inicial

- `FAIL-NEW: 0`
- `WARN-NEW: 11`
- `PASS: 56`

## Advertencias detectadas

OWASP ZAP reportó:

- Missing Anti-clickjacking Header
- X-Content-Type-Options Header Missing
- Information Disclosure - Sensitive Information in URL
- Information Disclosure - Suspicious Comments
- Server Leaks Information via X-Powered-By
- Content Security Policy Header Not Set
- Storable but Non-Cacheable Content
- Permissions Policy Header Not Set
- Timestamp Disclosure - Unix
- Dangerous JS Functions
- Cross-Origin-Embedder-Policy Header Missing or Invalid

---

# 6. Validación de los hallazgos

Los resultados de OWASP ZAP fueron revisados antes de considerarlos vulnerabilidades reales.

Dentro del alcance asignado se consideraron especialmente relevantes los siguientes hallazgos:

- Missing Anti-clickjacking Header
- X-Content-Type-Options Header Missing
- Server Leaks Information via X-Powered-By
- Content Security Policy Header Not Set
- Permissions Policy Header Not Set
- Cross-Origin-Embedder-Policy Header Missing or Invalid

Estos hallazgos estaban directamente relacionados con la configuración HTTP y la seguridad perimetral de la aplicación.

Otros warnings requerían interpretación adicional porque correspondían a módulos distintos o a archivos generados por Next.js y sus dependencias.

---

# 7. Correcciones aplicadas

Para corregir los principales hallazgos se modificó:

`securecmpus/next.config.ts`

Se agregaron encabezados HTTP de seguridad aplicables globalmente.

## Controles agregados

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`
- `Content-Security-Policy`

También se configuró:

`poweredByHeader: false`

Esto evita que Next.js exponga el encabezado:

`X-Powered-By`

Dentro de Content Security Policy se agregaron, entre otras, las siguientes directivas:

- `default-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'none'`

También fue necesario permitir algunos dominios utilizados por Firebase para mantener el funcionamiento de la aplicación.

La corrección fue registrada en Git mediante el commit:

`fix: agregar headers de seguridad perimetral`

---

# 8. Retesting DAST

Después de aplicar las correcciones se reinició la aplicación y se volvió a ejecutar:

`docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3000`

## Resultado posterior

- `FAIL-NEW: 0`
- `WARN-NEW: 7`
- `PASS: 60`

Los siguientes controles pasaron a estado PASS:

- Anti-clickjacking Header
- X-Content-Type-Options Header
- Server Leaks Information via X-Powered-By
- Content Security Policy Header Not Set
- Permissions Policy Header Not Set

Durante el primer reanálisis también se detectó:

`CSP: Failure to Define Directive with No Fallback`

Por esta razón se complementó la política CSP con:

- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'none'`

Después de reiniciar nuevamente la aplicación, el resultado final se mantuvo en:

- `FAIL-NEW: 0`
- `WARN-NEW: 7`
- `PASS: 60`

La reducción de 11 a 7 warnings y el aumento de 56 a 60 resultados PASS permitieron comprobar que las correcciones tuvieron efecto.

---

# 9. Hallazgos residuales

Después de las correcciones permanecieron las siguientes advertencias:

- Information Disclosure - Sensitive Information in URL
- Information Disclosure - Suspicious Comments
- Storable but Non-Cacheable Content
- CSP: Wildcard Directive
- Timestamp Disclosure - Unix
- Dangerous JS Functions
- Cross-Origin-Embedder-Policy Header Missing or Invalid

## Sensitive Information in URL

ZAP detectó solicitudes similares a:

`/login?correo=foo-bar@example.com&password=ZAP`

Este hallazgo está relacionado principalmente con el módulo de autenticación y no directamente con los archivos administrativos asignados.

## Suspicious Comments

Los resultados aparecieron principalmente en archivos generados por Next.js y Firebase.

Por esta razón requieren análisis contextual y no deben considerarse automáticamente vulnerabilidades del código desarrollado.

## Storable but Non-Cacheable Content

ZAP detectó recursos cuyo comportamiento de caché podría mejorarse.

Parte de estos recursos pertenecen al comportamiento de Next.js durante el entorno de desarrollo.

## CSP: Wildcard Directive

La política CSP utiliza algunos dominios con wildcard debido a los servicios utilizados por Firebase, por ejemplo:

- `https://*.googleapis.com`
- `https://*.firebaseio.com`
- `https://*.firebaseapp.com`

La advertencia se mantiene como riesgo residual.

En producción sería recomendable restringir la política a los dominios específicos requeridos.

## Timestamp Disclosure y Dangerous JS Functions

Estos hallazgos aparecieron principalmente dentro de archivos generados por Next.js, React Server DOM, Turbopack y otras dependencias.

No se identificó evidencia directa de que representaran una vulnerabilidad propia del código asignado.

## Cross-Origin-Embedder-Policy

Este encabezado quedó pendiente debido a que una configuración demasiado restrictiva podría afectar recursos externos o servicios utilizados por la aplicación.

Se documenta como una mejora pendiente para una configuración orientada a producción.

---

# 10. Active Scan DAST

Se intentó ejecutar un escaneo activo de OWASP ZAP contra:

`http://host.docker.internal:3000/admin/dashboard`

mediante:

`docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://host.docker.internal:3000/admin/dashboard`

El análisis permaneció ejecutándose durante un periodo prolongado sin producir resultados concluyentes.

Por esta razón fue detenido manualmente.

El mensaje final obtenido fue:

`got 3 SIGTERM/SIGINTs, forcefully exiting`

El Active Scan no produjo un resultado válido, por lo que no se utiliza como evidencia de que la ruta haya aprobado o fallado el análisis.

---

# 11. Validación manual y situación de XSS

Los hallazgos obtenidos por OWASP ZAP fueron comparados con la configuración y comportamiento de la aplicación.

Se comprobó que después de modificar `next.config.ts` y reiniciar Next.js, los encabezados de seguridad comenzaron a ser detectados correctamente por ZAP.

También se comprobó que algunos warnings correspondían a recursos generados por el framework, dependencias o módulos fuera del alcance asignado.

Dentro del alcance analizado no se confirmó un caso de Cross-Site Scripting reflejado originado directamente en los archivos revisados.

Por esta razón no se realizó una modificación artificial al código únicamente para simular una corrección XSS.

Como defensa adicional se configuró Content Security Policy, aunque la ausencia de un hallazgo XSS en estas pruebas no garantiza que toda la aplicación esté libre de dicha vulnerabilidad.

---

# 12. Comparación SAST vs DAST

| Aspecto | SAST | DAST |
|---|---|---|
| Herramienta | Semgrep | OWASP ZAP |
| Tipo de análisis | Estático | Dinámico |
| Objeto analizado | Código fuente | Aplicación en ejecución |
| Requiere ejecutar la aplicación | No | Sí |
| Perspectiva | Interna/estática | Externa/dinámica |
| Resultado inicial | 0 findings | 11 warnings |
| Hallazgos principales | No se detectaron mediante las reglas utilizadas | Configuración HTTP y seguridad perimetral |
| Correcciones aplicadas | No fueron necesarias por findings de Semgrep | Sí |
| Resultado posterior | 0 findings | 7 warnings y 60 PASS |

Ambas técnicas resultaron complementarias.

SAST permitió buscar patrones inseguros directamente dentro del código.

DAST permitió detectar problemas que solamente eran visibles cuando la aplicación estaba ejecutándose y respondiendo solicitudes HTTP.

---

# 13. Evidencia Git y GitHub

Durante la práctica se utilizaron Git y GitHub para registrar las modificaciones realizadas.

Entre los commits relacionados con el trabajo se encuentran:

`fix: corregir uso del Header en layout`

`fix: agregar headers de seguridad perimetral`

También se agregó el reporte correspondiente a la práctica.

Después de integrar los últimos cambios del repositorio y realizar el push, se verificó mediante:

`git status`

El resultado final fue:

`nothing to commit, working tree clean`

La rama local quedó actualizada con:

`origin/main`

---

# 14. Reflexión

## 1. ¿Por qué 0 findings en SAST no equivale a aplicación segura?

Porque SAST analiza patrones dentro del código fuente, pero no puede detectar todos los tipos de vulnerabilidades.

Puede no identificar problemas relacionados con configuración, autorización, lógica de negocio o comportamiento que solamente aparecen cuando la aplicación está ejecutándose.

En esta práctica Semgrep reportó 0 findings, pero OWASP ZAP sí detectó problemas relacionados con la configuración HTTP.

Por lo tanto, 0 findings no garantiza que la aplicación sea completamente segura.

---

## 2. ¿Por qué un WARN de ZAP debe validarse antes de declararlo vulnerabilidad?

Porque un WARN representa una posible situación de riesgo, pero no necesariamente una vulnerabilidad explotable.

Algunos hallazgos pueden provenir de configuraciones legítimas, frameworks o dependencias externas.

Por esta razón cada advertencia debe revisarse en su contexto antes de determinar si requiere una corrección.

---

## 3. ¿Qué diferencia observaste entre baseline y active scan?

El Baseline Scan realiza principalmente análisis pasivo y permite detectar problemas observables en las respuestas HTTP.

El Active Scan realiza pruebas más agresivas para intentar localizar vulnerabilidades explotables.

En esta práctica el Baseline Scan produjo resultados útiles relacionados con encabezados HTTP.

El Active Scan se intentó ejecutar, pero permaneció funcionando durante demasiado tiempo y tuvo que detenerse, por lo que no produjo resultados concluyentes.

---

## 4. ¿Por qué 200 OK no descarta una vulnerabilidad?

Porque `200 OK` solamente indica que el servidor respondió correctamente a una solicitud.

Una aplicación puede responder con `200 OK` y aun así revelar información que el usuario no debería consultar o permitir una operación que debería estar restringida.

Por lo tanto, el código de estado HTTP por sí solo no permite determinar si una funcionalidad es segura.

---

## 5. ¿Qué aprendiste del hecho de tener que reiniciar Flask antes del retest?

Aunque SecureCampus utiliza Next.js en lugar de Flask, el mismo principio aplica.

Después de realizar una modificación es necesario comprobar que la aplicación esté ejecutando realmente la versión actualizada antes de repetir las pruebas.

En SecureCampus fue necesario reiniciar el servidor de desarrollo después de modificar los encabezados de seguridad para asegurarse de que OWASP ZAP analizara la nueva configuración.

---

## 6. ¿Qué problema de autorización podría seguir existiendo aunque SAST y DAST no lo reporten?

Podría existir un problema de control de acceso en el que un usuario autenticado pueda acceder a información o funcionalidades correspondientes a otro usuario o rol.

Por ejemplo, un estudiante podría intentar acceder directamente a una ruta administrativa o modificar un identificador para consultar información que no le corresponde.

La aplicación debe validar la autorización de cada operación y no depender únicamente de que el usuario haya iniciado sesión.

Autenticación y autorización no son lo mismo.

---

# 15. Conclusión

La práctica permitió aplicar SAST y DAST sobre módulos reales del proyecto SecureCampus.

Semgrep permitió analizar estáticamente los módulos administrativos y componentes globales asignados sin detectar findings mediante las reglas ejecutadas.

OWASP ZAP permitió identificar problemas relacionados con encabezados HTTP y configuración de seguridad perimetral que no habían sido detectados mediante SAST.

Después de aplicar las correcciones, los warnings disminuyeron de 11 a 7 y los resultados PASS aumentaron de 56 a 60.

La práctica mostró que SAST y DAST deben utilizarse de manera complementaria junto con revisión humana, pruebas de autorización y análisis de lógica de negocio dentro de un Secure SDLC.

Ninguna herramienta individual permite afirmar que una aplicación sea completamente segura.