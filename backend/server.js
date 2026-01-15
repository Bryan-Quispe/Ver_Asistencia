const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS - Permitir todos los orígenes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
}));

// Headers adicionales de CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
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

    const setCookie = response.headers.get('set-cookie');
    
    if (setCookie && setCookie.includes('JSESSIONID')) {
      sessionCookie = setCookie.split('JSESSIONID=')[1].split(';')[0];
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
    console.log('📊 Content-Type:', contentType);

    // Si nos redirige o no es JSON, la sesión expiró
    if (response.status !== 200) {
      console.log('⚠️ Status code no es 200');
      sessionCookie = null;
      sessionExpiry = null;
      throw new Error('SESION_EXPIRADA');
    }

    // Leer respuesta
    const text = await response.text();
    console.log('📄 Response (primeros 200 chars):', text.substring(0, 200));
    
    // Si no es JSON, sesión expirada
    if (!contentType || !contentType.includes('application/json')) {
      console.log('⚠️ Respuesta no es JSON');
      sessionCookie = null;
      sessionExpiry = null;
      throw new Error('SESION_EXPIRADA');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Error parseando JSON:', e.message);
      throw new Error('Respuesta inválida de ESPE');
    }
    
    console.log('✅ Datos parseados correctamente');
    console.log('📊 Success:', data.success);
    console.log('📊 Total items:', data.data ? data.data.length : 0);

    // Verificar estructura de respuesta
    if (!data.success) {
      throw new Error('La respuesta de ESPE indica un error');
    }

    if (!Array.isArray(data.data)) {
      throw new Error('Formato de datos incorrecto');
    }

    // Procesar y retornar datos en el formato correcto
    const resultado = {
      success: true,
      nrc: nrc,
      totalSecciones: data.totalCount || data.data.length,
      secciones: data.data.map(seccion => {
        // Parsear días de la semana
        const diasArray = seccion.schedule || [];
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diasActivos = [];
        
        diasArray.forEach((dia, index) => {
          if (dia !== 'false' && dia !== false && dia !== 'False') {
            diasActivos.push(diasNombres[index]);
          }
        });

        // Formatear horario
        let horarioFormateado = 'No especificado';
        if (seccion.time && seccion.time !== '0000') {
          const horas = seccion.time.substring(0, 2);
          const minutos = seccion.time.substring(2, 4);
          horarioFormateado = `${horas}:${minutos}`;
        }

        return {
          titulo: seccion.sectionTitle || 'Sin título',
          codigo: seccion.courseNumber || '',
          nrc: seccion.courseReferenceNumber || nrc,
          materia: seccion.subjectDesc || 'Sin descripción',
          codigoMateria: seccion.subjectCode || '',
          termino: seccion.termCode || '',
          horario: horarioFormateado,
          diasSemana: diasActivos.length > 0 ? diasActivos.join(', ') : 'Sin horario definido',
          faltas: seccion.missed || 0,
          porcentajeAsistencia: seccion.percentage || 0,
          idReunion: seccion.sectionMeetingId || null
        };
      }),
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Resultado procesado correctamente');
    return resultado;
    
  } catch (error) {
    console.error('❌ Error en consultarNrcDirecto:', error.message);
    throw error;
  }
}

// ==================== ENDPOINTS ====================

