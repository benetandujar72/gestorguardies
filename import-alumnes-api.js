import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Mapatge dels IDs del CSV als IDs reals de la base de dades
const GRUP_ID_MAPPING = {
  1: 37, // 1r ESO A
  2: 38, // 1r ESO B
  3: 39, // 1r ESO C  
  4: 40  // 2n ESO A
};

function parseCSV(content) {
  const lines = content.split('\n');
  const alumnes = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Processar línies amb salts de línia dins de cometes
    let values = [];
    let currentValue = '';
    let insideQuotes = false;
    let j = 0;

    while (j < line.length) {
      const char = line[j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
      j++;
    }
    values.push(currentValue.trim());

    if (values.length >= 5) {
      const csvGrupId = parseInt(values[4]);
      const realGrupId = GRUP_ID_MAPPING[csvGrupId];
      
      if (realGrupId) {
        alumnes.push({
          nom: values[0].trim(),
          cognoms: values[1].trim(),
          email: values[2].trim(),
          telefon: values[3].trim() || null,
          grupId: realGrupId,
          anyAcademicId: 2
        });
      }
    }
  }

  return alumnes;
}

async function authenticatedRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'connect.sid=your-session-cookie' // Haurem d'obtenir això
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

async function importarAlumnes() {
  try {
    console.log('🎓 Iniciant importació d\'alumnes via API...');
    
    // Llegir el fitxer CSV
    const csvContent = fs.readFileSync('attached_assets/ALumnes _Impor_Guardies - Full 1.csv', 'utf8');
    
    // Parsejar el CSV
    const alumnes = parseCSV(csvContent);
    console.log(`📊 Processats ${alumnes.length} alumnes del CSV`);

    // Verificar grups disponibles
    console.log('\n🏫 Verificant grups disponibles...');
    try {
      const grups = await authenticatedRequest('/api/grups');
      console.log(`Grups trobats: ${grups.length}`);
    } catch (error) {
      console.log('❌ Error connectant amb l\'API. Assegura\'t que l\'aplicació estigui executant-se.');
      console.log('Pots provar d\'importar els alumnes des de la interfície web a /import-csv');
      return;
    }

    // Inserir alumnes per grups
    let totalInsertats = 0;
    let errors = 0;
    
    for (const [csvId, realId] of Object.entries(GRUP_ID_MAPPING)) {
      const alumnesGrup = alumnes.filter(a => a.grupId === realId);
      
      if (alumnesGrup.length > 0) {
        console.log(`\n📝 Inserint ${alumnesGrup.length} alumnes al grup ${realId}...`);
        
        for (const alumne of alumnesGrup) {
          try {
            await authenticatedRequest('/api/alumnes', 'POST', alumne);
            totalInsertats++;
            process.stdout.write('.');
          } catch (error) {
            errors++;
            process.stdout.write('x');
          }
        }
      }
    }

    console.log(`\n\n✅ Importació completada!`);
    console.log(`📊 Total alumnes insertats: ${totalInsertats}`);
    console.log(`❌ Errors: ${errors}`);

    // Verificar resultat final
    try {
      const alumnesResult = await authenticatedRequest('/api/alumnes');
      console.log(`🎯 Total alumnes a la base de dades: ${alumnesResult.length}`);
    } catch (error) {
      console.log('No s\'ha pogut verificar el total d\'alumnes');
    }

  } catch (error) {
    console.error('❌ Error durant la importació:', error.message);
    console.log('\n💡 Alternativa: Utilitza la interfície web per importar el CSV:');
    console.log('   1. Ves a http://localhost:5000/import-csv');
    console.log('   2. Selecciona "Alumnes" com a tipus d\'entitat');
    console.log('   3. Carrega el fitxer CSV');
  }
}

importarAlumnes().catch(console.error);