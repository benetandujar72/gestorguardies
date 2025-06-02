import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configurar la connexió
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  webSocketConstructor: ws
});

// Dades de guàrdies del fitxer
const guardiesData = [
  { dia: 1, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'ML' },
  { dia: 1, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'MÇ' },
  { dia: 2, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'AP' },
  { dia: 2, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'NM' },
  { dia: 2, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'RM' },
  { dia: 3, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'ML' },
  { dia: 3, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'MV' },
  { dia: 4, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'RY' },
  { dia: 4, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'MÇ' },
  { dia: 4, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'RM' },
  { dia: 5, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'BR' },
  { dia: 5, horaInici: '08:00:00', horaFi: '09:00:00', codi: 'MV' },
  
  { dia: 1, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'TM' },
  { dia: 1, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'MCY' },
  { dia: 1, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'RY' },
  { dia: 2, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'JM' },
  { dia: 2, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'AP' },
  { dia: 2, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'BR' },
  { dia: 3, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'AP' },
  { dia: 3, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'BR' },
  { dia: 3, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'MCY' },
  { dia: 4, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'RY' },
  { dia: 4, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'AS' },
  { dia: 4, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'MÇ' },
  { dia: 4, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'RM' },
  { dia: 5, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'BA' },
  { dia: 5, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'NM' },
  { dia: 5, horaInici: '09:00:00', horaFi: '10:00:00', codi: 'MÇ' },
  
  { dia: 1, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'LM' },
  { dia: 1, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'TM' },
  { dia: 1, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'RY' },
  { dia: 2, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'ML' },
  { dia: 2, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'NM' },
  { dia: 2, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'BR' },
  { dia: 2, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'EP' },
  { dia: 2, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'MC' },
  { dia: 3, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'ML' },
  { dia: 3, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'RM' },
  { dia: 3, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'PF' },
  { dia: 4, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'JM' },
  { dia: 4, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'MÇ' },
  { dia: 4, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'IF' },
  { dia: 5, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'AF' },
  { dia: 5, horaInici: '10:00:00', horaFi: '11:00:00', codi: 'MÇ' },
  
  { dia: 1, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'JC' },
  { dia: 1, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'AD' },
  { dia: 1, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'AF' },
  { dia: 2, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'LC' },
  { dia: 2, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'NM' },
  { dia: 2, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'BR' },
  { dia: 2, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'RS' },
  { dia: 2, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'CC' },
  { dia: 3, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'LC' },
  { dia: 3, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'TC' },
  { dia: 3, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'NM' },
  { dia: 3, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'LM' },
  { dia: 3, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'RS' },
  { dia: 4, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'TC' },
  { dia: 4, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'LM' },
  { dia: 4, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'AD' },
  { dia: 5, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'JC' },
  { dia: 5, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'BR' },
  { dia: 5, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'AF' },
  { dia: 5, horaInici: '11:00:00', horaFi: '11:30:00', codi: 'LM' },
  
  { dia: 1, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'NM' },
  { dia: 1, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'RY' },
  { dia: 2, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'ML' },
  { dia: 2, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'CC' },
  { dia: 3, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'AF' },
  { dia: 3, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'TM' },
  { dia: 3, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'MC' },
  { dia: 3, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'R' },
  { dia: 3, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'PF' },
  { dia: 4, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'AD' },
  { dia: 4, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'MÇ' },
  { dia: 5, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'LM' },
  { dia: 5, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'TM' },
  { dia: 5, horaInici: '11:30:00', horaFi: '12:30:00', codi: 'MCY' },
  
  { dia: 1, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'BA' },
  { dia: 1, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'MF' },
  { dia: 1, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'AD' },
  { dia: 2, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'AD' },
  { dia: 2, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'MÇ' },
  { dia: 3, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'LM' },
  { dia: 3, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'TM' },
  { dia: 4, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'MF' },
  { dia: 4, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'AD' },
  { dia: 5, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'JM' },
  { dia: 5, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'MC' },
  { dia: 5, horaInici: '12:30:00', horaFi: '13:30:00', codi: 'MÇ' },
  
  { dia: 1, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'MF' },
  { dia: 2, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'LC' },
  { dia: 2, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'MÇ' },
  { dia: 3, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'BA' },
  { dia: 3, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'AP' },
  { dia: 4, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'RM' },
  { dia: 4, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'TM' },
  { dia: 5, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'TC' },
  { dia: 5, horaInici: '13:30:00', horaFi: '14:30:00', codi: 'MÇ' }
];

async function afegirGuardies() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciant proces d\'afegir guàrdies...');
    
    let guardiesAfegides = 0;
    let errors = 0;
    
    for (const guardia of guardiesData) {
      try {
        // Buscar el professor pel codi
        const professorResult = await client.query(
          'SELECT professor_id FROM professors WHERE codi = $1 AND any_academic_id = 2',
          [guardia.codi]
        );
        
        if (professorResult.rows.length === 0) {
          console.log(`⚠️  Professor amb codi ${guardia.codi} no trobat`);
          errors++;
          continue;
        }
        
        const professorId = professorResult.rows[0].professor_id;
        
        // Comprovar si ja existeix aquest horari de guàrdia
        const existingResult = await client.query(`
          SELECT horari_id FROM horaris 
          WHERE professor_id = $1 
            AND dia_setmana = $2 
            AND hora_inici = $3 
            AND hora_fi = $4 
            AND assignatura = 'G'
            AND any_academic_id = 2
        `, [professorId, guardia.dia, guardia.horaInici, guardia.horaFi]);
        
        if (existingResult.rows.length > 0) {
          console.log(`ℹ️  Guàrdia ja existeix: ${guardia.codi} - Dia ${guardia.dia}, ${guardia.horaInici}-${guardia.horaFi}`);
          continue;
        }
        
        // Afegir el nou horari de guàrdia
        await client.query(`
          INSERT INTO horaris (professor_id, dia_setmana, hora_inici, hora_fi, assignatura, any_academic_id)
          VALUES ($1, $2, $3, $4, 'G', 2)
        `, [professorId, guardia.dia, guardia.horaInici, guardia.horaFi]);
        
        console.log(`✅ Afegida guàrdia: ${guardia.codi} - Dia ${guardia.dia}, ${guardia.horaInici}-${guardia.horaFi}`);
        guardiesAfegides++;
        
      } catch (error) {
        console.error(`❌ Error afegint guàrdia ${guardia.codi}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n🎉 Procés completat:`);
    console.log(`   - Guàrdies afegides: ${guardiesAfegides}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Total processades: ${guardiesData.length}`);
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar el script
afegirGuardies().catch(console.error);