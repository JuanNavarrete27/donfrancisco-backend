ENDPOINTS - Bentasca Fixed
Base URL: http://localhost:3000 or your render URL
Auth: Authorization: Bearer <token>

POST /usuarios/register
POST /usuarios/login
GET /usuarios (admin)
GET /usuarios/:id (admin)
PUT /usuarios/:id (admin)
DELETE /usuarios/:id (admin)

GET /tablas/anual
GET /tablas/clausura
POST /tablas/anual (admin)
PUT /tablas/anual/:id (admin)
DELETE /tablas/anual/:id (admin)

GET /goleadores
POST /goleadores (admin)
PUT /goleadores/:id (admin)
DELETE /goleadores/:id (admin)

GET /eventos
POST /eventos (admin)
PUT /eventos/:id (admin)
DELETE /eventos/:id (admin)
