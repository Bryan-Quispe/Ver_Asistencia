# Script de configuración rápida para despliegue
# Ejecutar: .\setup-deploy.ps1

Write-Host "🚀 Configuración de Despliegue - Asistencia ESPE" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar Git
Write-Host "📦 Verificando Git..." -ForegroundColor Yellow
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git no está instalado. Instálalo desde: https://git-scm.com/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git instalado" -ForegroundColor Green

# Paso 2: Preguntar por la URL del Backend
Write-Host ""
Write-Host "⚙️  PASO 1: Configurar Backend en Koyeb" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Primero, despliega el backend en Koyeb:" -ForegroundColor White
Write-Host "1. Ve a: https://app.koyeb.com" -ForegroundColor White
Write-Host "2. Crea un nuevo servicio desde GitHub" -ForegroundColor White
Write-Host "3. Selecciona la carpeta 'backend'" -ForegroundColor White
Write-Host "4. Usa el Dockerfile" -ForegroundColor White
Write-Host "5. Copia la URL del servicio desplegado" -ForegroundColor White
Write-Host ""

$backendUrl = Read-Host "Ingresa la URL del backend de Koyeb (ej: https://tu-app.koyeb.app)"

if ($backendUrl -eq "") {
    Write-Host "❌ Necesitas la URL del backend para continuar" -ForegroundColor Red
    exit 1
}

# Paso 3: Actualizar el frontend con la URL
Write-Host ""
Write-Host "📝 Actualizando frontend con la URL del backend..." -ForegroundColor Yellow

$frontendFile = ".\frontend\index.html"
$content = Get-Content $frontendFile -Raw
$newContent = $content -replace "const BACKEND_URL = 'http://localhost:3000';", "const BACKEND_URL = '$backendUrl';"
Set-Content -Path $frontendFile -Value $newContent

Write-Host "✅ Frontend actualizado" -ForegroundColor Green

# Paso 4: Inicializar Git
Write-Host ""
Write-Host "📦 Configurando Git..." -ForegroundColor Yellow

if (!(Test-Path ".git")) {
    git init
    Write-Host "✅ Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Git ya inicializado" -ForegroundColor Green
}

# Crear .gitignore si no existe
if (!(Test-Path ".gitignore")) {
    @"
node_modules/
.env
*.log
.DS_Store
"@ | Out-File -FilePath ".gitignore" -Encoding utf8
}

# Paso 5: Hacer commit
Write-Host ""
Write-Host "💾 Guardando cambios..." -ForegroundColor Yellow
git add .
git commit -m "Deploy: Configuración para producción" -ErrorAction SilentlyContinue
Write-Host "✅ Cambios guardados" -ForegroundColor Green

# Paso 6: Instrucciones finales
Write-Host ""
Write-Host "🌐 PASO 2: Desplegar Frontend en Vercel" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opción A - Desde GitHub (Recomendado):" -ForegroundColor White
Write-Host "1. Sube el código a GitHub:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/TU-USUARIO/asistencia-espe.git" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ve a: https://vercel.com" -ForegroundColor White
Write-Host "3. Importa el repositorio desde GitHub" -ForegroundColor White
Write-Host "4. Selecciona la carpeta 'frontend' como Root Directory" -ForegroundColor White
Write-Host "5. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "Opción B - Desde CLI:" -ForegroundColor White
Write-Host "1. Instala Vercel CLI: npm install -g vercel" -ForegroundColor Gray
Write-Host "2. cd frontend" -ForegroundColor Gray
Write-Host "3. vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡Listo! Tu app estará en producción" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Ver guía completa en: DEPLOY-GUIDE.md" -ForegroundColor Cyan
