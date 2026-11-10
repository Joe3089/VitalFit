# VitalFit — Sistema de gestión de franquicias de gimnasios

Monorepo con todos los componentes del proyecto:

| Carpeta | Componente | Tecnología | Despliegue |
|---|---|---|---|
| [`api/`](api) | API REST (JWT + refresh token) | Go, Gin, GORM, PostgreSQL | Render (Docker) + Neon |
| [`dashboard/`](dashboard) | Aplicación web administrativa | Next.js | Vercel (Root Directory `dashboard`) |
| [`ecommerce/`](ecommerce) | Aplicación web para clientes (PWA) | Next.js | Vercel (Root Directory `ecommerce`) |
| [`app/`](app) | Aplicación móvil Android | Expo / React Native | APK (Gradle) |
| [`vitalfit-sdk/`](vitalfit-sdk) | SDK TypeScript que consumen los tres frontends | TypeScript | GitHub (`Joe3089/vitalfit-sdk#v0.5.0`) |

Guía completa de despliegue: [DESPLIEGUE.md](DESPLIEGUE.md).
