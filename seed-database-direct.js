// Script para poblar la base de datos directamente usando el sistema de storage
import { storage } from './server/storage.js';

// Datos reales del centro educativo extraídos del CSV
const profesores = [
  { nom: "Patricia", cognoms: "Fajardo", email: "patricia.fajardo@escola.cat", rol: "professor" },
  { nom: "Alba", cognoms: "Serqueda", email: "alba.serqueda@escola.cat", rol: "cap_departament" },
  { nom: "Marta", cognoms: "Fernàndez", email: "marta.fernandez@escola.cat", rol: "professor" },
  { nom: "Mar", cognoms: "Villar", email: "mar.villar@escola.cat", rol: "professor" },
  { nom: "Eva", cognoms: "Martin", email: "eva.martin@escola.cat", rol: "professor" },
  { nom: "Joan", cognoms: "Marí", email: "joan.mari@escola.cat", rol: "professor" },
  { nom: "Julia", cognoms: "Coll", email: "julia.coll@escola.cat", rol: "professor" },
  { nom: "Roger", cognoms: "Sabartes", email: "roger.sabartes@escola.cat", rol: "cap_departament" },
  { nom: "Maria", cognoms: "Creus", email: "maria.creus@escola.cat", rol: "tutor" },
  { nom: "Liliana", cognoms: "Perea", email: "liliana.perea@escola.cat", rol: "professor" },
  { nom: "JC", cognoms: "Tinoco", email: "jc.tinoco@escola.cat", rol: "professor" },
  { nom: "Toni", cognoms: "Motos", email: "toni.motos@escola.cat", rol: "professor" },
  { nom: "Teresa", cognoms: "Caralto", email: "teresa.caralto@escola.cat", rol: "professor" },
  { nom: "Albert", cognoms: "Parrilla", email: "albert.parrilla@escola.cat", rol: "professor" },
  { nom: "Noe", cognoms: "Muñoz", email: "noe.munoz@escola.cat", rol: "professor" },
  { nom: "Albert", cognoms: "Freixenet", email: "albert.freixenet@escola.cat", rol: "professor" },
  { nom: "Itziar", cognoms: "Fuentes", email: "itziar.fuentes@escola.cat", rol: "professor" },
  { nom: "Berta", cognoms: "Riera", email: "berta.riera@escola.cat", rol: "professor" },
  { nom: "Laura", cognoms: "Manchado", email: "laura.manchado@escola.cat", rol: "professor" },
  { nom: "Luis", cognoms: "Cabrera", email: "luis.cabrera@escola.cat", rol: "professor" },
  { nom: "Benet", cognoms: "Andujar", email: "benet.andujar@escola.cat", rol: "cap_departament" },
  { nom: "Dani", cognoms: "Palau", email: "dani.palau@escola.cat", rol: "professor" },
  { nom: "Inmaculada", cognoms: "Murillo", email: "inmaculada.murillo@escola.cat", rol: "professor" },
  { nom: "Mireia", cognoms: "Vendrell", email: "mireia.vendrell@escola.cat", rol: "professor" },
  { nom: "Maria J.", cognoms: "Romero", email: "mariaj.romero@escola.cat", rol: "professor" },
  { nom: "Marta", cognoms: "Lopez", email: "marta.lopez@escola.cat", rol: "professor" },
  { nom: "Xavier", cognoms: "Reyes", email: "xavier.reyes@escola.cat", rol: "professor" },
  { nom: "Elvira", cognoms: "Parra", email: "elvira.parra@escola.cat", rol: "professor" }
];

