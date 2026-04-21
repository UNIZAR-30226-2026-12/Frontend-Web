# Plan: Sistema de Recuperación de Contraseñas

## Estado actual

| Pieza | Archivo | Estado |
|---|---|---|
| Modal que pide el email | `src/components/ForgotPasswordModal.tsx` | ✅ Hecho |
| Llamada API forgot-password | `src/services/api.ts` → `api.auth.forgotPassword` | ✅ Hecho |
| Integración en LoginModal y Home | `src/components/LoginModal.tsx`, `src/pages/Home.tsx` | ✅ Hecho |
| Llamada API reset-password | `src/services/api.ts` → `api.auth.resetPassword` | ❌ Falta |
| Página de nueva contraseña | `src/pages/ResetPassword.tsx` | ❌ Falta |
| Detección del token en la URL | `src/shell/App.tsx` | ❌ Falta |
| Envío real del correo (backend) | — | ❓ Pendiente del equipo de back |
| Endpoint `POST /auth/reset-password` (backend) | — | ❓ Pendiente del equipo de back |

---

## Flujo completo esperado

```
1. Usuario pulsa "¿Olvidaste tu contraseña?" → ForgotPasswordModal
2. Introduce email → POST /api/auth/forgot-password
3. Backend envía correo desde rreversi.auth@gmail.com
   con enlace: https://<dominio>/?token=TOKEN
4. Usuario hace clic en el enlace → la app carga con ?token=TOKEN en la URL
5. App.tsx detecta el token → muestra pantalla "reset-password"
6. Usuario introduce nueva contraseña → POST /api/auth/reset-password
   body: { token, new_password }
7. Exito → limpiar URL → redirigir a home
```

---

## Cambios pendientes en Frontend (3 archivos)

### 1. `src/services/api.ts`
Añadir `resetPassword` a continuación de `forgotPassword`:

```typescript
resetPassword: async (token: string, newPassword: string) => {
    const response = await interceptedFetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!response.ok) {
        let detail = 'Error al restablecer la contraseña';
        try {
            const error = await response.json();
            detail = error.detail || detail;
        } catch { /* sin JSON */ }
        throw new Error(detail);
    }
    return response.json();
},
```

### 2. `src/pages/ResetPassword.tsx`
Página nueva. Reutiliza el fondo de Home y los estilos `popup-box` + `auth-form--popup`.

Comportamiento:
- Recibe el token como prop desde `App.tsx`
- Formulario con dos campos: nueva contraseña y confirmación
- Valida que ambas contraseñas coincidan antes de enviar
- En exito: muestra mensaje, limpia la URL con `window.history.replaceState({}, '', '/')` y redirige a `home` tras 3 segundos
- En error: muestra el mensaje del backend

### 3. `src/shell/App.tsx`
Al inicializar la app, detectar si la URL contiene `?token=`:

```typescript
// Leer el token de la URL en el arranque
const [resetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('token') || ''
})

// Dar prioridad a la pantalla reset-password si hay token
const [currentScreen, setCurrentScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('token')) return 'reset-password'
    return localStorage.getItem('currentScreen') || 'home'
})
```

Y añadir al render:
```tsx
import ResetPassword from '../pages/ResetPassword'
...
{currentScreen === 'reset-password' && (
    <ResetPassword token={resetToken} onNavigate={navigateTo} />
)}
```

---

## Cambios pendientes en Backend

El equipo de back debe:

1. **Implementar `POST /api/auth/reset-password`**
   - Recibe: `{ token: string, new_password: string }`
   - Valida que el token exista y no haya expirado
   - Actualiza la contraseña del usuario
   - Invalida el token tras usarlo

2. **Envío del correo en `POST /api/auth/forgot-password`**
   - Remitente: `rreversi.auth@gmail.com`
   - El enlace del correo debe tener el formato: `{FRONTEND_URL}/?token={TOKEN}`

---

## Cambios en `docker-compose.yml`

**Solo afecta al servicio del backend.** Añadir las siguientes variables de entorno:

```yaml
# En el servicio del backend dentro de docker-compose.yml
environment:
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
  - SMTP_USER=rreversi.auth@gmail.com
  - SMTP_PASSWORD=<app-password-de-google>
  - FRONTEND_URL=http://localhost:8080   # en produccion, poner el dominio real
```

> `FRONTEND_URL` es critica: el backend la usa para construir el enlace del correo.
> Si no se configura correctamente, el enlace apuntara al sitio equivocado en produccion.

Para obtener `SMTP_PASSWORD` hay que generar una **App Password** de Google:
`Cuenta de Google → Seguridad → Verificacion en dos pasos → Contrasenas de aplicacion`

---

## Parametro URL acordado con Backend

| Parametro | Valor |
|---|---|
| Nombre del query param | `token` |
| Ejemplo de URL en el correo | `https://midominio.com/?token=abc123xyz` |

> Confirmar este nombre con el equipo de back antes de implementar.
