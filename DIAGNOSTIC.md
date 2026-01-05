## Diagnóstico conexión MySQL (ECONNREFUSED)

### Config actual encontrada
- Pool único en `db.js` usando `mysql2/promise`.
- Antes: credenciales e IP fija hardcodeadas (host `15.235.115.177`, user/pass y base Clever Cloud). Sin uso de variables de entorno ni SSL configurable.
- Controladores usan `db.query` desde ese pool global (ej. `controllers/contactoController.js`).

### Causa probable del ECONNREFUSED
- IP/host fijo no accesible desde el runtime actual (puerto 3306 bloqueado o DB movida/renombrada).
- Falta de variables de entorno para apuntar a la DB real (prod/local) y sin reintentos ni timeouts explícitos.
- Sin healthcheck de DB para detectar caída a tiempo.

### Cambios implementados para resolver
- `db.js` ahora toma host/port/user/pass/db desde `DB_*`/`MYSQL_*` env, con fallback opcional `DB_HOST_ALT`; valida en arranque si falta algún dato crítico.
- Pool robusto: `waitForConnections`, `connectionLimit` (configurable), `connectTimeout`/`acquireTimeout`, keep-alive, y SSL opcional mediante env (`DB_SSL`, `DB_SSL_CA`, `DB_SSL_REJECT_UNAUTHORIZED`).
- Log inicial sin secretos indicando host/port/db/ssl/connectionLimit.
- Endpoint `/health/db` con `ping()` y timeout (503 si DB caída).
- Controladores de contacto ahora devuelven 503 con `DB_UNAVAILABLE` en errores de conexión (ECONNREFUSED/timeout/host no encontrado) en lugar de 500 genérico.

### Próximos pasos de despliegue
- Definir en el entorno (Fly/Render/etc.) las variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, y según proveedor `DB_SSL=1`, `DB_SSL_CA` y `DB_SSL_REJECT_UNAUTHORIZED`.
- Verificar que el host MySQL escuche remoto (puerto 3306 abierto, bind-address 0.0.0.0 o IP permitida, usuario con host `%` o IP del servidor).
- Probar `/health/db` antes y después de desplegar; si falla, revisar conectividad/firewall del host configurado.
