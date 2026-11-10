# Despliegue de VitalFit

| Componente | Dónde | Repo |
|---|---|---|
| API (Go) | Render (Docker) | `Joe3089/api` |
| Base de datos | Neon (PostgreSQL) | — |
| Dashboard | Vercel | `Joe3089/dashboard` |
| Ecommerce | Vercel | `Joe3089/ecommerce` |
| App Android | APK (build local con Gradle) | `Joe3089/app` |
| SDK | Se instala desde GitHub (`github:Joe3089/vitalfit-sdk#v0.5.0`) | `Joe3089/vitalfit-sdk` |

Orden obligatorio: **Neon → Render → Vercel → APK**, porque cada paso necesita la URL del anterior.

---

## 1. Base de datos en Neon

1. Crea un proyecto en https://neon.tech (plan gratis).
2. Copia la *connection string* (formato `postgresql://usuario:clave@host/neondb?sslmode=require`).
3. Carga los datos base desde tu PC (crea el Super Admin, permisos, roles y políticas comerciales):

```powershell
cd api
$env:DB_ADDR = "postgresql://...?sslmode=require"
$env:ADMIN_EMAIL = "tu-correo@dominio.com"
$env:ADMIN_PASSWORD = "UnaClaveSegura#2026"
# 1) migraciones (o deja que Render las aplique en su primer arranque y luego corre el seed)
# 2) seed esencial
go run internal/migrate/seed/main.go
```

- `SEED_DEMO=true` además carga datos de demostración (sucursales, clases, clientes, facturas). No lo uses si el sistema tendrá datos reales.
- El seed necesita que las tablas existan: si la base está vacía, primero despliega Render (paso 2), que aplica las migraciones al arrancar, y después corre el seed.

## 2. API en Render

1. https://dashboard.render.com → **New → Blueprint** → conecta `Joe3089/api` (rama `feat/backlog-completo` o `main` tras el merge).
2. Render lee `render.yaml` y pide las variables marcadas `sync: false`:

| Variable | Valor |
|---|---|
| `DB_ADDR` | connection string de Neon |
| `API_URL` | URL pública del servicio, ej. `https://vitalfit-api.onrender.com` |
| `WHITE_LIST` | URLs de Vercel separadas por coma, ej. `https://vitalfit-dashboard.vercel.app,https://vitalfit-ecommerce.vercel.app` |
| `FRONT_URL` / `FRONT_URL_E` | URL del dashboard / del ecommerce |
| `ENCRYPTION_KEY` | exactamente 32 caracteres; no la cambies nunca (cifra datos médicos) |
| `RESEND_API_KEY`, `FROM_RESEND_EMAIL` | **obligatorias**: códigos 2FA, activación y recuperación de contraseña |
| `CLERK_JWKS_URL` | login con Google |
| `OPEN_EXCHANGE_APP_ID` | tasas de cambio (multimoneda) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | pagos con tarjeta |
| `FIREBASE_CREDENTIALS_BASE64` | opcional: notificaciones push |
| `OPENAI_API_KEY` | opcional: chatbot |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGIONR` | opcional: reconocimiento facial |

3. Cada despliegue ejecuta `migrate up` antes de iniciar, así que las migraciones nuevas se aplican solas.
4. Comprueba: `https://TU-API.onrender.com/v1/health` y Swagger en `/v1/swagger/index.html`.
5. En Stripe, apunta el webhook a `https://TU-API.onrender.com/v1/webhooks/stripe`.

> El plan gratis de Render duerme el servicio tras 15 min sin tráfico; la primera petición tarda ~50 s en despertar. Redis está desactivado (`REDIS_ENABLED=false`) y las tasas de cambio se cachean en memoria.

> El 2FA del dashboard viene **activado**. Si aún no configuraste Resend, desactívalo temporalmente en Neon: `UPDATE security_settings SET two_factor_required = false;`

## 3. Dashboard y ecommerce en Vercel

Para cada repo (`Joe3089/dashboard` y `Joe3089/ecommerce`):

1. https://vercel.com/new → importa el repo. Framework: **Next.js** (se detecta solo). No cambies build ni install commands.
2. **Environment Variables → Import .env**: pega el contenido de tu archivo local `dashboard/env` y cambia:
   - `NEXT_PUBLIC_API_URL=https://TU-API.onrender.com/v1` (con `/v1` al final)
   - `NEXT_PUBLIC_DEV_MODE=false`
3. Deploy. Cada push a la rama conectada vuelve a desplegar.
4. Copia las dos URLs de Vercel en `WHITE_LIST`, `FRONT_URL` y `FRONT_URL_E` de Render (paso 2) y redespliega la API.
5. En Clerk, agrega las URLs de Vercel como dominios permitidos.

## 4. APK de la app

Requisitos ya presentes en este equipo: Android SDK y JDK 17 (`C:\Program Files\Java\jdk-17`).

```powershell
cd app
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:EXPO_PUBLIC_API_URL = "https://TU-API.onrender.com/v1"
$env:EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_..."
$env:EXPO_PUBLIC_MAPBOX_TOKEN = "..."
$env:EXPO_PUBLIC_IMGBB_API_KEY = "..."
npx expo prebuild -p android --clean
cd android; .\gradlew assembleRelease
```

La APK queda en `app/android/app/build/outputs/apk/release/app-release.apk`. Cópiala al teléfono e instálala (permite "orígenes desconocidos").

> Las variables `EXPO_PUBLIC_*` se incrustan al compilar: si cambia la URL de la API hay que generar la APK de nuevo.

## 5. Verificación rápida

1. `GET /v1/health` responde `available`.
2. Login en el dashboard con el Super Admin del seed (llega el código 2FA al correo).
3. Crea una sucursal y un servicio; publica una clase.
4. En el ecommerce regístrate como cliente y compra una membresía.
5. En la APK inicia sesión con ese cliente, reserva y cancela la clase.
6. En el dashboard revisa *Reportes → Analítica Avanzada* (conversión, NPS, benchmarking).
