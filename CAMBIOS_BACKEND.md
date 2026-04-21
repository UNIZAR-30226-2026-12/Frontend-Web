# Cambios Backend: Recuperación de Contraseña (flujo simplificado)

## Resumen del flujo

Este documento **reemplaza** el flujo con token descrito en `RECUPERACION_CONTRASENA.md`.
El nuevo flujo no necesita tokens, ni segundo endpoint, ni página de restablecimiento.

```
1. Usuario pulsa "¿Olvidaste tu contraseña?" → ForgotPasswordModal
2. Introduce email → POST /api/auth/forgot-password
3. Backend verifica que el email existe en la base de datos
4. Backend genera una nueva contraseña aleatoria (8 caracteres)
5. Backend actualiza el hash de la contraseña en la BD  ← PRIMERO
6. Backend envía el correo con la nueva contraseña       ← DESPUÉS
7. Usuario recibe el correo y puede iniciar sesión inmediatamente
```

> **¿Por qué actualizar la BD antes de enviar el correo?**
> Si el envío del correo fallase, la contraseña antigua seguiría siendo válida.
> Si actualizásemos después y la BD fallase, el usuario recibiría un correo con
> una contraseña que no funciona. Actualizar primero es el orden más seguro.

---

## Cambios en `POST /api/auth/forgot-password`

### Lógica actual (asumida)
- Recibe `{ email: string }`
- Verifica que el email existe
- (pendiente) enviaba un token por correo

### Lógica nueva
1. Recibe `{ email: string }`
2. Busca el usuario por email en la BD
3. Si **no existe**: devolver `200 OK` igualmente (no revelar si el email está registrado)
4. Si **existe**:
   a. Generar nueva contraseña aleatoria (ver especificación abajo)
   b. Hashear la contraseña con el mismo algoritmo que se usa en el registro
   c. **Actualizar** el campo de contraseña del usuario en la BD
   d. Enviar correo al usuario (ver plantilla abajo)
5. Devolver `200 OK` con `{ message: "Si el correo existe, recibirás una nueva contraseña" }`

---

## Especificación de la contraseña generada

| Propiedad | Valor |
|---|---|
| Longitud | **8 caracteres** |
| Letras minúsculas | `a-z` |
| Letras mayúsculas | `A-Z` |
| Dígitos | `0-9` |
| Símbolos permitidos | `! @ # $ % & * - _ + = ?` |
| Caracteres **excluidos** | tildes, ñ, ç, y cualquier carácter fuera del teclado inglés estándar |

**Regla de composición recomendada** (para garantizar que la contraseña sea válida en el sistema):
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 dígito
- Los 5 caracteres restantes: aleatorios del conjunto completo

Ejemplo de implementación (Python):
```python
import secrets
import string

def generate_password(length: int = 8) -> str:
    lowercase = string.ascii_lowercase   # a-z
    uppercase = string.ascii_uppercase   # A-Z
    digits     = string.digits           # 0-9
    symbols    = "!@#$%&*-_+=?"

    # Garantizar al menos uno de cada tipo relevante
    password_chars = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
    ]
    full_charset = lowercase + uppercase + digits + symbols
    password_chars += [secrets.choice(full_charset) for _ in range(length - 3)]

    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)
```

---

## Plantilla del correo

- **Remitente:** `rreversi.auth@gmail.com`
- **Asunto:** `Tu nueva contraseña de Reversi`
- **Cuerpo (texto plano):**

```
Hola,

Hemos recibido una solicitud para recuperar el acceso a tu cuenta de Reversi.

Tu nueva contraseña es:

    XXXXXXXX

Puedes iniciar sesión con ella en cualquier momento.
Te recomendamos cambiarla por una propia en cuanto accedas.

Si no solicitaste este cambio, contacta con nosotros respondiendo a este correo.

— El equipo de Reversi
```

> Sustituir `XXXXXXXX` por la contraseña generada en el paso 4a.

---

## Cambios en `docker-compose.yml`

**Solo afecta al servicio del backend.** Añadir o confirmar las siguientes variables:

```yaml
# En el servicio del backend dentro de docker-compose.yml
environment:
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
  - SMTP_USER=rreversi.auth@gmail.com
  - SMTP_PASSWORD=<app-password-de-google>
```

> `FRONTEND_URL` ya **no es necesaria** con este flujo (no hay enlace en el correo).

Para obtener `SMTP_PASSWORD` hay que generar una **App Password** de Google:
`Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicación`

---

## Impacto en Frontend

Con este flujo el frontend **no necesita cambios adicionales**:

| Pieza | Estado |
|---|---|
| `ForgotPasswordModal.tsx` | ✅ Ya implementado, no cambia |
| `api.auth.forgotPassword` | ✅ Ya implementado, no cambia |
| `api.auth.resetPassword` | ❌ Ya **no hace falta** implementarlo |
| `src/pages/ResetPassword.tsx` | ❌ Ya **no hace falta** crearlo |
| Detección de token en `App.tsx` | ❌ Ya **no hace falta** |

---

## Endpoints afectados

| Método | Ruta | Cambio |
|---|---|---|
| `POST` | `/api/auth/forgot-password` | Modificar lógica (ver arriba) |
| `POST` | `/api/auth/reset-password` | **No implementar** (flujo eliminado) |