const grupos = [
  { nom: "1r ESO A", curs: "1r", nivell: "ESO" },
  { nom: "1r ESO B", curs: "1r", nivell: "ESO" },
  { nom: "1r ESO C", curs: "1r", nivell: "ESO" },
  { nom: "2n ESO A", curs: "2n", nivell: "ESO" },
  { nom: "2n ESO B", curs: "2n", nivell: "ESO" },
  { nom: "2n ESO C", curs: "2n", nivell: "ESO" },
  { nom: "3r ESO A", curs: "3r", nivell: "ESO" },
  { nom: "3r ESO B", curs: "3r", nivell: "ESO" },
  { nom: "3r ESO C", curs: "3r", nivell: "ESO" },
  { nom: "4t ESO A", curs: "4t", nivell: "ESO" },
  { nom: "4t ESO B", curs: "4t", nivell: "ESO" },
  { nom: "4t ESO C", curs: "4t", nivell: "ESO" },
  { nom: "4t ESO D", curs: "4t", nivell: "ESO" }
];

const aulas = [
  { nom: "Aula 101", planta: "1", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 102", planta: "1", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 103", planta: "1", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 104", planta: "1", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 105", planta: "1", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 201", planta: "2", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 202", planta: "2", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 203", planta: "2", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 204", planta: "2", capacitat: 30, tipus: "Normal" },
  { nom: "Aula 205", planta: "2", capacitat: 30, tipus: "Normal" },
  { nom: "Lab. Ciències", planta: "1", capacitat: 24, tipus: "Laboratori" },
  { nom: "Aula Informàtica 1", planta: "2", capacitat: 20, tipus: "Informàtica" },
  { nom: "Aula Informàtica 2", planta: "2", capacitat: 20, tipus: "Informàtica" },
  { nom: "Aula de Música", planta: "0", capacitat: 25, tipus: "Especial" },
  { nom: "Gimnàs", planta: "0", capacitat: 50, tipus: "Esports" },
  { nom: "Biblioteca", planta: "1", capacitat: 40, tipus: "Estudi" },
  { nom: "Sala Audiovisuals", planta: "1", capacitat: 35, tipus: "Audiovisual" }
];

const guardias = [
  { data: "2025-06-02", horaInici: "10:00", horaFi: "10:30", lloc: "Pati", tipusGuardia: "Pati", estat: "planificada" },
  { data: "2025-06-02", horaInici: "12:30", horaFi: "13:30", lloc: "Passadís 1r pis", tipusGuardia: "Passadís", estat: "planificada" },
  { data: "2025-06-03", horaInici: "09:00", horaFi: "10:00", lloc: "Biblioteca", tipusGuardia: "Biblioteca", estat: "planificada" },
  { data: "2025-06-03", horaInici: "10:00", horaFi: "10:30", lloc: "Pati", tipusGuardia: "Pati", estat: "planificada" },
  { data: "2025-06-04", horaInici: "08:00", horaFi: "09:00", lloc: "Entrada", tipusGuardia: "Entrada", estat: "planificada" },
  { data: "2025-06-04", horaInici: "10:00", horaFi: "10:30", lloc: "Pati", tipusGuardia: "Pati", estat: "planificada" },
  { data: "2025-06-05", horaInici: "11:30", horaFi: "12:30", lloc: "Passadís 2n pis", tipusGuardia: "Passadís", estat: "planificada" },
  { data: "2025-06-05", horaInici: "10:00", horaFi: "10:30", lloc: "Pati", tipusGuardia: "Pati", estat: "planificada" },
  { data: "2025-06-06", horaInici: "13:30", horaFi: "14:30", lloc: "Cantina", tipusGuardia: "Cantina", estat: "planificada" },
  { data: "2025-06-06", horaInici: "10:00", horaFi: "10:30", lloc: "Pati", tipusGuardia: "Pati", estat: "planificada" }
];

const sortidas = [
  {
    nom: "Visita al Museu de Ciències",
    descripcio: "Visita educativa al Museu de Ciències de Barcelona per als alumnes de 3r ESO A",
    dataInici: "2025-06-03",
    dataFi: "2025-06-03",
    horaInici: "09:00",
    horaFi: "16:00",
    lloc: "Museu de Ciències - Barcelona",
    estat: "planificada",
    observacions: "Transport en autocar. Dinar inclòs. Professor responsable: Benet Andujar"
  },
  {
    nom: "Teatre en Anglès",
    descripcio: "Assistència a una obra de teatre en anglès per 4t ESO",
    dataInici: "2025-06-05",
    dataFi: "2025-06-05",
    horaInici: "10:00",
    horaFi: "13:00",
    lloc: "Teatre Principal",
    estat: "confirmada",
    observacions: "Obra adaptada al nivell d'anglès dels alumnes. Professor responsable: Eva Martin"
  }
];

