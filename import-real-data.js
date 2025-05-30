const fs = require('fs');
const path = require('path');

// Función para leer y procesar el CSV de asignaciones
function processAssignationsCSV() {
  const csvPath = path.join(__dirname, 'attached_assets', 'assignacions_professorat.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1); // Omitir header
  
  const professors = new Set();
  const groups = new Set();
  const assignments = [];
  
  lines.forEach(line => {
    if (line.trim()) {
      const [assignatura, grup, professor] = line.split(',');
      
      if (assignatura && grup && professor) {
        // Limpiar datos
        const cleanGroup = grup.trim();
        const cleanProfessor = professor.trim().replace(/"/g, '');
        
        // Separar múltiples profesores si los hay
        const professorList = cleanProfessor.split(/[,\s]+/).filter(p => p.length > 3);
        
        professorList.forEach(prof => {
          professors.add(prof.trim());
          groups.add(cleanGroup);
          
          assignments.push({
            assignatura: assignatura.trim(),
            grup: cleanGroup,
            professor: prof.trim()
          });
        });
      }
    }
  });
  
  return {
    professors: Array.from(professors),
    groups: Array.from(groups),
    assignments
  };
}

// Función para hacer peticiones autenticadas
async function authenticatedRequest(endpoint, method = 'GET', data = null) {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Función principal para poblar la base de datos
async function populateDatabase() {
  try {
    console.log('📋 Procesando datos del CSV...');
    const data = processAssignationsCSV();
    
    console.log(`✅ Encontrados ${data.professors.length} profesores únicos`);
    console.log(`✅ Encontrados ${data.groups.length} grupos únicos`);
    console.log(`✅ Encontradas ${data.assignments.length} asignaciones`);
    
    // 1. Crear profesores
    console.log('\n👨‍🏫 Creando profesores...');
    for (const professorName of data.professors) {
      try {
        const [nom, ...cognomsArray] = professorName.split(' ');
        const cognoms = cognomsArray.join(' ');
        
        const professorData = {
          nom: nom || '',
          cognoms: cognoms || '',
          email: `${nom.toLowerCase()}.${cognoms.toLowerCase().replace(' ', '')}@insb.cat`,
          rol: 'Professor'
        };
        
        await authenticatedRequest('/api/professors', 'POST', professorData);
        console.log(`   ✓ Creado: ${professorName}`);
      } catch (error) {
        console.log(`   ⚠️  Error creando ${professorName}: ${error.message}`);
      }
    }
    
    // 2. Crear grupos
    console.log('\n📚 Creando grupos...');
    for (const groupName of data.groups) {
      try {
        const groupData = {
          nom: groupName,
          curs: groupName.includes('1r') ? '1r ESO' : 
                groupName.includes('2n') ? '2n ESO' :
                groupName.includes('3r') ? '3r ESO' :
                groupName.includes('4t') ? '4t ESO' : 'ESO',
          nivell: groupName.includes('ESO') ? 'ESO' : 'Altres'
        };
        
        await authenticatedRequest('/api/grups', 'POST', groupData);
        console.log(`   ✓ Creado: ${groupName}`);
      } catch (error) {
        console.log(`   ⚠️  Error creando grupo ${groupName}: ${error.message}`);
      }
    }
    
    // 3. Crear algunas aulas básicas
    console.log('\n🏛️  Creando aulas...');
    const aulas = [
      { nom: 'Aula 1A', capacitat: 30, tipus: 'Standard' },
      { nom: 'Aula 1B', capacitat: 30, tipus: 'Standard' },
      { nom: 'Aula 1C', capacitat: 30, tipus: 'Standard' },
      { nom: 'Aula 2A', capacitat: 30, tipus: 'Standard' },
      { nom: 'Aula 2B', capacitat: 30, tipus: 'Standard' },
      { nom: 'Aula 2C', capacitat: 30, tipus: 'Standard' },
      { nom: 'Laboratori', capacitat: 25, tipus: 'Laboratori' },
      { nom: 'Gimnàs', capacitat: 50, tipus: 'Esports' },
      { nom: 'Sala Música', capacitat: 20, tipus: 'Música' },
      { nom: 'Sala Informàtica', capacitat: 25, tipus: 'Informàtica' }
    ];
    
    for (const aula of aulas) {
      try {
        await authenticatedRequest('/api/aules', 'POST', aula);
        console.log(`   ✓ Creada: ${aula.nom}`);
      } catch (error) {
        console.log(`   ⚠️  Error creando aula ${aula.nom}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Datos importados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   • ${data.professors.length} profesores`);
    console.log(`   • ${data.groups.length} grupos`);
    console.log(`   • ${aulas.length} aulas`);
    console.log(`   • ${data.assignments.length} asignaciones de materia`);
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('🚀 Iniciando importación de datos del centro educativo...\n');
  populateDatabase();
}

module.exports = { populateDatabase, processAssignationsCSV };