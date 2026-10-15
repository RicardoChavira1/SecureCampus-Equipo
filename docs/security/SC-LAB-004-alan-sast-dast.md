Perfecto. Ahora pega todo esto completo en el archivo. Esta vez no voy a meter bloques de código dentro de otro bloque para que no se corte.
SC-LAB-004 — Análisis SAST + DAST
Integrante
Alan Ramses Gonzalez Ruiz
Alcance asignado
El análisis se realizó sobre los módulos asignados:
- app/admin/auditoria/
- app/admin/dashboard/
- app/components/
- app/layout.tsx
- app/page.tsx
El enfoque principal fue la protección de rutas administrativas y la seguridad perimetral de la aplicación.
1. Verificación previa del proyecto
Antes de realizar las pruebas de seguridad se verificó la compilación de TypeScript mediante:
npx tsc --noEmit
Inicialmente se encontró un error en app/layout.tsx, debido a que el componente Header se estaba utilizando con propiedades que ya no existían:
<Header rolActivo="ADMIN" nombreUsuario="Ricardo (Dev)" />
La llamada fue corregida a:
<Header />
Después de realizar el cambio se volvió a ejecutar:
npx tsc --noEmit
El comando terminó sin reportar errores.
La corrección fue registrada en Git con el commit:
fix: corregir uso del Header en layout
2. Análisis SAST con Semgrep
Se utilizó Semgrep Community mediante Docker para realizar el análisis estático de los archivos asignados.
Archivos analizados
- app/layout.tsx
- app/page.tsx
- app/components/Header.tsx
- app/components/Footer.tsx
- app/admin/auditoria/page.tsx
- app/admin/dashboard/page.tsx
Procedimiento
Inicialmente se intentó analizar todas las rutas al mismo tiempo, pero el proceso tardó demasiado y tuvo que detenerse.
Por esta razón se realizó el análisis archivo por archivo.
Ejemplo del comando utilizado:
docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config auto /src/securecmpus/app/layout.tsx
El mismo procedimiento se repitió para cada uno de los archivos asignados.
Resultados SAST
- app/layout.tsx: 0 findings
- app/page.tsx: 0 findings
- app/components/Header.tsx: 0 findings
- app/components/Footer.tsx: 0 findings
- app/admin/auditoria/page.tsx: 0 findings
- app/admin/dashboard/page.tsx: 0 findings
Semgrep ejecutó 210 reglas aplicables de TypeScript/TSX por archivo.
Interpretación
Semgrep no detectó patrones inseguros mediante las reglas ejecutadas sobre los archivos asignados.
Sin embargo, obtener 0 findings no significa que la aplicación sea completamente segura. Un análisis estático puede no detectar problemas relacionados con configuración, autorización, lógica de negocio o comportamiento de la aplicación durante su ejecución.
3. Preparación para DAST
La aplicación SecureCampus se ejecutó localmente con:
npm run dev
La aplicación quedó disponible en:
http://localhost:3000
Posteriormente se verificó que un contenedor Docker pudiera comunicarse con la aplicación mediante:
docker run --rm curlimages/curl http://host.docker.internal:3000
La respuesta obtenida contenía correctamente el HTML de SecureCampus, por lo que se confirmó que OWASP ZAP podía acceder a la aplicación desde Docker.
4. Análisis DAST inicial con OWASP ZAP
Se ejecutó un Baseline Scan utilizando:
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3000
Resultado inicial
- FAIL-NEW: 0
- WARN-NEW: 11
- PASS: 56
Advertencias detectadas
OWASP ZAP reportó las siguientes advertencias:
- Missing Anti-clickjacking Header
- X-Content-Type-Options Header Missing
- Information Disclosure - Sensitive Information in URL
- Information Disclosure - Suspicious Comments
- Server Leaks Information via X-Powered-By
- Content Security Policy (CSP) Header Not Set
- Storable but Non-Cacheable Content
- Permissions Policy Header Not Set
- Timestamp Disclosure - Unix
- Dangerous JS Functions
- Cross-Origin-Embedder-Policy Header Missing or Invalid
Hallazgos relacionados directamente con mi alcance
Debido a que mi enfoque era la seguridad perimetral de la aplicación, se consideraron especialmente relevantes:
- Missing Anti-clickjacking Header
- X-Content-Type-Options Header Missing
- Server Leaks Information via X-Powered-By
- Content Security Policy (CSP) Header Not Set
- Permissions Policy Header Not Set
- Cross-Origin-Embedder-Policy Header Missing or Invalid
5. Correcciones de seguridad perimetral
Para corregir los hallazgos principales se modificó:
securecmpus/next.config.ts
Se agregaron encabezados HTTP de seguridad para toda la aplicación.
Controles agregados
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Permissions-Policy
- Content-Security-Policy
También se configuró:
poweredByHeader: false
Esto evita que Next.js exponga el encabezado X-Powered-By, reduciendo la información sobre la tecnología utilizada por el servidor.
Dentro de la política CSP se agregaron, entre otras, las siguientes directivas:
- default-src 'self'
- object-src 'none'
- base-uri 'self'
- form-action 'self'
- frame-ancestors 'none'
También fue necesario permitir algunos dominios utilizados por Firebase para evitar afectar el funcionamiento de la aplicación.
La corrección fue registrada en Git mediante el commit:
fix: agregar headers de seguridad perimetral
6. Primer reanálisis DAST
Después de realizar las correcciones se reinició la aplicación y se volvió a ejecutar el Baseline Scan:
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3000
Resultado posterior
- FAIL-NEW: 0
- WARN-NEW: 7
- PASS: 60
Los siguientes controles pasaron a estado PASS:
- Anti-clickjacking Header
- X-Content-Type-Options Header
- Server Leaks Information via X-Powered-By
- Content Security Policy Header Not Set
- Permissions Policy Header Not Set
Esto confirmó que las correcciones aplicadas en next.config.ts sí fueron reconocidas por OWASP ZAP.
7. Ajuste adicional de Content Security Policy
Después del primer reanálisis, OWASP ZAP detectó:
CSP: Failure to Define Directive with No Fallback
Por esta razón se agregaron directivas adicionales a la política CSP:
- object-src 'none'
- base-uri 'self'
- form-action 'self'
- frame-ancestors 'none'
Posteriormente se reinició nuevamente la aplicación y se realizó otro análisis.
8. Resultado DAST final
El Baseline Scan final mostró:
- FAIL-NEW: 0
- WARN-NEW: 7
- PASS: 60
Las advertencias residuales fueron:
- Information Disclosure - Sensitive Information in URL
- Information Disclosure - Suspicious Comments
- Storable but Non-Cacheable Content
- CSP: Wildcard Directive
- Timestamp Disclosure - Unix
- Dangerous JS Functions
- Cross-Origin-Embedder-Policy Header Missing or Invalid
9. Interpretación de los hallazgos residuales
Information Disclosure - Sensitive Information in URL
ZAP detectó solicitudes similares a:
/login?correo=foo-bar@example.com&password=ZAP
Este hallazgo está relacionado principalmente con el módulo de autenticación y no directamente con los archivos administrativos asignados.
Se documentó para que pueda ser revisado por el integrante encargado del módulo de autenticación.
Information Disclosure - Suspicious Comments
Los resultados aparecieron principalmente en archivos generados por Next.js y Firebase dentro de los bundles JavaScript.
Por esta razón requieren análisis contextual y no se consideran automáticamente vulnerabilidades del código desarrollado por el equipo.
Storable but Non-Cacheable Content
ZAP detectó recursos cuyo comportamiento de caché podría mejorarse.
Parte de estos recursos pertenecen a archivos generados dinámicamente por Next.js en modo desarrollo.
CSP: Wildcard Directive
Después de agregar la Content Security Policy, ZAP detectó el uso de dominios con wildcard.
Esto se debe a que Firebase utiliza dominios como:
- https://*.googleapis.com
- https://*.firebaseio.com
- https://*.firebaseapp.com
La advertencia queda registrada como riesgo residual.
En un entorno de producción se recomienda restringir estos dominios únicamente a los servicios específicos utilizados.
Timestamp Disclosure - Unix
Los timestamps detectados aparecieron principalmente dentro de archivos generados por Next.js y sus dependencias.
No se identificó evidencia de exposición directa de información sensible del proyecto a través de estos timestamps.
Dangerous JS Functions
ZAP detectó funciones JavaScript potencialmente peligrosas principalmente dentro de archivos generados por:
- Next.js
- React Server DOM
- Turbopack
- dependencias JavaScript
No se encontró evidencia directa de que estas funciones estuvieran siendo utilizadas de forma insegura dentro del código asignado.
Cross-Origin-Embedder-Policy Header Missing or Invalid
Este encabezado quedó pendiente debido a que una configuración restrictiva puede afectar recursos externos y compatibilidad con algunos servicios.
Se documenta como una mejora pendiente para una configuración orientada a producción.
10. Escaneo DAST activo
Se intentó ejecutar un escaneo activo de OWASP ZAP contra la ruta:
http://host.docker.internal:3000/admin/dashboard
mediante el comando:
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://host.docker.internal:3000/admin/dashboard
El análisis permaneció ejecutándose durante un periodo prolongado sin generar resultados.
Por esta razón fue detenido manualmente.
El mensaje final obtenido fue:
got 3 SIGTERM/SIGINTs, forcefully exiting
El escaneo activo no produjo resultados concluyentes, por lo que no se utiliza como evidencia de una vulnerabilidad detectada.
11. Comparación entre SAST y DAST
Aspecto	SAST	DAST
Herramienta	Semgrep	OWASP ZAP
Tipo de análisis	Estático	Dinámico
Requiere aplicación ejecutándose	No	Sí
Elementos analizados	Código TypeScript/TSX	Aplicación web ejecutándose
Resultado inicial	0 findings	11 warnings
Problemas encontrados	Ninguno mediante las reglas utilizadas	Configuración HTTP y seguridad perimetral
Corrección necesaria	No por findings de Semgrep	Sí
Resultado después de correcciones	0 findings	7 warnings y 60 PASS