async function populateDatabase() {
  console.log('🏫 Iniciando población directa de la base de datos...\n');

  try {
    // 1. Crear profesores
    console.log('👨‍🏫 Creando profesores...');
    const profesoresCreados = [];
    for (const profesor of profesores) {
      try {
        const professorData = {
          ...profesor,
          passwordHash: null // No password needed for direct insert
        };
        const response = await storage.createProfessor(professorData);
        profesoresCreados.push(response);
        console.log(`✓ ${profesor.nom} ${profesor.cognoms} - ${profesor.rol}`);
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          console.log(`- Ya existe: ${profesor.nom} ${profesor.cognoms}`);
        } else {
          console.log(`✗ Error: ${profesor.nom} - ${error.message}`);
        }
      }
    }

    // 2. Crear grupos
    console.log('\n📚 Creando grupos...');
    const gruposCreados = [];
    for (const grupo of grupos) {
      try {
        const response = await storage.createGrup(grupo);
        gruposCreados.push(response);
        console.log(`✓ ${grupo.nom} - ${grupo.nivell}`);
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          console.log(`- Ya existe: ${grupo.nom}`);
        } else {
          console.log(`✗ Error: ${grupo.nom} - ${error.message}`);
        }
      }
    }

    // 3. Crear aulas
    console.log('\n🏛️ Creando aulas...');
    const aulasCreadas = [];
    for (const aula of aulas) {
      try {
        const response = await storage.createAula(aula);
        aulasCreadas.push(response);
        console.log(`✓ ${aula.nom} - ${aula.tipus} (${aula.capacitat} places)`);
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          console.log(`- Ya existe: ${aula.nom}`);
        } else {
          console.log(`✗ Error: ${aula.nom} - ${error.message}`);
        }
      }
    }

    // 4. Crear guardias
    console.log('\n🛡️ Creando guardias...');
    const guardiasCreadas = [];
    for (const guardia of guardias) {
      try {
        const response = await storage.createGuardia(guardia);
        guardiasCreadas.push(response);
        console.log(`✓ ${guardia.data} ${guardia.horaInici}-${guardia.horaFi} - ${guardia.tipusGuardia}`);
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          console.log(`- Ya existe: ${guardia.data} ${guardia.horaInici}`);
        } else {
          console.log(`✗ Error guardia: ${error.message}`);
        }
      }
    }

    // 5. Crear sortidas
    console.log('\n🚌 Creando sortidas...');
    const sortidasCreadas = [];
    for (const sortida of sortidas) {
      try {
        const response = await storage.createSortida(sortida);
        sortidasCreadas.push(response);
        console.log(`✓ ${sortida.nom} - ${sortida.dataInici}`);
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          console.log(`- Ya existe: ${sortida.nom}`);
        } else {
          console.log(`✗ Error: ${sortida.nom} - ${error.message}`);
        }
      }
    }

    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   • ${profesoresCreados.length} profesores creados`);
    console.log(`   • ${gruposCreados.length} grupos creados`);
    console.log(`   • ${aulasCreadas.length} aulas creadas`);
    console.log(`   • ${guardiasCreadas.length} guardias creadas`);
    console.log(`   • ${sortidasCreadas.length} sortidas creadas`);
    
    console.log('\n✨ El sistema está listo para:');
    console.log('   1. Asignación automática de guardias');
    console.log('   2. Gestión de horarios escolares');
    console.log('   3. Análisis de carga de trabajo');
    console.log('   4. Comunicaciones del centro');

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase().then(() => process.exit(0));
}

export { populateDatabase };