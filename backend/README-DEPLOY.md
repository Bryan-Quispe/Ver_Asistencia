# 🚀 Despliegue en Koyeb (Backend)

## Pasos para desplegar:

### 1. Crear cuenta en Koyeb
- Ve a [https://koyeb.com](https://koyeb.com)
- Regístrate con GitHub

### 2. Conectar repositorio
1. Haz push de este proyecto a GitHub
2. En Koyeb, clic en "Create App"
3. Selecciona "GitHub" como fuente
4. Selecciona tu repositorio
5. Selecciona la carpeta `backend`

### 3. Configuración del servicio

**Build settings:**
- Builder: Dockerfile
- Dockerfile path: `./Dockerfile`

**Environment variables:**
Ninguna requerida (el puerto se asigna automáticamente)

**Instance:**
- Tipo: Eco (gratis)
- Región: Washington, D.C. (más cercano)

### 4. Deploy
- Clic en "Deploy"
- Espera 2-3 minutos

### 5. Obtener URL
- Copia la URL pública (ej: `https://tu-app.koyeb.app`)
- Esta URL la necesitarás para el frontend

## 📝 Nota importante
La URL del backend será algo como:
```
https://asistencia-espe-backend.koyeb.app
```

Guarda esta URL para configurar el frontend.
