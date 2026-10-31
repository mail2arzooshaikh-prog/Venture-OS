# VentureOS

VentureOS is an AI-powered business operating system and copilot designed for founders, startups, and agile teams. It streamlines financial oversight, invoice and expense tracking, client management, and automated document intake.

---

## Architecture Overview

VentureOS is structured as a decoupled full-stack architecture:

* **Frontend (`ventureos/`)**:
  * **Framework**: React 18 with TypeScript and Vite
  * **Styling**: Custom modern dark-theme design system with Tailwind utilities and responsive mobile layout
  * **Routing & State**: React Router 6, React Context API, Lucide icons
  * **Client Database Integration**: Supabase JS client (`@supabase/supabase-js`) with client-side authentication and Row Level Security (RLS)

* **Backend (`server/`)**:
  * **Runtime & Framework**: Node.js (ES Modules) with Express
  * **Security**: Rate limiting via `express-rate-limit`, strict production CORS origin enforcement, and JWT token authentication via Supabase Auth
  * **Intelligence & Vision**: Google Generative AI integration for conversational advisory and document OCR analysis via Gemini

* **Database & Authentication**:
  * **Engine**: Supabase (PostgreSQL)
  * **Security Model**: Row Level Security (RLS) policies ensuring tenant isolation across all tables (`businesses`, `clients`, `invoices`, `expenses`, `orders`, `tasks`)

---

## Directory Structure

```text
VentureOS-Deploy/
├── ventureos/                # Frontend React + Vite application
│   ├── src/                  # Application source (pages, components, contexts, hooks, lib)
│   ├── supabase/             # Database migrations and schema definitions
│   ├── package.json          # Frontend dependencies and build scripts
│   └── .env.example          # Template for frontend environment variables
├── server/                   # Backend Express API server
│   ├── lib/                  # Server-side Supabase client initialization
│   ├── middleware/           # Authentication and rate limiting middleware
│   ├── routes/               # API route handlers (AI copilot, Vision OCR)
│   ├── index.js              # Server entry point and middleware configuration
│   ├── package.json          # Backend dependencies and scripts
│   └── .env.example          # Template for backend environment variables
├── .gitignore                # Root Git ignore rules (excludes node_modules, dist, and .env files)
└── README.md                 # Project documentation
```

---

## Getting Started

### 1. Prerequisites
* Node.js (v18.0.0 or higher)
* npm (or pnpm/yarn)
* A Supabase project (URL and API keys)
* (Optional) Google Gemini API Key for AI features

---

### 2. Environment Configuration

Copy the example environment files in both folders:

#### Backend (`server/`):
```bash
cp server/.env.example server/.env
```
Fill in the variables in `server/.env`:
* `PORT`: Server port (default: `3001`)
* `FRONTEND_URL`: URL of the frontend (e.g. `http://localhost:5173` or your production domain)
* `SUPABASE_URL`: Your Supabase project URL (`https://your-project.supabase.co`)
* `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret key
* `GEMINI_API_KEY`: Google Gemini API key

#### Frontend (`ventureos/`):
```bash
cp ventureos/.env.example ventureos/.env
```
Fill in the variables in `ventureos/.env`:
* `VITE_SUPABASE_URL`: Your Supabase project URL
* `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key
* `VITE_API_URL`: Backend API URL (default: `http://localhost:3001`)

---

### 3. Installation & Local Development

#### Start the Backend Server:
```bash
cd server
npm install
npm run dev
```
The API server will listen on `http://localhost:3001`.

#### Start the Frontend Client:
```bash
cd ventureos
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## Production Build

To verify and create a production build of the frontend:
```bash
cd ventureos
npm run build
```
The compiled, minified output will be generated in `ventureos/dist/`.
