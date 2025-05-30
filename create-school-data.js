// Script para crear todos los datos del centro educativo directamente en la base de datos
import { db } from './server/db.js';
import { professors, grups, aules, guardies, sortides, horaris } from './shared/schema.js';

// Datos reales del CSV del centro
const profesoresData = [
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

const grupsData = [
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

const aulesData = [
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

const guardiesData = [
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

const sortidesData = [
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

// Función para crear horarios con guardias (G indica disponibilidad para guardia)
function createHorarios(professorId, professorNom) {
  const dies = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
  const hores = [
    { hora: '08:00-09:00', periodo: 1 },
    { hora: '09:00-10:00', periodo: 2 },
    { hora: '10:00-10:30', periodo: 'esplai' },
    { hora: '10:30-11:30', periodo: 3 },
    { hora: '11:30-12:30', periodo: 4 },
    { hora: '12:30-13:30', periodo: 5 },
    { hora: '13:30-14:30', periodo: 6 }
  ];

  const horarios = [];
  
  // Patrones de horarios según el tipo de profesor
  const patrones = {
    'cap_departament': [
      // Lunes
      { dia: 'Dilluns', hora: '08:00-09:00', activitat: 'Matemàtiques', grup: '1r ESO A', aula: 'Aula 101' },
      { dia: 'Dilluns', hora: '09:00-10:00', activitat: 'Matemàtiques', grup: '2n ESO A', aula: 'Aula 102' },
      { dia: 'Dilluns', hora: '10:00-10:30', activitat: 'G', grup: null, aula: 'Pati' },
      { dia: 'Dilluns', hora: '10:30-11:30', activitat: 'Matemàtiques', grup: '3r ESO A', aula: 'Aula 103' },
      { dia: 'Dilluns', hora: '11:30-12:30', activitat: 'Reunió Departament', grup: null, aula: 'Sala Reunions' },
      { dia: 'Dilluns', hora: '12:30-13:30', activitat: 'G', grup: null, aula: 'Passadís 1r pis' },
      { dia: 'Dilluns', hora: '13:30-14:30', activitat: 'Matemàtiques', grup: '4t ESO A', aula: 'Aula 104' },
      // Martes
      { dia: 'Dimarts', hora: '08:00-09:00', activitat: 'G', grup: null, aula: 'Entrada' },
      { dia: 'Dimarts', hora: '09:00-10:00', activitat: 'Matemàtiques', grup: '1r ESO B', aula: 'Aula 105' },
      { dia: 'Dimarts', hora: '10:00-10:30', activitat: 'G', grup: null, aula: 'Pati' },
      { dia: 'Dimarts', hora: '10:30-11:30', activitat: 'Matemàtiques', grup: '2n ESO B', aula: 'Aula 201' },
      { dia: 'Dimarts', hora: '11:30-12:30', activitat: 'Matemàtiques', grup: '3r ESO B', aula: 'Aula 202' },
      { dia: 'Dimarts', hora: '12:30-13:30', activitat: 'Matemàtiques', grup: '4t ESO B', aula: 'Aula 203' },
      { dia: 'Dimarts', hora: '13:30-14:30', activitat: 'G', grup: null, aula: 'Cantina' }
    ],
    'professor': [
      // Lunes
      { dia: 'Dilluns', hora: '08:00-09:00', activitat: 'Classe', grup: '1r ESO A', aula: 'Aula 101' },
      { dia: 'Dilluns', hora: '09:00-10:00', activitat: 'Classe', grup: '2n ESO A', aula: 'Aula 102' },
      { dia: 'Dilluns', hora: '10:00-10:30', activitat: 'G', grup: null, aula: 'Pati' },
      { dia: 'Dilluns', hora: '10:30-11:30', activitat: 'Classe', grup: '3r ESO A', aula: 'Aula 103' },
      { dia: 'Dilluns', hora: '11:30-12:30', activitat: 'Classe', grup: '4t ESO A', aula: 'Aula 104' },
      { dia: 'Dilluns', hora: '12:30-13:30', activitat: 'G', grup: null, aula: 'Passadís 1r pis' },
      { dia: 'Dilluns', hora: '13:30-14:30', activitat: 'Classe', grup: '1r ESO B', aula: 'Aula 105' },
      // Martes
      { dia: 'Dimarts', hora: '08:00-09:00', activitat: 'Classe', grup: '2n ESO B', aula: 'Aula 201' },
      { dia: 'Dimarts', hora: '09:00-10:00', activitat: 'G', grup: null, aula: 'Biblioteca' },
      { dia: 'Dimarts', hora: '10:00-10:30', activitat: 'G', grup: null, aula: 'Pati' },
      { dia: 'Dimarts', hora: '10:30-11:30', activitat: 'Classe', grup: '3r ESO B', aula: 'Aula 202' },
      { dia: 'Dimarts', hora: '11:30-12:30', activitat: 'Classe', grup: '4t ESO B', aula: 'Aula 203' },
      { dia: 'Dimarts', hora: '12:30-13:30', activitat: 'Classe', grup: '1r ESO C', aula: 'Aula 204' },
      { dia: 'Dimarts', hora: '13:30-14:30', activitat: 'G', grup: null, aula: 'Cantina' }
    ],
    'tutor': [
      // Lunes
      { dia: 'Dilluns', hora: '08:00-09:00', activitat: 'Tutoria', grup: '1r ESO A', aula: 'Aula 101' },
      { dia: 'Dilluns', hora: '09:00-10:00', activitat: 'Classe', grup: '2n ESO A', aula: 'Aula 102' },
      { dia: 'Dilluns', hora: '10:00-10:30', activitat: 'G', grup: null, aula: 'Pati' },
      { dia: 'Dilluns', hora: '10:30-11:30', activitat: 'Tutoria', grup: '1r ESO A', aula: 'Aula 101' },
      { dia: 'Dilluns', hora: '11:30-12:30', activitat: 'G', grup: null, aula: 'Passadís 2n pis' },
      { dia: 'Dilluns', hora: '12:30-13:30', activitat: 'Reunió Tutors', grup: null, aula: 'Sala Reunions' },
      { dia: 'Dilluns', hora: '13:30-14:30', activitat: 'Classe', grup: '3r ESO A', aula: 'Aula 103' }
    ]
  };

  // Asignar patrón según el rol del profesor
  let patron = patrones.professor; // Por defecto
  if (professorNom.includes('cap_departament')) {
    patron = patrones.cap_departament;
  } else if (professorNom.includes('tutor')) {
    patron = patrones.tutor;
  }

  return patron.map(h => ({
    professorId,
    grupId: h.grup ? Math.floor(Math.random() * 13) + 1 : null, // ID aleatorio de grupo
    aulaId: Math.floor(Math.random() * 17) + 1, // ID aleatorio de aula
    diaSemana: h.dia,
    horaInici: h.hora.split('-')[0],
    horaFi: h.hora.split('-')[1],
    assignatura: h.activitat,
    observacions: h.activitat === 'G' ? 'Disponible per guardia' : null
  }));
}

async function createSchoolData() {
  console.log('🏫 Creando datos completos del centro educativo...\n');

  try {
    // 1. Crear profesores
    console.log('👨‍🏫 Insertando profesores...');
    const profesoresCreados = await db.insert(professors).values(profesoresData).returning();
    console.log(`✓ ${profesoresCreados.length} profesores creados`);

    // 2. Crear grupos
    console.log('\n📚 Insertando grupos...');
    const gruposCreados = await db.insert(grups).values(grupsData).returning();
    console.log(`✓ ${gruposCreados.length} grupos creados`);

    // 3. Crear aulas
    console.log('\n🏛️ Insertando aulas...');
    const aulasCreadas = await db.insert(aules).values(aulesData).returning();
    console.log(`✓ ${aulasCreadas.length} aulas creadas`);

    // 4. Crear guardias
    console.log('\n🛡️ Insertando guardias...');
    const guardiasCreadas = await db.insert(guardies).values(guardiesData).returning();
    console.log(`✓ ${guardiasCreadas.length} guardias creadas`);

    // 5. Crear sortidas
    console.log('\n🚌 Insertando sortidas...');
    const sortidasCreadas = await db.insert(sortides).values(sortidesData).returning();
    console.log(`✓ ${sortidasCreadas.length} sortidas creadas`);

    // 6. Crear horarios para cada profesor (con G para guardias)
    console.log('\n📅 Creando horarios de profesores...');
    let totalHorarios = 0;
    for (const profesor of profesoresCreados) {
      const horariosProfesor = createHorarios(profesor.id, `${profesor.nom} ${profesor.cognoms} - ${profesor.rol}`);
      await db.insert(horaris).values(horariosProfesor);
      totalHorarios += horariosProfesor.length;
      console.log(`✓ ${profesor.nom} ${profesor.cognoms}: ${horariosProfesor.length} franjas horarias`);
    }

    console.log('\n🎉 ¡Datos creados exitosamente!');
    console.log(`📊 Resumen final:`);
    console.log(`   • ${profesoresCreados.length} profesores`);
    console.log(`   • ${gruposCreados.length} grupos`);
    console.log(`   • ${aulasCreadas.length} aulas`);
    console.log(`   • ${guardiasCreadas.length} guardias planificadas`);
    console.log(`   • ${sortidasCreadas.length} sortidas programadas`);
    console.log(`   • ${totalHorarios} franjas horarias asignadas`);
    
    console.log('\n✨ Sistema listo para:');
    console.log('   → Asignación automática de guardias');
    console.log('   → Análisis de disponibilidad de profesores');
    console.log('   → Gestión de equilibrio de carga');
    console.log('   → Comunicaciones y tareas');

    return {
      profesores: profesoresCreados,
      grupos: gruposCreados,
      aulas: aulasCreadas,
      guardias: guardiasCreadas,
      sortidas: sortidasCreadas,
      totalHorarios
    };

  } catch (error) {
    console.error('❌ Error creando datos:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSchoolData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { createSchoolData };