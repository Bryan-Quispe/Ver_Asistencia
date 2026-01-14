const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Variables globales
let JSESSIONID = null;
let JSESSIONID_TIMESTAMP = null;
const JSESSIONID_EXPIRY = 2 * 60 * 60 * 1000; // 2 horas

// Middleware
app.use(cors());
app.use(express.json());

// Función para hacer login en ESPE
async function loginEnESPE(usuario, contrasena) {
  try {
    console.log('🔐 Intentando login en ESPE...');
    
    // Primero, obtener la página de login para extraer JSESSIONID
    const loginPageResponse = await fetch(
      'https://sss.espe.edu.ec/StudentSelfService/',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'manual'
      }
    );

    // Extraer JSESSIONID de las cookies
    const setCookie = loginPageResponse.headers.get('set-cookie');
    let sessionId = null;
    
    if (setCookie && setCookie.includes('JSESSIONID')) {
      sessionId = setCookie.split('JSESSIONID=')[1].split(';')[0];
    }

    if (!sessionId) {
      throw new Error('No se pudo obtener JSESSIONID inicial');
    }

    console.log('📌 JSESSIONID obtenido:', sessionId.substring(0, 10) + '...');

    // Ahora hacer login con las credenciales
    const loginResponse = await fetch(
      'https://sss.espe.edu.ec/StudentSelfService/ssb/login',
      {
        method: 'POST',
        headers: {
          'Cookie': `JSESSIONID=${sessionId}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://sss.espe.edu.ec/StudentSelfService/'
        },
        body: new URLSearchParams({
          'sid': usuario,
          'PIN': contrasena
        })
      }
    );

    // Verificar si el login fue exitoso
    const responseText = await loginResponse.text();
    
    if (responseText.includes('Invalid') || responseText.includes('invalid') || loginResponse.status !== 200) {
      throw new Error('Credenciales inválidas o error en el servidor ESPE');
    }

    // Guardar la sesión válida
    JSESSIONID = sessionId;
    JSESSIONID_TIMESTAMP = Date.now();
    
    console.log('✅ Login exitoso en ESPE');
    return sessionId;
  } catch (error) {
    console.error('❌ Error en loginEnESPE:', error.message);
    throw error;
  }
}

// Función para consultar con sesión válida
async function consultarSeccionesPorNRC(nrc) {
  try {
    if (!JSESSIONID) {
      throw new Error('No hay sesión activa. Haz login primero.');
    }

    // Validar si la sesión sigue siendo válida
    const now = Date.now();
    if (now - JSESSIONID_TIMESTAMP > JSESSIONID_EXPIRY) {
      JSESSIONID = null;
      throw new Error('Sesión expirada. Haz login de nuevo.');
    }
    
    const response = await fetch(
      `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=${encodeURIComponent(nrc)}&pageMaxSize=10&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`,
      {
        method: 'GET',
        headers: {
          'Cookie': `JSESSIONID=${JSESSIONID}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://sss.espe.edu.ec/StudentSelfService/'
        }
      }
    );

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Sesión inválida o expirada. Status:', response.status);
      JSESSIONID = null;
      throw new Error('Sesión expirada. Por favor haz login de nuevo.');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de ESPE');
    }

    // Filtrar solo las secciones válidas
    if (data.data) {
      data.data = data.data.filter(seccion => {
        const tieneHorario = seccion.schedule.some(dia => dia !== 'false');
        return tieneHorario;
      });
      data.totalCount = data.data.length;
    }
    
    return data;
  } catch (error) {
    console.error('Error en consultarSeccionesPorNRC:', error.message);
    throw new Error(`Error al consultar: ${error.message}`);
  }
}

// ==================== ENDPOINTS ====================

// Endpoint de login
app.post('/api/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({
      success: false,
      error: 'Usuario y contraseña son requeridos'
    });
  }

  try {
    await loginEnESPE(usuario, contrasena);
    res.json({
      success: true,
      message: 'Login exitoso'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

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
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obtener todos los cursos registrados
app.get('/api/todos-cursos', async (req, res) => {
  try {
    if (!JSESSIONID) {
      throw new Error('No hay sesión activa. Haz login primero.');
    }

    const response = await fetch(
      `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=&pageMaxSize=100&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`,
      {
        method: 'GET',
        headers: {
          'Cookie': `JSESSIONID=${JSESSIONID}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://sss.espe.edu.ec/StudentSelfService/'
        }
      }
    );

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      JSESSIONID = null;
      throw new Error('Sesión expirada. Por favor haz login de nuevo.');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de ESPE');
    }

    if (data.data) {
      data.data = data.data.filter(seccion => {
        const tieneHorario = seccion.schedule.some(dia => dia !== 'false');
        return tieneHorario;
      });
      data.totalCount = data.data.length;
    }
    
    res.json(data);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    autenticado: JSESSIONID ? 'Sí' : 'No',
    tiempoRestante: JSESSIONID ? Math.round((JSESSIONID_EXPIRY - (Date.now() - JSESSIONID_TIMESTAMP)) / 1000 / 60) + ' min' : 'N/A'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📌 Endpoint de login: POST /api/login`);
});
