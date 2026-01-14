const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Almacenar cookies de sesión
let sessionCookie = null;

// Función para obtener sesión válida de ESPE
async function obtenerSesionESPE() {
  try {
    console.log('🔑 Obteniendo sesión de ESPE...');
    
    const response = await fetch(
      'https://sss.espe.edu.ec/StudentSelfService/',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
      }
    );

    // Extraer cookie de sesión
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && setCookie.includes('JSESSIONID')) {
      sessionCookie = setCookie.split('JSESSIONID=')[1].split(';')[0];
      console.log('✅ Sesión obtenida:', sessionCookie.substring(0, 15) + '...');
      return sessionCookie;
    }
    
    console.log('⚠️ No se obtuvo cookie JSESSIONID');
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo sesión:', error.message);
    return null;
  }
}

// Función para consultar NRC con sesión
async function consultarNrcDirecto(nrc) {
  try {
    console.log(`🔍 Consultando NRC: ${nrc}`);
    
    if (!nrc || nrc.trim() === '') {
      throw new Error('NRC no puede estar vacío');
    }

    // Obtener sesión si no la tenemos
    if (!sessionCookie) {
      sessionCookie = await obtenerSesionESPE();
    }

    const url = `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=${encodeURIComponent(nrc)}&pageMaxSize=10&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`;
    
    console.log('📡 URL:', url);
    console.log('🔑 Cookie:', sessionCookie ? sessionCookie.substring(0, 15) + '...' : 'No disponible');
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Referer': 'https://sss.espe.edu.ec/StudentSelfService/ssb/StudentAttendanceTracking',
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (sessionCookie) {
      headers['Cookie'] = `JSESSIONID=${sessionCookie}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    const contentType = response.headers.get('content-type');
    console.log('📊 Content-Type:', contentType);
    console.log('📊 Status:', response.status);

    // Leer el body
    const text = await response.text();
    console.log('📄 Response (primeros 300 chars):', text.substring(0, 300));

    // Si nos redirige (código 302), la sesión expiró
    if (response.status === 302 || response.status === 301) {
      sessionCookie = null;
      throw new Error('Sesión expirada, reintentando...');
    }

    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Error parseando JSON:', e.message);
      console.error('📄 Response completo:', text.substring(0, 500));
      throw new Error('ESPE devolvió una respuesta inválida. Verifique el NRC e intente de nuevo.');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de ESPE');
    }

    return data;
  } catch (error) {
    console.error('❌ Error en consultarNrcDirecto:', error.message);
    throw error;
  }
}

// ==================== ENDPOINTS ====================

// Endpoint para consultar por NRC (SIN LOGIN DE USUARIO)
app.post('/api/consultar-curso', async (req, res) => {
  const { nrc } = req.body;

  if (!nrc) {
    return res.status(400).json({
      success: false,
      error: 'Falta el parámetro NRC'
    });
  }

  try {
    let resultado;
    
    // Intentar primera vez
    try {
      resultado = await consultarNrcDirecto(nrc);
    } catch (error) {
      // Si falla, resetear sesión y reintentar
      console.log('🔄 Reintentando con sesión nueva...');
      sessionCookie = null;
      resultado = await consultarNrcDirecto(nrc);
    }
    
    res.json(resultado);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    sessionActive: !!sessionCookie
  });
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
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📌 Endpoint: POST /api/consultar-curso`);
  console.log(`📌 Debug: GET /debug/test-nrc/:nrc`);
  
  // Obtener sesión inicial
  obtenerSesionESPE();
});
