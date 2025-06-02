import fs from 'fs';
import { Pool } from '@neondatabase/serverless';

// Configuració de la base de dades
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Mapatge dels IDs del CSV als IDs reals de la base de dades
const GRUP_ID_MAPPING = {
  1: 37, // 1r ESO A
  2: 38, // 1r ESO B
  3: 39, // 1r ESO C  
  4: 40  // 2n ESO A
};

function parseCSV(content) {
  const lines = content.split('\n');
  const header = lines[0].split(',');
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
    values.push(currentValue.trim()); // Afegir l'últim valor

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
      } else {
        console.log(`Advertència: grupId ${csvGrupId} no està mapejat`);
      }
    }
  }

  return alumnes;
}

async function importarAlumnes() {
  try {
    console.log('🎓 Iniciant importació d\'alumnes...');
    
    // Llegir el fitxer CSV
    const csvContent = fs.readFileSync('attached_assets/ALumnes _Impor_Guardies - Full 1.csv', 'utf8');
    
    // Parsejar el CSV
    const alumnes = parseCSV(csvContent);
    console.log(`📊 Processats ${alumnes.length} alumnes del CSV`);

    // Verificar estat de la base de dades
    const client = await pool.connect();
    
    try {
      // Comprovar grups disponibles
      const grupsResult = await client.query(
        'SELECT grup_id, nom_grup FROM grups WHERE any_academic_id = 2 ORDER BY grup_id'
      );
      console.log(`🏫 Grups disponibles: ${grupsResult.rows.length}`);
      grupsResult.rows.forEach(grup => {
        console.log(`   - ${grup.grup_id}: ${grup.nom_grup}`);
      });

      // Inserir alumnes per grups
      let totalInsertats = 0;
      
      for (const [csvId, realId] of Object.entries(GRUP_ID_MAPPING)) {
        const alumnesGrup = alumnes.filter(a => a.grupId === realId);
        
        if (alumnesGrup.length > 0) {
          console.log(`\n📝 Inserint ${alumnesGrup.length} alumnes al grup ${realId}...`);
          
          for (const alumne of alumnesGrup) {
            try {
              await client.query(
                `INSERT INTO alumnes (nom, cognoms, email, telefon, grup_id, any_academic_id) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [alumne.nom, alumne.cognoms, alumne.email, alumne.telefon, alumne.grupId, alumne.anyAcademicId]
              );
              totalInsertats++;
            } catch (error) {
              console.error(`❌ Error inserint alumne ${alumne.nom} ${alumne.cognoms}:`, error.message);
            }
          }
        }
      }

      // Verificar resultat final
      const finalCount = await client.query('SELECT COUNT(*) as total FROM alumnes WHERE any_academic_id = 2');
      console.log(`\n✅ Importació completada!`);
      console.log(`📊 Total alumnes insertats: ${totalInsertats}`);
      console.log(`🎯 Total alumnes a la base de dades: ${finalCount.rows[0].total}`);

      // Mostrar resum per grups
      console.log('\n📈 Resum per grups:');
      const grupResum = await client.query(`
        SELECT g.nom_grup, COUNT(a.alumne_id) as num_alumnes
        FROM grups g 
        LEFT JOIN alumnes a ON g.grup_id = a.grup_id AND a.any_academic_id = 2
        WHERE g.any_academic_id = 2 
        GROUP BY g.grup_id, g.nom_grup 
        ORDER BY g.grup_id
      `);
      
      grupResum.rows.forEach(row => {
        console.log(`   ${row.nom_grup}: ${row.num_alumnes} alumnes`);
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error durant la importació:', error);
  } finally {
    await pool.end();
  }
}

// Executar la importació
importarAlumnes().catch(console.error);