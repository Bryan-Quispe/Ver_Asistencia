# ⚡ Comandos Rápidos de Despliegue

## 🚀 Opción 1: Configuración Automática (Recomendado)

```powershell
# Ejecutar script de configuración
.\setup-deploy.ps1
```

Este script te guiará paso a paso.

---

## 🛠️ Opción 2: Paso a Paso Manual

### 1. Backend en Koyeb

```bash
# 1. Crear repo en GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/asistencia-espe.git
git push -u origin main

# 2. En Koyeb:
# - Conectar con GitHub
# - Seleccionar repo
# - Builder: Dockerfile
# - Path: backend/Dockerfile
# - Deploy
```

### 2. Actualizar Frontend

```javascript
// Editar frontend/index.html línea ~253
const BACKEND_URL = 'https://TU-APP.koyeb.app';
```

### 3. Frontend en Vercel

**Opción A: GitHub**
```bash
git add frontend/index.html
git commit -m "Update backend URL"
git push

# Ir a vercel.com → Import Project → Seleccionar "frontend"
```

**Opción B: CLI**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

---

## 🔧 Actualizar CORS en Backend

```javascript
// backend/server.js
app.use(cors({
  origin: [
    'https://tu-app.vercel.app',
    'https://tu-app-*.vercel.app',
    'http://localhost:8080'
  ],
  credentials: true
}));
```

```bash
git add backend/server.js
git commit -m "Fix CORS"
git push
```

---

## ✅ Verificación

```bash
# Test backend
curl https://tu-app.koyeb.app/api/consultar-curso -X POST -H "Content-Type: application/json" -d "{\"nrc\":\"27917\"}"

# Test frontend
# Abrir: https://tu-app.vercel.app
```

---

## 🐛 Troubleshooting

### Ver logs del backend (Koyeb)
```
Dashboard → Tu App → Logs
```

### Ver logs del frontend (Vercel)
```
Dashboard → Tu Proyecto → Deployments → Logs
```

### Limpiar cache de Vercel
```bash
vercel --force
```

---

## 📊 URLs de Producción

Anota aquí tus URLs:

- **Backend:** `https://_____________________.koyeb.app`
- **Frontend:** `https://_____________________.vercel.app`
- **Koyeb Dashboard:** https://app.koyeb.com
- **Vercel Dashboard:** https://vercel.com/dashboard
