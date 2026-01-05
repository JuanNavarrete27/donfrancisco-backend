# donfrancisco-backend

Backend Node.js/Express para Don Francisco.

## Endpoints de contacto (compatibles con `/contacto` y `/api/contacto`)

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
```

## Pruebas en producción (Fly)

```bash
curl -i "https://donfrancisco-backend.fly.dev/contacto?limit=30&offset=0"
curl -i "https://donfrancisco-backend.fly.dev/contacto/counts"
curl -i "https://donfrancisco-backend.fly.dev//contacto/counts"
```
