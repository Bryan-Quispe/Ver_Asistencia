# 🚀 Guía Completa de Despliegue - Asistencia ESPE

## 📋 Orden de Despliegue

### PASO 1: Desplegar Backend en Koyeb ⚙️

#### 1.1 Preparar el repositorio
```bash
# Crear repositorio en GitHub (si no existe)
git init
git add .
git commit -m "Deploy: Backend y Frontend"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/asistencia-espe.git
git push -u origin main
```

#### 1.2 Desplegar en Koyeb
1. Ve a [https://app.koyeb.com](https://app.koyeb.com)
2. Clic en **"Create App"**
3. Selecciona **"GitHub"**
4. Autoriza Koyeb en tu GitHub
5. Selecciona el repositorio: `asistencia-espe`
6. **Builder:** Dockerfile
7. **Dockerfile path:** `backend/Dockerfile`
8. **Port:** 3000 (automático)
9. **Nombre del servicio:** `asistencia-espe-backend`
10. Clic en **"Deploy"**

#### 1.3 Obtener URL del Backend
Después del despliegue, copia la URL:
```
https://asistencia-espe-backend-TU-ID.koyeb.app
```
**⚠️ GUARDA ESTA URL, la necesitarás para el frontend!**

---

### PASO 2: Configurar Frontend con la URL del Backend 🎨

#### 2.1 Actualizar la URL del Backend

Edita el archivo `frontend/index.html` en la **línea 253** aproximadamente:

**ANTES:**
```javascript
const BACKEND_URL = 'http://localhost:3000';
```

**DESPUÉS:**
```javascript
const BACKEND_URL = 'https://asistencia-espe-backend-TU-ID.koyeb.app';
```

#### 2.2 Guardar y hacer commit
```bash
git add frontend/index.html
git commit -m "Update: Backend URL para producción"
git push
```

---

### PASO 3: Desplegar Frontend en Vercel 🌐

#### Opción A: Desde GitHub (Recomendado)

1. Ve a [https://vercel.com](https://vercel.com)
2. Clic en **"Add New..."** → **"Project"**
3. Importa tu repositorio de GitHub
4. **Framework Preset:** Other
5. **Root Directory:** selecciona `frontend`
6. **Build Command:** (dejar vacío)
7. **Output Directory:** `./`
8. Clic en **"Deploy"**

#### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Ir a la carpeta frontend
cd frontend

# Desplegar
vercel --prod
```

#### 2.3 URL del Frontend
Tu app estará en:
```
https://asistencia-espe-frontend.vercel.app
```

---

### PASO 4: Configurar CORS en el Backend 🔒

Para que el frontend en Vercel pueda comunicarse con el backend en Koyeb:

#### 4.1 Editar `backend/server.js`

**ANTES (línea 10):**
```javascript
app.use(cors());
```

**DESPUÉS:**
```javascript
app.use(cors({
  origin: [
    'https://asistencia-espe-frontend.vercel.app',
    'https://asistencia-espe-frontend-*.vercel.app', // Para previews
    'http://localhost:8080' // Para desarrollo local
  ],
  credentials: true
}));
```

#### 4.2 Commit y redeploy
```bash
git add backend/server.js
git commit -m "Fix: Configurar CORS para producción"
git push
```

Koyeb automáticamente re-desplegará el backend.

---

## ✅ Verificación Final

1. ✅ Backend desplegado en Koyeb
2. ✅ Frontend desplegado en Vercel
3. ✅ CORS configurado
4. ✅ URL del backend actualizada en el frontend

### Prueba tu app:
1. Abre: `https://asistencia-espe-frontend.vercel.app`
2. Agrega un NRC al monitor
3. Verifica que se consulte correctamente

---

## 🐛 Troubleshooting

### Error: "Failed to fetch" en el frontend
- Verifica que la URL del backend en `index.html` sea correcta
- Revisa que CORS esté configurado correctamente

### Backend no responde
- Revisa los logs en Koyeb dashboard
- Verifica que el puerto sea 3000 o la variable PORT

### Frontend no se actualiza
- Haz un "Clear cache and hard reload" en el navegador
- Verifica el deployment en Vercel dashboard

---

## 📱 URLs de Producción

- **Backend API:** https://asistencia-espe-backend-TU-ID.koyeb.app
- **Frontend Web:** https://asistencia-espe-frontend.vercel.app
- **Dashboard Koyeb:** https://app.koyeb.com
- **Dashboard Vercel:** https://vercel.com/dashboard

---

## 🎉 ¡Listo!

Tu aplicación de monitoreo de asistencia ESPE está en producción.
