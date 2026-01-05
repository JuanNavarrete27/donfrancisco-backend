# donfrancisco-backend

Backend Node.js/Express para Don Francisco.

## Endpoints de contacto (compatibles con `/contacto`, `/api/contacto` y `/admin/contacto`)

- `GET /contacto?limit=30&offset=0`
  - Lista mensajes con paginación (`limit` por defecto 30, máx. 200; `offset` por defecto 0).
  - Respuesta:  
    ```json
    {
      "ok": true,
      "data": {
        "items": [],
        "limit": 30,
        "offset": 0,
        "total": 0
      }
    }
    ```
- `GET /contacto/counts`
  - Resumen de conteos.  
    ```json
    {
      "ok": true,
      "data": {
        "total": 0,
        "activos": 0,
        "no_leidos": 0,
        "pendientes_respuesta": 0
      }
    }
    ```
- `POST /contacto`
  - Crear mensaje público. Body: `{ "nombre": "...", "email": "...", "mensaje": "..." }`
  - Respuesta 201:  
    ```json
    {
      "ok": true,
      "data": {
        "id": 123,
        "message": "Mensaje enviado correctamente"
      }
    }
    ```

## Pruebas rápidas (local)

```bash
curl -i "http://localhost:8080/contacto?limit=30&offset=0"
curl -i "http://localhost:8080/contacto/counts"
curl -i "http://localhost:8080//contacto/counts"
curl -i "http://localhost:8080/health"
curl -i "http://localhost:8080/health/db"
```

## Pruebas en producción (Fly)

```bash
curl -i "https://donfrancisco-backend.fly.dev/contacto?limit=30&offset=0"
curl -i "https://donfrancisco-backend.fly.dev/contacto/counts"
curl -i "https://donfrancisco-backend.fly.dev//contacto/counts"
curl -i "https://donfrancisco-backend.fly.dev/health"
curl -i "https://donfrancisco-backend.fly.dev/health/db"
```

## Variables de entorno requeridas (DB)

- `DB_HOST` (o `MYSQL_HOST`)
- `DB_PORT` (default 3306)
- `DB_USER` (o `MYSQL_USER`)
- `DB_PASSWORD` (o `MYSQL_PASSWORD`)
- `DB_NAME` (o `MYSQL_DATABASE`)
- `DB_CONN_LIMIT` (opcional, default 3)
- `DB_CONNECT_TIMEOUT_MS` (opcional, default 10000)
- `DB_ACQUIRE_TIMEOUT_MS` (opcional, default 10000)
- `DB_SSL` (0/1, opcional)
- `DB_SSL_REJECT_UNAUTHORIZED` (0/1, opcional, default 1)
- `DB_SSL_CA` (ruta a CA opcional)

Checklist para DB remota:
- Puerto 3306 accesible desde el servidor.
- MySQL configurado con `bind-address 0.0.0.0` o permitiendo la IP del backend.
- Usuario con permisos y host `%` o la IP del backend.
