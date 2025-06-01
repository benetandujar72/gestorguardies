import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configuració de la connexió
const neonConfig = { webSocketConstructor: ws };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTestData() {
  console.log('🔄 Creant dades de prova per testejar funcionalitat de guardies...');

  try {
    // 1. Obtenir any acadèmic actiu
    const anyAcademicResult = await pool.query(
      'SELECT id FROM anys_academics WHERE nom = $1',
      ['2025-2026']
    );
    
    if (anyAcademicResult.rows.length === 0) {
      throw new Error('No s\'ha trobat l\'any acadèmic 2025-2026');
    }
    
    const anyAcademicId = anyAcademicResult.rows[0].id;
    console.log(`✅ Any acadèmic actiu: ${anyAcademicId}`);

    // 2. Crear guardies per la setmana vinent
    const guardies = [
      {
        data: '2025-06-02', // dilluns
        horaInici: '08:00',
        horaFi: '09:00',
        tipusGuardia: 'aula',
        estat: 'pendent',
        lloc: 'Aula A1'
      },
      {
        data: '2025-06-02',
        horaInici: '11:00',
        horaFi: '11:30',
        tipusGuardia: 'pati',
        estat: 'pendent',
        lloc: 'Pati central'
      },
      {
        data: '2025-06-03', // dimarts
        horaInici: '09:00',
        horaFi: '10:00',
        tipusGuardia: 'biblioteca',
        estat: 'pendent',
        lloc: 'Biblioteca'
      },
      {
        data: '2025-06-03',
        horaInici: '12:30',
        horaFi: '13:30',
        tipusGuardia: 'aula',
        estat: 'pendent',
        lloc: 'Aula B2'
      },
      {
        data: '2025-06-04', // dimecres
        horaInici: '10:00',
        horaFi: '11:00',
        tipusGuardia: 'aula',
        estat: 'pendent',
        lloc: 'Aula C3'
      },
      {
        data: '2025-06-05', // dijous
        horaInici: '11:30',
        horaFi: '12:30',
        tipusGuardia: 'laboratori',
        estat: 'pendent',
        lloc: 'Laboratori informàtica'
      }
    ];

    console.log('📅 Creant guardies...');
    for (const guardia of guardies) {
      await pool.query(
        `INSERT INTO guardies (any_academic_id, data, hora_inici, hora_fi, tipus_guardia, estat, lloc) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [anyAcademicId, guardia.data, guardia.horaInici, guardia.horaFi, 
         guardia.tipusGuardia, guardia.estat, guardia.lloc]
      );
    }
    console.log(`✅ Creades ${guardies.length} guardies`);

    // 3. Crear sortides amb professors acompanyants i horaris que generin conflictes
    console.log('🎒 Creant sortides amb professors acompanyants...');
    
    // Obtenir professors
    const professorsResult = await pool.query(
      'SELECT id, nom, cognoms FROM professors WHERE any_academic_id = $1 LIMIT 5',
      [anyAcademicId]
    );
    
    if (professorsResult.rows.length < 3) {
      throw new Error('No hi ha prou professors per crear les sortides de prova');
    }

    const professors = professorsResult.rows;
    console.log(`👨‍🏫 Professors disponibles: ${professors.length}`);

    // Obtenir grups
    const grupsResult = await pool.query(
      'SELECT id, nom_grup FROM grups WHERE any_academic_id = $1 LIMIT 3',
      [anyAcademicId]
    );

    if (grupsResult.rows.length < 3) {
      throw new Error('No hi ha prou grups per crear les sortides de prova');
    }

    const grups = grupsResult.rows;

    const sortides = [
      {
        nomSortida: 'Visita al Museu de Ciències',
        dataInici: '2025-06-02 09:00:00',
        dataFi: '2025-06-02 13:00:00',
        grupId: grups[0].id,
        descripcio: 'Sortida educativa al museu de ciències naturals',
        lloc: 'Museu de Ciències Naturals de Barcelona',
        responsableId: professors[0].id
      },
      {
        nomSortida: 'Excursió al Parc Natural',
        dataInici: '2025-06-03 08:30:00',
        dataFi: '2025-06-03 15:00:00',
        grupId: grups[1].id,
        descripcio: 'Activitat de medi ambient al parc natural',
        lloc: 'Parc Natural del Montseny',
        responsableId: professors[1].id
      },
      {
        nomSortida: 'Teatre en anglès',
        dataInici: '2025-06-04 10:00:00',
        dataFi: '2025-06-04 12:00:00',
        grupId: grups[2].id,
        descripcio: 'Representació teatral en anglès',
        lloc: 'Teatre Principal',
        responsableId: professors[2].id
      }
    ];

    for (let i = 0; i < sortides.length; i++) {
      const sortida = sortides[i];
      
      // Crear sortida
      const sortidaResult = await pool.query(
        `INSERT INTO sortides (any_academic_id, nom_sortida, data_inici, data_fi, grup_id, descripcio, lloc, responsable_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [anyAcademicId, sortida.nomSortida, sortida.dataInici, sortida.dataFi, 
         sortida.grupId, sortida.descripcio, sortida.lloc, sortida.responsableId]
      );
      
      const sortidaId = sortidaResult.rows[0].id;
      
      // Assignar professor responsable com acompanyant
      await pool.query(
        `INSERT INTO sortida_professors (any_academic_id, sortida_id, professor_id, tipus) 
         VALUES ($1, $2, $3, $4)`,
        [anyAcademicId, sortidaId, sortida.responsableId, 'responsable']
      );
      
      // Afegir un professor acompanyant addicional
      if (professors[i + 1]) {
        await pool.query(
          `INSERT INTO sortida_professors (any_academic_id, sortida_id, professor_id, tipus) 
           VALUES ($1, $2, $3, $4)`,
          [anyAcademicId, sortidaId, professors[i + 1].id, 'acompanyant']
        );
      }
      
      console.log(`✅ Sortida creada: ${sortida.nomSortida} (ID: ${sortidaId})`);
    }

    // 4. Crear horaris per als professors acompanyants que generin conflictes
    console.log('📚 Creant horaris amb conflictes per professors acompanyants...');
    
    // Obtenir aules i matèries
    const aulesResult = await pool.query(
      'SELECT id FROM aules WHERE any_academic_id = $1 LIMIT 3',
      [anyAcademicId]
    );
    
    const materiesResult = await pool.query(
      'SELECT id FROM materies WHERE any_academic_id = $1 LIMIT 3',
      [anyAcademicId]
    );

    if (aulesResult.rows.length > 0 && materiesResult.rows.length > 0) {
      const horaris = [
        // Professor 0 - dilluns 9:00-10:00 (conflicte amb sortida)
        {
          professorId: professors[0].id,
          grupId: grups[0].id,
          aulaId: aulesResult.rows[0].id,
          materiaId: materiesResult.rows[0].id,
          diaSetmana: 1, // dilluns
          horaInici: '09:00',
          horaFi: '10:00',
          assignatura: 'Matemàtiques'
        },
        // Professor 1 - dimarts 10:00-11:00 (conflicte amb sortida)
        {
          professorId: professors[1].id,
          grupId: grups[1].id,
          aulaId: aulesResult.rows[1].id,
          materiaId: materiesResult.rows[1].id,
          diaSetmana: 2, // dimarts
          horaInici: '10:00',
          horaFi: '11:00',
          assignatura: 'Ciències Naturals'
        },
        // Professor 2 - dimecres 10:30-11:30 (conflicte amb sortida)
        {
          professorId: professors[2].id,
          grupId: grups[2].id,
          aulaId: aulesResult.rows[2].id,
          materiaId: materiesResult.rows[2].id,
          diaSetmana: 3, // dimecres
          horaInici: '10:30',
          horaFi: '11:30',
          assignatura: 'Anglès'
        }
      ];

      for (const horari of horaris) {
        await pool.query(
          `INSERT INTO horaris (any_academic_id, professor_id, grup_id, aula_id, materia_id, dia_setmana, hora_inici, hora_fi, assignatura) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [anyAcademicId, horari.professorId, horari.grupId, horari.aulaId, 
           horari.materiaId, horari.diaSetmana, horari.horaInici, horari.horaFi, horari.assignatura]
        );
      }
      
      console.log(`✅ Creats ${horaris.length} horaris amb conflictes`);
    }

    // 5. Crear alguns horaris amb assignatura "G" (guardies)
    console.log('🛡️ Creant guardies en horaris...');
    
    const guardiesHoraris = [
      {
        professorId: professors[3]?.id || professors[0].id,
        diaSetmana: 1, // dilluns
        horaInici: '11:00',
        horaFi: '11:30',
        assignatura: 'G'
      },
      {
        professorId: professors[4]?.id || professors[1].id,
        diaSetmana: 2, // dimarts
        horaInici: '12:30',
        horaFi: '13:30',
        assignatura: 'G'
      }
    ];

    for (const guardiaHorari of guardiesHoraris) {
      await pool.query(
        `INSERT INTO horaris (any_academic_id, professor_id, dia_setmana, hora_inici, hora_fi, assignatura) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [anyAcademicId, guardiaHorari.professorId, guardiaHorari.diaSetmana, 
         guardiaHorari.horaInici, guardiaHorari.horaFi, guardiaHorari.assignatura]
      );
    }

    console.log(`✅ Creades ${guardiesHoraris.length} guardies en horaris`);

    // 6. Estadístiques finals
    console.log('\n📊 RESUM DE DADES CREADES:');
    
    const statsGuardies = await pool.query(
      'SELECT COUNT(*) as total, estat FROM guardies WHERE any_academic_id = $1 GROUP BY estat',
      [anyAcademicId]
    );
    
    const statsSortides = await pool.query(
      'SELECT COUNT(*) as total FROM sortides WHERE any_academic_id = $1',
      [anyAcademicId]
    );
    
    const statsHoraris = await pool.query(
      'SELECT COUNT(*) as total, assignatura FROM horaris WHERE any_academic_id = $1 GROUP BY assignatura ORDER BY assignatura',
      [anyAcademicId]
    );

    console.log(`📅 Guardies: ${statsGuardies.rows.map(r => `${r.total} ${r.estat}`).join(', ')}`);
    console.log(`🎒 Sortides: ${statsSortides.rows[0].total}`);
    console.log(`📚 Horaris: ${statsHoraris.rows.map(r => `${r.total} ${r.assignatura || 'matèries'}`).join(', ')}`);

    console.log('\n🎯 FUNCIONALITATS A TESTEJAR:');
    console.log('1. Assignació automàtica de guardies');
    console.log('2. Gestió de substitucions per sortides');
    console.log('3. Calendari de guardies');
    console.log('4. Sistema de comunicacions');
    console.log('5. Anàlisi de càrrega de treball');

  } catch (error) {
    console.error('❌ Error creant dades de prova:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar creació de dades
createTestData()
  .then(() => {
    console.log('\n✅ Dades de prova creades correctament!');
    console.log('Ara pots testejar tota la funcionalitat de guardies i substitucions.');
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });