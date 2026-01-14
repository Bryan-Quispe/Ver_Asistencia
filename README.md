# Consulta de Asistencia ESPE - Arquitectura Separada

Tu aplicación ya está dividida en **Frontend** y **Backend**. Aquí están las instrucciones para levantarlos.

## 📁 Estructura

```
.VER ASISTENCIA/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/ (después de npm install)
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── node_modules/ (después de npm install)
└── README.md
```

## 🚀 Cómo levantar la aplicación

### 1️⃣ Backend (API REST)

```bash
# Ir a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Iniciar el servidor (en puerto 3000)
npm start
```

✅ El backend estará disponible en: **http://localhost:3000**

### 2️⃣ Frontend (Interfaz web)

En otra terminal:

```bash
# Ir a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor (en puerto 8080)
npm start
```

✅ El frontend estará disponible en: **http://localhost:8080**

## 📝 Notas importantes

- **Backend**: Corre en puerto `3000` y expone el endpoint `/api/consultar-curso`
- **Frontend**: Corre en puerto `8080` y se conecta automáticamente al backend
- El frontend apunta a `http://localhost:3000` para las consultas
- Ambos tienen soporte CORS habilitado

## 🔧 Variables de entorno (opcional)

Para cambiar puertos, crea un archivo `.env` en cada carpeta:

**backend/.env**
```
PORT=3000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3000
```

## 📱 ¿Todo funcionando?

1. ✅ Backend corriendo (verás: "🚀 Servidor corriendo en puerto 3000")
2. ✅ Frontend corriendo (se abrirá en el navegador)
3. ✅ Intenta hacer una consulta ingresando un NRC

¡Listo! Tu aplicación está separada y lista para escalar 🎉
