const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000; // Puerto dinámico para Render

// JSESSIONID por defecto (lo cambiarás cuando expire)
const JSESSIONID_DEFAULT = '1BCEC82882AE73B84EC9D5EC89716609';

// Middleware
app.use(cors());
app.use(express.json());

// Función reutilizable para consultar secciones
async function consultarSeccionesPorNRC(nrc) {
  try {
    const response = await fetch(
      `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=${nrc}&pageMaxSize=10&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`,
      {
        method: 'GET',
        headers: {
          'Cookie': `JSESSIONID=${JSESSIONID_DEFAULT}`,
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
      error: 'Falta el parámetro NRC'
    });
  }

  try {
    const resultado = await consultarSeccionesPorNRC(nrc);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Endpoint para obtener todos los cursos registrados
app.get('/api/todos-cursos', async (req, res) => {
  try {
    const response = await fetch(
      `https://sss.espe.edu.ec/StudentSelfService/ssb/studentAttendanceTracking/getRegisteredSections?filterText=&pageMaxSize=100&pageOffset=0&sortColumn=courseReferenceNumber&sortDirection=asc`,
      {
        method: 'GET',
        headers: {
          'Cookie': `JSESSIONID=${JSESSIONID_DEFAULT}`,
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
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📌 JSESSIONID actual: ${JSESSIONID_DEFAULT}`);
});
