import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.ts';
import { readFileSync } from 'fs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Function to parse CSV data
function parseCSV(filename) {
  try {
    const content = readFileSync(filename, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || null;
      });
      return obj;
    });
  } catch (error) {
    console.log(`File ${filename} not found, skipping...`);
    return [];
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Insert professors
    const professorsData = parseCSV('professors.csv');
    if (professorsData.length > 0) {
      console.log(`Inserting ${professorsData.length} professors...`);
      for (const prof of professorsData) {
        try {
          await db.insert(schema.professors).values({
            nom: prof.nom,
            cognoms: prof.cognoms,
            email: prof.email,
            telefon: prof.telefon,
            departament: prof.departament,
            carrec: prof.carrec
          });
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`Error inserting professor ${prof.nom}:`, error.message);
          }
        }
      }
      console.log('✓ Professors inserted');
    }

    // Insert groups
    const grupsData = parseCSV('grups.csv');
    if (grupsData.length > 0) {
      console.log(`Inserting ${grupsData.length} groups...`);
      for (const grup of grupsData) {
        try {
          await db.insert(schema.grups).values({
            nom: grup.nom,
            curs: grup.curs,
            nivell: grup.nivell,
            alumnesCount: parseInt(grup.alumnesCount) || 0
          });
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`Error inserting group ${grup.nom}:`, error.message);
          }
        }
      }
      console.log('✓ Groups inserted');
    }

    // Insert classrooms
    const aulesData = parseCSV('aules.csv');
    if (aulesData.length > 0) {
      console.log(`Inserting ${aulesData.length} classrooms...`);
      for (const aula of aulesData) {
        try {
          await db.insert(schema.aules).values({
            nom: aula.nom,
            planta: aula.planta,
            capacitat: parseInt(aula.capacitat) || 0,
            tipus: aula.tipus
          });
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`Error inserting classroom ${aula.nom}:`, error.message);
          }
        }
      }
      console.log('✓ Classrooms inserted');
    }

    // Insert guards
    const guardiesData = parseCSV('guardies.csv');
    if (guardiesData.length > 0) {
      console.log(`Inserting ${guardiesData.length} guards...`);
      for (const guardia of guardiesData) {
        try {
          await db.insert(schema.guardies).values({
            data: guardia.data,
            horaInici: guardia.horaInici,
            horaFi: guardia.horaFi,
            lloc: guardia.lloc,
            tipusGuardia: guardia.tipusGuardia,
            estat: guardia.estat || 'planificada',
            observacions: guardia.observacions
          });
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`Error inserting guard:`, error.message);
          }
        }
      }
      console.log('✓ Guards inserted');
    }

    // Insert outings
    const sortidesData = parseCSV('sortides.csv');
    if (sortidesData.length > 0) {
      console.log(`Inserting ${sortidesData.length} outings...`);
      for (const sortida of sortidesData) {
        try {
          await db.insert(schema.sortides).values({
            nom: sortida.nom,
            descripcio: sortida.descripcio,
            dataInici: sortida.dataInici,
            dataFi: sortida.dataFi,
            horaInici: sortida.horaInici,
            horaFi: sortida.horaFi,
            lloc: sortida.lloc,
            grupId: parseInt(sortida.grupId) || null,
            professorResponsable: parseInt(sortida.professorResponsable) || null,
            estat: sortida.estat || 'planificada',
            observacions: sortida.observacions
          });
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`Error inserting outing ${sortida.nom}:`, error.message);
          }
        }
      }
      console.log('✓ Outings inserted');
    }

    // Insert sample schedules with real data
    const professorsList = await db.select().from(schema.professors);
    const grupsList = await db.select().from(schema.grups);
    const aulesList = await db.select().from(schema.aules);

    if (professorsList.length > 0 && grupsList.length > 0 && aulesList.length > 0) {
      console.log('Inserting sample schedules based on real assignments...');
      
      // Real assignments from the CSV
      const realAssignments = [
        { subject: "CAST", group: "1r ESO A", professor: "Patricia Fajardo" },
        { subject: "CAT", group: "1r ESO A", professor: "Alba Serqueda" },
        { subject: "MAT", group: "1r ESO A", professor: "Mar Villar" },
        { subject: "ANG", group: "1r ESO A", professor: "Eva Martin" },
        { subject: "EF", group: "1r ESO A", professor: "Julia Coll" },
        { subject: "MUS", group: "1r ESO A", professor: "Roger Sabartes" },
        { subject: "CAST", group: "2n ESO A", professor: "Patricia Fajardo" },
        { subject: "MAT", group: "2n ESO A", professor: "Toni Motos" },
        { subject: "ANG", group: "2n ESO A", professor: "Eva Martin" },
        { subject: "CAST", group: "3r ESO A", professor: "Itziar Fuentes" },
        { subject: "MAT", group: "3r ESO A", professor: "Toni Motos" },
        { subject: "ANG", group: "3r ESO A", professor: "Joan Marí" }
      ];

      const days = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];
      const hours = [
        { start: "08:00", end: "09:00" },
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
        { start: "11:30", end: "12:30" },
        { start: "12:30", end: "13:30" }
      ];

      for (const assignment of realAssignments) {
        const professor = professorsList.find(p => 
          `${p.nom} ${p.cognoms}` === assignment.professor
        );
        const group = grupsList.find(g => g.nom === assignment.group);
        const classroom = aulesList[Math.floor(Math.random() * aulesList.length)];

        if (professor && group && classroom) {
          try {
            const randomDay = days[Math.floor(Math.random() * days.length)];
            const randomHour = hours[Math.floor(Math.random() * hours.length)];

            await db.insert(schema.horaris).values({
              professorId: professor.id,
              grupId: group.id,
              aulaId: classroom.id,
              diaSetmana: randomDay,
              horaInici: randomHour.start,
              horaFi: randomHour.end,
              assignatura: assignment.subject
            });
          } catch (error) {
            if (!error.message.includes('duplicate key')) {
              console.error(`Error inserting schedule:`, error.message);
            }
          }
        }
      }
      console.log('✓ Sample schedules inserted');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Data summary:');
    console.log(`- ${professorsData.length} professors from your school`);
    console.log(`- ${grupsData.length} groups (ESO classes)`);
    console.log(`- ${aulesData.length} classrooms and facilities`);
    console.log(`- ${guardiesData.length} guard shifts`);
    console.log(`- ${sortidesData.length} educational outings`);
    console.log('- Sample schedules based on real assignments');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();