const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Función para consultar NRC directamente en ESPE
async function consultarNrcDirecto(nrc) {
  try {
    console.log(`🔍 Consultando NRC: ${nrc}`);
    
    if (!nrc || nrc.trim() === '') {
      throw new Error('NRC no puede estar vacío');
    }

    const url = `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=${encodeURIComponent(nrc)}&pageMaxSize=10&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`;
    
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.8'
      }
    });

    const contentType = response.headers.get('content-type');
    console.log('📊 Content-Type:', contentType);
    console.log('📊 Status:', response.status);

    // Leer el body
    const text = await response.text();
    console.log('📄 Response (primeros 200 chars):', text.substring(0, 200));

    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('ESPE devolvió una respuesta inválida (no es JSON). Es posible que el servidor esté fuera de servicio o el NRC sea incorrecto.');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de ESPE');
    }

    // Retornar todos los datos tal como vienen
    return data;
  } catch (error) {
    console.error('❌ Error en consultarNrcDirecto:', error.message);
    throw error;
  }
}

// ==================== ENDPOINTS ====================

// Endpoint para consultar por NRC (SIN LOGIN)
app.post('/api/consultar-curso', async (req, res) => {
  const { nrc } = req.body;

  if (!nrc) {
    return res.status(400).json({
      success: false,
      error: 'Falta el parámetro NRC'
    });
  }

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📌 Endpoint: POST /api/consultar-curso`);
});
