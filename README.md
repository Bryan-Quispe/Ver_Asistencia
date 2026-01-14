<<<<<<< HEAD
# 📚 Monitor de Asistencia ESPE

Sistema web para monitorear automáticamente la asistencia de cursos de la ESPE con alertas inteligentes.

## 🚀 Características

- ✅ Monitoreo automático cada 24 horas
- 🚨 Alertas cuando la asistencia < 85%
- ⚠️ Advertencias para asistencia 85-90%
- 📊 Dashboard con vista de todas las materias
- 💾 Almacenamiento local en el navegador
- 🎨 Interfaz moderna y responsive

## 🛠️ Tecnologías

- **Backend:** Node.js + Express
- **Frontend:** HTML + CSS + JavaScript (Vanilla)
- **Deploy:** Koyeb (Backend) + Vercel (Frontend)

## 📁 Estructura

```
.VER ASISTENCIA/
├── backend/          # API REST
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/         # Interfaz web
│   ├── index.html
│   ├── package.json
│   └── vercel.json
└── DEPLOY-GUIDE.md  # Guía de despliegue
```

## 🚀 Despliegue en Producción

Ver [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md) para instrucciones completas de despliegue.

### Resumen rápido:

1. **Backend (Koyeb):** Desplegar con Dockerfile
2. **Frontend (Vercel):** Importar desde GitHub
3. **Configurar:** Actualizar URL del backend en frontend

## 💻 Desarrollo Local

### 1️⃣ Backend (API REST)

```bash
cd backend
npm install
npm start  # Puerto 3000
```

✅ Backend disponible en: **http://localhost:3000**

### 2️⃣ Frontend (Interfaz web)

```bash
cd frontend
npm install
npm start  # Puerto 8080
```

✅ Frontend disponible en: **http://localhost:8080**

## 📝 Notas

- **Backend**: Puerto `3000` - Endpoint `/api/consultar-curso`
- **Frontend**: Puerto `8080` - Se conecta al backend
- CORS habilitado para desarrollo y producción

## 📄 Licencia

MIT

## 👤 Autor

ESPE Student
=======
hola jijija

