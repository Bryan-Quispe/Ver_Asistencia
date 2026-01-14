# 🚀 Despliegue en Vercel (Frontend)

## Pasos para desplegar:

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Actualizar URL del Backend
Antes de desplegar, actualiza la URL del backend en `index.html`:

Cambia esta línea (alrededor de la línea 253):
```javascript
const BACKEND_URL = 'http://localhost:3000';
```

Por tu URL de Koyeb:
```javascript
const BACKEND_URL = 'https://TU-APP-KOYEB.koyeb.app';
```

### 3. Desplegar con Vercel

**Opción A: Desde la terminal**
```bash
cd frontend
vercel
```

Responde las preguntas:
- Set up and deploy? **Yes**
- Which scope? (tu cuenta)
- Link to existing project? **No**
- Project name? `asistencia-espe-frontend`
- In which directory is your code? `./`
- Want to modify settings? **No**

**Opción B: Desde GitHub**
1. Sube el código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Clic en "Import Project"
4. Selecciona tu repositorio
5. **Root Directory:** selecciona `frontend`
6. Deploy

### 4. Configurar CORS en Backend
Después de desplegar, actualiza el backend para permitir tu dominio de Vercel.

En `backend/server.js`, cambia:
```javascript
app.use(cors());
```

Por:
```javascript
app.use(cors({
  origin: ['https://tu-app.vercel.app', 'http://localhost:8080']
}));
```

### 5. URL Final
Tu app estará disponible en:
```
https://asistencia-espe-frontend.vercel.app
```

## 🎉 ¡Listo!
Ahora tu aplicación está en producción.