Los resultados muestran que ambas técnicas son complementarias.
SAST no detectó patrones inseguros en el código analizado, mientras que DAST detectó problemas que únicamente eran visibles al observar las respuestas HTTP de la aplicación en ejecución.
12. Resultado final
El análisis SAST realizado con Semgrep no detectó vulnerabilidades mediante las reglas aplicadas sobre los archivos asignados.
Sin embargo, OWASP ZAP detectó diferentes debilidades de seguridad perimetral.
Después de aplicar las correcciones:
- los warnings pasaron de 11 a 7;
- los PASS aumentaron de 56 a 60;
- Anti-clickjacking pasó a PASS;
- X-Content-Type-Options pasó a PASS;
- se eliminó la exposición de X-Powered-By;
- la ausencia de Content Security Policy pasó a PASS;
- Permissions Policy pasó a PASS.
Los resultados demuestran que una aplicación puede no presentar hallazgos durante un análisis SAST y aun así contener debilidades visibles mediante análisis dinámico.
13. Conclusión
La práctica permitió aplicar SAST y DAST sobre módulos reales del proyecto SecureCampus.
Semgrep permitió comprobar de forma estática los módulos administrativos y los componentes globales asignados.
OWASP ZAP permitió analizar la aplicación en ejecución y detectar problemas relacionados con encabezados HTTP y configuración de seguridad perimetral.
A partir de los hallazgos obtenidos se implementaron controles defensivos en la configuración global de Next.js y posteriormente se realizó un reanálisis para comprobar su efectividad.
La práctica mostró la importancia de combinar SAST y DAST dentro de un Secure SDLC, ya que ambos métodos detectan diferentes tipos de problemas y permiten obtener una visión más completa del estado de seguridad de una aplicación.