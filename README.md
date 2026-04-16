# Juntas App - Sistema de Gestión de Ahorros y Préstamos

Una aplicación moderna y premium construida con **Next.js 16 (App Router)** y **Supabase**, diseñada para la administración eficiente de juntas de dinero (bolsas de ahorro grupal), control de participantes y gestión de préstamos internos.

## 🚀 Características Principales

- **Gestión de Participantes**: Registro completo de integrantes con datos de contacto y DNI.
- **Administración de Juntas**:
  - Configuración flexible de rondas (semanas) y montos por opción.
  - Generación automática de cronogramas semanales.
  - Control de estados (Configuración, Activa, Cerrada, Cancelada).
- **Control de Pagos**:
  - Panel semanal para confirmar la recepción de cuotas de ahorro.
  - Reversión de pagos fácil y segura.
- **Módulo de Préstamos**:
  - Otorgamiento de préstamos con cálculo automático de intereses y cuotas.
  - Seguimiento de saldos pendientes y cuotas pagadas.
- **Diseño Premium & Mobile-First**: interfaz totalmente responsiva optimizada para el uso desde celulares, con temas Claro y Oscuro.

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 (Turbopack, App Router).
- **Estilos**: Tailwind CSS v4 con arquitectura de tokens de diseño.
- **Base de Datos**: PostgreSQL (Supabase).
- **Autenticación y Sesiones**: Supabase SSR Auth.
- **Iconografía**: Lucide React.
- **Lenguaje**: TypeScript.

## 📦 Instalación y Configuración

### 1. Clonar y Dependencias
```bash
git clone <url-del-repositorio>
cd Juntas
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env.local` en la raíz con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Base de Datos
1. Ve a tu proyecto en **Supabase**.
2. Abre el **SQL Editor**.
3. Copia y ejecuta el contenido del archivo `BD/BD.sql` ubicado en este repositorio. Este script creará todas las tablas, vistas, triggers y funciones necesarias (RPC).

### 4. Desarrollo
```bash
npm run dev
```

## 🌐 Despliegue en Vercel

1. Sube tu código a un repositorio de GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. Agrega las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. **Importante**: La configuración del `proxy.ts` en Next.js 16 manejará automáticamente las sesiones de Supabase.

## 📜 Licencia
Este proyecto es de uso privado. Todos los derechos reservados.