// Endpoint principal para consultar por NRC
app.post('/api/consultar-curso', async (req, res) => {
  console.log('📥 POST /api/consultar-curso');
  console.log('📥 Body:', req.body);

  try {
    const { nrc } = req.body;

    if (!nrc) {
      console.log('⚠️ NRC no proporcionado');
      return res.status(400).json({
        success: false,
        error: 'Falta el parámetro NRC'
      });
    }

    // Validar que sea un número
    const nrcStr = nrc.toString().trim();
    if (!/^\d+$/.test(nrcStr)) {
      console.log('⚠️ NRC no es numérico:', nrcStr);
      return res.status(400).json({
        success: false,
        error: 'El NRC debe ser un número válido'
      });
    }

    console.log('✅ NRC válido:', nrcStr);

    let resultado;
    let intentos = 0;
    const maxIntentos = 2;

    while (intentos < maxIntentos) {
      try {
        intentos++;
        console.log(`🔄 Intento ${intentos} de ${maxIntentos}`);
        resultado = await consultarNrcDirecto(nrcStr);
        break; // Si tiene éxito, salir del loop
      } catch (error) {
        console.log(`❌ Intento ${intentos} falló:`, error.message);
        
        if (error.message === 'SESION_EXPIRADA' && intentos < maxIntentos) {
          console.log('🔄 Renovando sesión y reintentando...');
          sessionCookie = null;
          sessionExpiry = null;
          await obtenerSesionESPE();
          continue;
        }
        
        // Si es el último intento o no es error de sesión, lanzar error
        if (intentos >= maxIntentos) {
          throw error;
        }
      }
    }
    
    console.log('✅ Enviando respuesta exitosa');
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en endpoint:', error.message);
    console.error('❌ Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar el NRC',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint GET alternativo
app.get('/api/consultar-curso/:nrc', async (req, res) => {
  console.log('📥 GET /api/consultar-curso/:nrc');
  
  try {
    const { nrc } = req.params;

    if (!nrc || !/^\d+$/.test(nrc)) {
      return res.status(400).json({
        success: false,
        error: 'NRC inválido'
      });
    }

    let resultado;
    let intentos = 0;
    const maxIntentos = 2;

    while (intentos < maxIntentos) {
      try {
        intentos++;
        resultado = await consultarNrcDirecto(nrc);
        break;
      } catch (error) {
        if (error.message === 'SESION_EXPIRADA' && intentos < maxIntentos) {
          sessionCookie = null;
          sessionExpiry = null;
          await obtenerSesionESPE();
          continue;
        }
        if (intentos >= maxIntentos) {
          throw error;
        }
      }
    }
    
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en GET endpoint:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar el NRC'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  console.log('📥 GET /health');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    sessionActive: !sesionExpirada(),
    sessionExpiry: sessionExpiry ? new Date(sessionExpiry).toISOString() : null,
    version: '1.0.0'
  });
});

// Endpoint para forzar renovación de sesión
app.post('/api/renovar-sesion', async (req, res) => {
  console.log('📥 POST /api/renovar-sesion');
  
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
    console.error('❌ Error renovando sesión:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al renovar sesión'
    });
  }
});

// Endpoint de prueba para debug
app.get('/debug/test-nrc/:nrc', async (req, res) => {
  console.log('📥 GET /debug/test-nrc/:nrc');
  const { nrc } = req.params;
  
  try {
    const resultado = await consultarNrcDirecto(nrc);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en debug:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Endpoint raíz
app.get('/', (req, res) => {
  res.json({
    name: 'API Consulta Asistencia ESPE',
    version: '1.0.0',
    endpoints: {
      'POST /api/consultar-curso': 'Consultar por NRC (body: {nrc: "12345"})',
      'GET /api/consultar-curso/:nrc': 'Consultar por NRC (URL param)',
      'GET /health': 'Estado del servidor',
      'POST /api/renovar-sesion': 'Renovar sesión de ESPE',
      'GET /debug/test-nrc/:nrc': 'Debug endpoint'
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log('='.repeat(50));
  console.log('📌 Endpoints disponibles:');
  console.log('   POST /api/consultar-curso');
  console.log('   GET  /api/consultar-curso/:nrc');
  console.log('   GET  /health');
  console.log('   POST /api/renovar-sesion');
  console.log('   GET  /debug/test-nrc/:nrc');
  console.log('='.repeat(50));
  
  // Obtener sesión inicial
  obtenerSesionESPE().then(() => {
    console.log('✅ Servidor listo para recibir peticiones');
  }).catch((error) => {
    console.error('❌ Error obteniendo sesión inicial:', error);
  });
});