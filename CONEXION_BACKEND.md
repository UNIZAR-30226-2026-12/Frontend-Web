# Conexion Frontend Web - Backend

## Configuracion de red

### Desarrollo local (`npm run dev`)

| Servicio  | URL                        |
|-----------|----------------------------|
| Frontend  | `http://localhost:3000`    |
| Backend   | `http://localhost:8081`    |

El proxy se configura en `vite.config.ts`:

| Ruta        | Destino                      | Tipo       |
|-------------|------------------------------|------------|
| `/api/*`    | `http://localhost:8081`      | HTTP       |
| `/ws/*`     | `ws://localhost:8081`        | WebSocket  |
| `/uploads/*`| `http://localhost:8081`      | HTTP       |

### Produccion / Docker (`docker-compose up`)

| Servicio  | Puerto host | Puerto interno |
|-----------|-------------|----------------|
| Frontend  | `8080`      | `80` (Nginx)   |
| Backend   | `8081`      | `8000` (Uvicorn)|

El proxy se configura en `nginx.conf`:

| Ruta        | Destino                             | Tipo       |
|-------------|-------------------------------------|------------|
| `/api/*`    | `http://reversi_backend:8000`       | HTTP       |
| `/ws/*`     | `http://reversi_backend:8000`       | WebSocket  |
| `/uploads/*`| `http://reversi_backend:8000`       | HTTP       |

---

## Autenticacion

- **Token JWT** almacenado en `localStorage` con clave `'token'`
- Se envia como header `Authorization: Bearer {token}` en todas las peticiones autenticadas
- El token se genera en el backend con clave `HS256`, expira en 7 dias
- No hay refresh token; al expirar el usuario debe volver a hacer login

---

## Endpoints REST (api.ts)

Todas las rutas parten de `BASE_URL = '/api'`.

### Auth (sin token)

| Metodo | Ruta                    | Content-Type                        | Descripcion                  |
|--------|-------------------------|-------------------------------------|------------------------------|
| POST   | `/api/auth/login`       | `application/x-www-form-urlencoded` | Login (username + password)  |
| POST   | `/api/auth/register`    | `application/json`                  | Registro (username, email, password) |

### Users (con token)

| Metodo | Ruta                          | Descripcion                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/users/me`               | Obtener perfil del usuario actual  |
| PUT    | `/api/users/me`               | Actualizar username/email/password |
| GET    | `/api/users/{id}/stats`       | Estadisticas de un usuario         |
| GET    | `/api/users/{id}/h2h`         | Head-to-head contra otro usuario   |
| PUT    | `/api/users/customization`    | Actualizar avatar y colores        |
| PUT    | `/api/users/me/elo`           | Actualizar ELO                     |
| GET    | `/api/users/me/history`       | Historial de partidas              |
| GET    | `/api/users/{id}/history`     | Historial de otro usuario          |
| POST   | `/api/users/me/history`       | Guardar resultado de partida       |
| POST   | `/api/users/avatar`           | Subir avatar (multipart/form-data) |

### Friends (con token)

| Metodo | Ruta                              | Descripcion                     |
|--------|-----------------------------------|---------------------------------|
| GET    | `/api/friends`                    | Listar amigos y solicitudes     |
| POST   | `/api/friends/request`            | Enviar solicitud de amistad     |
| POST   | `/api/friends/{id}/accept`        | Aceptar solicitud               |
| POST   | `/api/friends/{id}/reject`        | Rechazar solicitud              |
| DELETE | `/api/friends/{id}`               | Eliminar amigo                  |
| GET    | `/api/friends/{id}/chat`          | Obtener chat con amigo          |
| POST   | `/api/friends/{id}/chat`          | Enviar mensaje de chat          |
| POST   | `/api/friends/{id}/chat/read`     | Marcar mensajes como leidos     |

### Games (con token)

| Metodo | Ruta                            | Descripcion                       |
|--------|---------------------------------|-----------------------------------|
| POST   | `/api/games/invite`             | Invitar amigos a partida          |
| POST   | `/api/games/{id}/accept`        | Aceptar invitacion                |
| POST   | `/api/games/{id}/reject`        | Rechazar invitacion               |
| POST   | `/api/games/{id}/leave`         | Abandonar sala                    |
| GET    | `/api/games/{id}/state`         | Obtener estado de la sala         |
| POST   | `/api/games/{id}/ready`         | Marcar como listo                 |
| GET    | `/api/games/public`             | Listar partidas publicas          |
| POST   | `/api/games/create`             | Crear partida                     |
| POST   | `/api/games/join/{id}`          | Unirse a partida                  |

---

## Conexiones WebSocket

Base URL: `ws(s)://{hostname}:{port}` (autodetectada desde `window.location`)

| Ruta                                         | Usado en          | Descripcion                        |
|----------------------------------------------|-------------------|------------------------------------|
| `/ws/notifications?token={token}`            | App.tsx           | Notificaciones en tiempo real      |
| `/ws/play/{gameId}?token={token}`            | GameBoard1v1.tsx  | Partida 1v1 en tiempo real         |
| `/ws/play/{gameId}?token={token}`            | GameBoard1v1v1v1.tsx | Partida 1v1v1v1 en tiempo real  |
| `/ws/play/{gameId}?token={token}`            | WaitingRoom.tsx   | Sala de espera en tiempo real      |

El token se pasa como query parameter `?token=` en todas las conexiones WebSocket.

---

## Mecanismo de fallback (interceptedFetch)

Si una peticion falla por error de red, `api.ts` intenta automaticamente con el puerto alternativo:
- `8081` falla -> reintenta con `8000`
- `8000` falla -> reintenta con `8081`

Esto solo aplica cuando la URL contiene uno de esos puertos (no aplica con URLs relativas como `/api`).

---

## Archivos relevantes

| Archivo                      | Funcion                                      |
|------------------------------|----------------------------------------------|
| `src/services/api.ts`        | Cliente API con todos los endpoints y token   |
| `vite.config.ts`             | Proxy para desarrollo local                   |
| `nginx.conf`                 | Proxy inverso para produccion/Docker          |
| `Dockerfile`                 | Build multi-stage (Node + Nginx)              |
| `../docker-compose.yml`      | Orquestacion de contenedores                  |
