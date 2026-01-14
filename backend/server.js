const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Variables globales
let JSESSIONID = null;
let JSESSIONID_TIMESTAMP = null;
const JSESSIONID_EXPIRY = 15 * 60 * 1000; // 15 minutos

// Middleware
app.use(cors());
app.use(express.json());

// Función para obtener JSESSIONID válido
async function obtenerJSESSIONID() {
  try {
    // Si ya tenemos uno reciente, usarlo
    if (JSESSIONID && JSESSIONID_TIMESTAMP && (Date.now() - JSESSIONID_TIMESTAMP) < JSESSIONID_EXPIRY) {
      return JSESSIONID;
    }

    console.log('🔄 Obteniendo nuevo JSESSIONID...');
    
    const response = await fetch(
      'https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=&pageMaxSize=1&pageOffset=0',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://sss.espe.edu.ec/StudentSelfService/'
        },
        redirect: 'follow'
      }
    );

    // Obtener JSESSIONID de las cookies
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && setCookie.includes('JSESSIONID')) {
      JSESSIONID = setCookie.split('JSESSIONID=')[1].split(';')[0];
      JSESSIONID_TIMESTAMP = Date.now();
      console.log('✅ JSESSIONID obtenido correctamente');
      return JSESSIONID;
    }

    throw new Error('No se pudo obtener JSESSIONID del servidor ESPE');
  } catch (error) {
    console.error('❌ Error obteniendo JSESSIONID:', error.message);
    throw error;
  }
}

// Función reutilizable para consultar secciones
async function consultarSeccionesPorNRC(nrc) {
  try {
    const sessionId = await obtenerJSESSIONID();
    
    const response = await fetch(
      `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=${nrc}&pageMaxSize=10&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`,
      {
        method: 'GET',
        headers: {
          'Cookie': `JSESSIONID=${sessionId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://sss.espe.edu.ec/StudentSelfService/'
        }
      }
    );

    const data = await response.json();
    
    // Filtrar solo las secciones válidas (que tengan horario real)
    if (data.success && data.data) {
      data.data = data.data.filter(seccion => {
        const tieneHorario = seccion.schedule.some(dia => dia !== 'false');
        return tieneHorario;
      });
      data.totalCount = data.data.length;
    }
    
    return data;
  } catch (error) {
    throw new Error(`Error al consultar: ${error.message}`);
  }
}

// Endpoint para consultar por NRC
app.post('/api/consultar-curso', async (req, res) => {
  const { nrc } = req.body;

  if (!nrc) {
    return res.status(400).json({
      success: false,
      error: 'Falta el parámetro NRC'
    });
  }

  try {
    const resultado = await consultarSeccionesPorNRC(nrc);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obtener todos los cursos registrados
app.get('/api/todos-cursos', async (req, res) => {
  try {
    const sessionId = await obtenerJSESSIONID();
    
    const response = await fetch(
      `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=&pageMaxSize=100&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`,
      {
        method: 'GET',
        headers: {
          'Cookie': `JSESSIONID=${sessionId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://sss.espe.edu.ec/StudentSelfService/'
        }
      }
    );

    const data = await response.json();
    
    // Filtrar solo las secciones válidas (que tengan horario real)
    if (data.success && data.data) {
      data.data = data.data.filter(seccion => {
        const tieneHorario = seccion.schedule.some(dia => dia !== 'false');
        return tieneHorario;
      });
      data.totalCount = data.data.length;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', sessionId: JSESSIONID ? 'Válido' : 'Sin inicializar' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  // Obtener JSESSIONID al iniciar
  obtenerJSESSIONID().catch(err => console.error('Error inicial:', err));
});
