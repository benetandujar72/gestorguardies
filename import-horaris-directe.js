import fs from 'fs';
import { db } from './server/db.ts';
import { horaris, professors, grups } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Mapejos de grups
const grupMapping = {
  '1A': 37, '1B': 38, '1C': 39,
  '2A': 40, '2B': 41, '2C': 42, 
  '3A': 43, '3B': 44, '3C': 45,
  '4tA': 46, '4tB': 47, '4tC': 48
};

// Mapejos de professors
const professorMapping = {
  'MCY': 149, 'CM': 150, 'JC': 151, 'AF': 152, 'LA': 153, 'MS': 154,
  'LM': 155, 'F': 156, 'R': 157, 'AP': 158, 'IZ': 159, 'IM': 160,
  'BR': 161, 'AN': 162, 'JM': 163, 'NM': 164, 'MV': 165, 'L': 166,
  'MÇ': 167, 'S': 168, 'PF': 169, 'A': 170, 'MA': 171, 'DP': 172,
  'JT': 173, 'LC': 174, 'MJ': 175, 'AP': 176, 'MV': 177, 'AF': 178,
  'AN': 179, 'RY': 180, 'RM': 187, 'AS': 185, 'AD': 186, 'BA': 182
};

async function importarHoraris() {
  try {
    console.log('🚀 Iniciant importació d\'horaris...');
    
    // Llegir el fitxer CSV
    const csvContent = fs.readFileSync('horaris-nous.csv', 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log('📄 Headers trobats:', headers);
    console.log('📊 Total línies a processar:', lines.length - 1);
    
    let importedCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length < 6) continue;
      
      const [diaSemanaStr, horaInici, horaFi, materia, professorIdStr, grupIdStr, aulaIdStr] = values;
      
      try {
        // Mapear dia de la setmana
        const diaSetmana = parseInt(diaSemanaStr);
        
        // Mapear professor
        const professorId = professorMapping[professorIdStr];
        if (!professorId) {
          console.log(`⚠️  Professor no trobat: ${professorIdStr}`);
          continue;
        }
        
        // Mapear grup  
        const grupId = grupMapping[grupIdStr];
        if (!grupId) {
          console.log(`⚠️  Grup no trobat: ${grupIdStr}`);
          continue;
        }
        
        // Convertir hores al format correcte
        const horaIniciFormatted = horaInici.length === 4 ? `0${horaInici}:00` : `${horaInici}:00`;
        const horaFiFormatted = horaFi.length === 4 ? `0${horaFi}:00` : `${horaFi}:00`;
        
        // Crear l'horari
        await db.insert(horaris).values({
          diaSetmana,
          horaInici: horaIniciFormatted,
          horaFi: horaFiFormatted,
          professorId,
          grupId,
          aulaId: aulaIdStr ? parseInt(aulaIdStr) : null,
          assignatura: materia || null,
          anyAcademicId: 2 // Any acadèmic actiu
        });
        
        importedCount++;
        
        if (importedCount % 100 === 0) {
          console.log(`✅ Importats ${importedCount} horaris...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error processant línia ${i}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Importació completada:`);
    console.log(`   ✅ Horaris importats: ${importedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error en la importació:', error);
  } finally {
    process.exit(0);
  }
}

importarHoraris();