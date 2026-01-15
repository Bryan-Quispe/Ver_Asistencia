const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS configurado - Permitir todos los orígenes para desarrollo
app.use(cors({
  origin: '*', // Permitir cualquier origen (cámbialo en producción)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false // Cambiar a false cuando origin es '*'
}));

// Agregar headers adicionales de CORS manualmente
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Almacenar cookies de sesión
let sessionCookie = null;
let sessionExpiry = null;

// Función para obtener sesión válida de ESPE
async function obtenerSesionESPE() {
  try {
    console.log('🔑 Obteniendo nueva sesión de ESPE...');
    
    const response = await fetch(
      'https://sss.espe.edu.ec/StudentSelfService/',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Connection': 'keep-alive'
        },
        redirect: 'follow'
      }
    );

    // Extraer cookie de sesión
    const setCookie = response.headers.get('set-cookie');
    
    if (setCookie && setCookie.includes('JSESSIONID')) {
      sessionCookie = setCookie.split('JSESSIONID=')[1].split(';')[0];
      // La sesión expira en 30 minutos (aproximado)
      sessionExpiry = Date.now() + (30 * 60 * 1000);
      console.log('✅ Nueva sesión obtenida:', sessionCookie.substring(0, 15) + '...');
      return sessionCookie;
    }
    
    console.log('⚠️ No se obtuvo cookie JSESSIONID');
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo sesión:', error.message);
    return null;
  }
}

// Verificar si la sesión está expirada
function sesionExpirada() {
  if (!sessionCookie || !sessionExpiry) {
    return true;
  }
  return Date.now() > sessionExpiry;
}

// Función para consultar NRC con sesión
async function consultarNrcDirecto(nrc) {
  try {
    console.log(`🔍 Consultando NRC: ${nrc}`);
    
    if (!nrc || nrc.trim() === '') {
      throw new Error('NRC no puede estar vacío');
    }

    // Obtener sesión si no la tenemos o está expirada
    if (sesionExpirada()) {
      console.log('🔄 Sesión expirada, obteniendo nueva...');
      sessionCookie = await obtenerSesionESPE();
      if (!sessionCookie) {
        throw new Error('No se pudo obtener sesión de ESPE');
      }
    }

    const url = `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=${encodeURIComponent(nrc)}&pageMaxSize=10&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`;
    
    console.log('📡 Realizando petición a ESPE...');
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Referer': 'https://sss.espe.edu.ec/StudentSelfService/ssb/StudentAttendanceTracking',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': `JSESSIONID=${sessionCookie}`,
      'Connection': 'keep-alive'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    const contentType = response.headers.get('content-type');
    console.log('📊 Status:', response.status);

    // Si nos redirige o no es JSON, la sesión expiró
    if (response.status !== 200 || !contentType?.includes('application/json')) {
      console.log('⚠️ Sesión inválida, marcando como expirada');
      sessionCookie = null;
      sessionExpiry = null;
      throw new Error('SESION_EXPIRADA');
    }

    // Leer y parsear respuesta
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Error parseando JSON:', e.message);
      console.error('📄 Response:', text.substring(0, 500));
      throw new Error('ESPE devolvió una respuesta inválida. Verifique el NRC e intente de nuevo.');
    }
    
    // Validar estructura de respuesta
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de ESPE');
    }

    // Procesar y retornar datos
    console.log('✅ Datos obtenidos correctamente');
    console.log(`📊 Total de secciones encontradas: ${data.totalCount}`);
    
    return {
      success: true,
      nrc: nrc,
      totalSecciones: data.totalCount,
      secciones: data.data.map(seccion => ({
        titulo: seccion.sectionTitle,
        codigo: seccion.courseNumber,
        nrc: seccion.courseReferenceNumber,
        materia: seccion.subjectDesc,
        codigoMateria: seccion.subjectCode,
        termino: seccion.termCode,
        horario: seccion.time,
        diasSemana: parsearDiasSemana(seccion.schedule),
        faltas: seccion.missed,
        porcentajeAsistencia: seccion.percentage,
        idReunion: seccion.sectionMeetingId
      })),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en consultarNrcDirecto:', error.message);
    throw error;
  }
}

// Función auxiliar para parsear días de la semana
function parsearDiasSemana(schedule) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diasActivos = [];
  
  schedule.forEach((dia, index) => {
    if (dia !== 'false' && dia !== false) {
      diasActivos.push(dias[index]);
    }
  });
  
  return diasActivos.length > 0 ? diasActivos.join(', ') : 'No especificado';
}

// ==================== ENDPOINTS ====================

// Endpoint principal para consultar por NRC
app.post('/api/consultar-curso', async (req, res) => {
  const { nrc } = req.body;

  if (!nrc) {
    return res.status(400).json({
      success: false,
      error: 'Falta el parámetro NRC'
    });
  }

  // Validar que sea un número
  if (!/^\d+$/.test(nrc.toString())) {
    return res.status(400).json({
      success: false,
      error: 'El NRC debe ser un número válido'
    });
  }

  try {
    let resultado;
    
    // Intentar primera vez
    try {
      resultado = await consultarNrcDirecto(nrc);
    } catch (error) {
      // Si la sesión expiró, reintentar con sesión nueva
      if (error.message === 'SESION_EXPIRADA') {
        console.log('🔄 Sesión expirada, reintentando con sesión nueva...');
        sessionCookie = null;
        sessionExpiry = null;
        await obtenerSesionESPE();
        resultado = await consultarNrcDirecto(nrc);
      } else {
        throw error;
      }
    }
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar el NRC'
    });
  }
});

// Endpoint GET alternativo
app.get('/api/consultar-curso/:nrc', async (req, res) => {
  const { nrc } = req.params;

  if (!nrc || !/^\d+$/.test(nrc)) {
    return res.status(400).json({
      success: false,
      error: 'NRC inválido'
    });
  }

  try {
    let resultado;
    
    try {
      resultado = await consultarNrcDirecto(nrc);
    } catch (error) {
      if (error.message === 'SESION_EXPIRADA') {
        console.log('🔄 Reintentando con sesión nueva...');
        sessionCookie = null;
        sessionExpiry = null;
        await obtenerSesionESPE();
        resultado = await consultarNrcDirecto(nrc);
      } else {
        throw error;
      }
    }
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar el NRC'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    sessionActive: !sesionExpirada(),
    sessionExpiry: sessionExpiry ? new Date(sessionExpiry).toISOString() : null
  });
});

// Endpoint para forzar renovación de sesión
app.post('/api/renovar-sesion', async (req, res) => {
  try {
    sessionCookie = null;
    sessionExpiry = null;
    await obtenerSesionESPE();
    
    res.json({
      success: true,
      message: 'Sesión renovada exitosamente',
      sessionActive: !sesionExpirada()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al renovar sesión'
    });
  }
});

// Endpoint de prueba para debug
app.get('/debug/test-nrc/:nrc', async (req, res) => {
  const { nrc } = req.params;
  try {
    const resultado = await consultarNrcDirecto(nrc);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📌 Endpoints disponibles:`);
  console.log(`   POST /api/consultar-curso (body: {nrc: "28423"})`);
  console.log(`   GET  /api/consultar-curso/:nrc`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/renovar-sesion`);
  console.log(`   GET  /debug/test-nrc/:nrc`);
  console.log('');
  
  // Obtener sesión inicial
  obtenerSesionESPE();
});