// Script per generar dades de prova basades en les dades reals proporcionades
import { writeFileSync } from 'fs';

// Professors extrets del CSV real
const professors = [
  { nom: "Patricia", cognoms: "Fajardo", email: "patricia.fajardo@escola.cat", telefon: "123456789", departament: "Castellà", carrec: "Professor" },
  { nom: "Alba", cognoms: "Serqueda", email: "alba.serqueda@escola.cat", telefon: "123456790", departament: "Català", carrec: "Cap de departament" },
  { nom: "Marta", cognoms: "Fernàndez", email: "marta.fernandez@escola.cat", telefon: "123456791", departament: "Aplicades", carrec: "Professor" },
  { nom: "Mar", cognoms: "Villar", email: "mar.villar@escola.cat", telefon: "123456792", departament: "Matemàtiques", carrec: "Professor" },
  { nom: "Eva", cognoms: "Martin", email: "eva.martin@escola.cat", telefon: "123456793", departament: "Anglès", carrec: "Professor" },
  { nom: "Joan", cognoms: "Marí", email: "joan.mari@escola.cat", telefon: "123456794", departament: "Anglès", carrec: "Professor" },
  { nom: "Julia", cognoms: "Coll", email: "julia.coll@escola.cat", telefon: "123456795", departament: "Educació Física", carrec: "Professor" },
  { nom: "Roger", cognoms: "Sabartes", email: "roger.sabartes@escola.cat", telefon: "123456796", departament: "Música", carrec: "Cap de departament" },
  { nom: "Maria", cognoms: "Creus", email: "maria.creus@escola.cat", telefon: "123456797", departament: "Tutoria", carrec: "Professor" },
  { nom: "Liliana", cognoms: "Perea", email: "liliana.perea@escola.cat", telefon: "123456798", departament: "Castellà", carrec: "Professor" },
  { nom: "JC", cognoms: "Tinoco", email: "jc.tinoco@escola.cat", telefon: "123456799", departament: "Matemàtiques", carrec: "Professor" },
  { nom: "Toni", cognoms: "Motos", email: "toni.motos@escola.cat", telefon: "123456800", departament: "Matemàtiques", carrec: "Professor" },
  { nom: "Teresa", cognoms: "Caralto", email: "teresa.caralto@escola.cat", telefon: "123456801", departament: "Educació Física", carrec: "Professor" },
  { nom: "Albert", cognoms: "Parrilla", email: "albert.parrilla@escola.cat", telefon: "123456802", departament: "Ciències", carrec: "Professor" },
  { nom: "Noe", cognoms: "Muñoz", email: "noe.munoz@escola.cat", telefon: "123456803", departament: "Ciències", carrec: "Professor" },
  { nom: "Albert", cognoms: "Freixenet", email: "albert.freixenet@escola.cat", telefon: "123456804", departament: "Música", carrec: "Professor" },
  { nom: "Itziar", cognoms: "Fuentes", email: "itziar.fuentes@escola.cat", telefon: "123456805", departament: "Castellà", carrec: "Professor" },
  { nom: "Berta", cognoms: "Riera", email: "berta.riera@escola.cat", telefon: "123456806", departament: "Català", carrec: "Professor" },
  { nom: "Laura", cognoms: "Manchado", email: "laura.manchado@escola.cat", telefon: "123456807", departament: "Castellà", carrec: "Professor" },
  { nom: "Luis", cognoms: "Cabrera", email: "luis.cabrera@escola.cat", telefon: "123456808", departament: "Educació Física", carrec: "Professor" },
  { nom: "Benet", cognoms: "Andujar", email: "benet.andujar@escola.cat", telefon: "123456809", departament: "Matemàtiques", carrec: "Cap de departament" },
  { nom: "Dani", cognoms: "Palau", email: "dani.palau@escola.cat", telefon: "123456810", departament: "Anglès", carrec: "Professor" },
  { nom: "Inmaculada", cognoms: "Murillo", email: "inmaculada.murillo@escola.cat", telefon: "123456811", departament: "Matemàtiques", carrec: "Professor" },
  { nom: "Mireia", cognoms: "Vendrell", email: "mireia.vendrell@escola.cat", telefon: "123456812", departament: "Anglès", carrec: "Professor" },
  { nom: "Maria J.", cognoms: "Romero", email: "mariaj.romero@escola.cat", telefon: "123456813", departament: "Tecnologia", carrec: "Professor" },
  { nom: "Marta", cognoms: "Lopez", email: "marta.lopez@escola.cat", telefon: "123456814", departament: "Tecnologia", carrec: "Professor" },
  { nom: "Xavier", cognoms: "Reyes", email: "xavier.reyes@escola.cat", telefon: "123456815", departament: "Tecnologia", carrec: "Professor" },
  { nom: "Elvira", cognoms: "Parra", email: "elvira.parra@escola.cat", telefon: "123456816", departament: "Ciències", carrec: "Professor" }
];

// Grups extrets del CSV real
const grups = [
  { nom: "1r ESO A", curs: "1r", nivell: "ESO", alumnesCount: 28 },
  { nom: "1r ESO B", curs: "1r", nivell: "ESO", alumnesCount: 27 },
  { nom: "1r ESO C", curs: "1r", nivell: "ESO", alumnesCount: 26 },
  { nom: "2n ESO A", curs: "2n", nivell: "ESO", alumnesCount: 29 },
  { nom: "2n ESO B", curs: "2n", nivell: "ESO", alumnesCount: 28 },
  { nom: "2n ESO C", curs: "2n", nivell: "ESO", alumnesCount: 27 },
  { nom: "3r ESO A", curs: "3r", nivell: "ESO", alumnesCount: 25 },
  { nom: "3r ESO B", curs: "3r", nivell: "ESO", alumnesCount: 24 },
  { nom: "3r ESO C", curs: "3r", nivell: "ESO", alumnesCount: 26 },
  { nom: "4t ESO A", curs: "4t", nivell: "ESO", alumnesCount: 23 },
  { nom: "4t ESO B", curs: "4t", nivell: "ESO", alumnesCount: 24 },
  { nom: "4t ESO C", curs: "4t", nivell: "ESO", alumnesCount: 25 },
  { nom: "4t ESO D", curs: "4t", nivell: "ESO", alumnesCount: 22 }
];

// Aules basades en un centre educatiu real
const aules = [
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

// Generar horaris basats en les assignacions reals
const horaris = [];
const diesSetmana = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];
const hores = [
  { inici: "08:00", fi: "09:00" },
  { inici: "09:00", fi: "10:00" },
  { inici: "10:00", fi: "11:00" },
  { inici: "11:30", fi: "12:30" },
  { inici: "12:30", fi: "13:30" },
  { inici: "13:30", fi: "14:30" }
];

// Assignatures per grup (basades en el CSV real)
const assignacionsReals = [
  { assignatura: "CAST", grup: "1r ESO A", professor: "Patricia Fajardo" },
  { assignatura: "CAT", grup: "1r ESO A", professor: "Alba Serqueda" },
  { assignatura: "MAT", grup: "1r ESO A", professor: "Mar Villar" },
  { assignatura: "ANG", grup: "1r ESO A", professor: "Eva Martin" },
  { assignatura: "EF", grup: "1r ESO A", professor: "Julia Coll" },
  { assignatura: "MUS", grup: "1r ESO A", professor: "Roger Sabartes" },
  // Afegir més assignacions segons el CSV...
];

// Generar horaris per a cada assignació
let horariId = 1;
assignacionsReals.forEach(assignacio => {
  const professorObj = professors.find(p => `${p.nom} ${p.cognoms}` === assignacio.professor);
  const grupObj = grups.find(g => g.nom === assignacio.grup);
  const aulaAleatoria = aules[Math.floor(Math.random() * aules.length)];
  
  if (professorObj && grupObj) {
    // Generar 2-3 classes per setmana per assignatura
    const numClasses = assignacio.assignatura === "MAT" || assignacio.assignatura === "CAST" || assignacio.assignatura === "CAT" ? 3 : 2;
    
    for (let i = 0; i < numClasses; i++) {
      const diaAleatori = diesSetmana[Math.floor(Math.random() * diesSetmana.length)];
      const horaAleatoria = hores[Math.floor(Math.random() * hores.length)];
      
      horaris.push({
        professorId: professorObj.id || horariId, // Temporal
        grupId: grupObj.id || horariId, // Temporal
        aulaId: aulaAleatoria.id || horariId, // Temporal
        diaSetmana: diaAleatori,
        horaInici: horaAleatoria.inici,
        horaFi: horaAleatoria.fi,
        assignatura: assignacio.assignatura
      });
      horariId++;
    }
  }
});

// Generar guàrdies realistes
const guardies = [];
const llocGuardies = ["Pati", "Passadís 1r pis", "Passadís 2n pis", "Entrada", "Biblioteca", "Cantina"];
const tipusGuardies = ["Pati", "Passadís", "Biblioteca", "Entrada"];

for (let dia = 1; dia <= 30; dia++) {
  const data = `2025-06-${dia.toString().padStart(2, '0')}`;
  
  // Guàrdies de pati (10:00-10:30)
  guardies.push({
    data,
    horaInici: "10:00",
    horaFi: "10:30",
    lloc: "Pati",
    tipusGuardia: "Pati",
    estat: "planificada",
    observacions: "Guàrdia de pati - esbarjo"
  });
  
  // Guàrdies de passadís durant les classes
  hores.forEach((hora, index) => {
    if (index < 3 || index > 3) { // No durant l'esbarjo
      guardies.push({
        data,
        horaInici: hora.inici,
        horaFi: hora.fi,
        lloc: llocGuardies[Math.floor(Math.random() * llocGuardies.length)],
        tipusGuardia: tipusGuardies[Math.floor(Math.random() * tipusGuardies.length)],
        estat: "planificada"
      });
    }
  });
}

// Generar sortides educatives realistes
const sortides = [
  {
    nom: "Visita al Museu de Ciències",
    descripcio: "Visita educativa al Museu de Ciències de Barcelona per als grups de 3r ESO",
    dataInici: "2025-06-15",
    dataFi: "2025-06-15",
    horaInici: "09:00",
    horaFi: "16:00",
    lloc: "Museu de Ciències - Barcelona",
    grupId: 7, // 3r ESO A
    professorResponsable: 21, // Benet Andujar
    estat: "planificada",
    observacions: "Transport en autocar. Dinar inclòs."
  },
  {
    nom: "Excursió al Parc Natural",
    descripcio: "Sortida al Parc Natural per estudiar l'ecosistema local",
    dataInici: "2025-06-20",
    dataFi: "2025-06-20",
    horaInici: "08:30",
    horaFi: "17:00",
    lloc: "Parc Natural del Montseny",
    grupId: 8, // 3r ESO B
    professorResponsable: 14, // Albert Parrilla
    estat: "planificada",
    observacions: "Activitat relacionada amb ciències naturals"
  },
  {
    nom: "Teatre en Anglès",
    descripcio: "Assistència a una obra de teatre en anglès",
    dataInici: "2025-06-25",
    dataFi: "2025-06-25",
    horaInici: "10:00",
    horaFi: "13:00",
    lloc: "Teatre Principal",
    grupId: 10, // 4t ESO A
    professorResponsable: 5, // Eva Martin
    estat: "confirmada",
    observacions: "Obra adaptada al nivell d'anglès dels alumnes"
  }
];

// Generar assignacions de guàrdia
const assignacionsGuardia = [];
guardies.forEach((guardia, index) => {
  // Assignar 1-2 professors per guàrdia
  const numProfessors = guardia.tipusGuardia === "Pati" ? 2 : 1;
  
  for (let i = 0; i < numProfessors; i++) {
    const professorAleatori = professors[Math.floor(Math.random() * professors.length)];
    assignacionsGuardia.push({
      guardiaId: index + 1,
      professorId: professors.indexOf(professorAleatori) + 1,
      estat: "assignada",
      observacions: `Assignació automàtica per ${guardia.tipusGuardia}`
    });
  }
});

// Generar tasques realistes
const tasques = [
  {
    assignacioId: 1,
    descripcio: "Revisar incidents durant el pati del migdia",
    estat: "pendent",
    prioritat: "mitjana",
    dataVenciment: "2025-06-02",
    comentaris: "Verificar que no hi ha hagut incidents i registrar observacions"
  },
  {
    assignacioId: 2,
    descripcio: "Controlar l'accés a la biblioteca durant l'hora lliure",
    estat: "en_progress",
    prioritat: "baixa",
    dataVenciment: "2025-06-03",
    comentaris: "Assegurar ordre i silenci a la biblioteca"
  },
  {
    assignacioId: 3,
    descripcio: "Supervisar l'evacuació d'emergència - simulacre",
    estat: "pendent",
    prioritat: "urgent",
    dataVenciment: "2025-06-05",
    comentaris: "Simulacre d'evacuació programat per demà"
  },
  {
    assignacioId: 4,
    descripcio: "Recompte d'alumnes al final de la sortida",
    estat: "completada",
    prioritat: "alta",
    comentaris: "Tasca completada satisfactòriament. Tots els alumnes presents."
  }
];

// Generar comunicacions
const comunicacions = [
  {
    titol: "Canvi d'horari - Guàrdia de pati",
    missatge: "S'ha modificat l'horari de la guàrdia de pati del dia 15/06. Nova hora: 10:15-10:45",
    usuariId: "sistema",
    destinataris: ["professors"],
    tipus: "urgent",
    llegida: false
  },
  {
    titol: "Recordatori: Sortida educativa demà",
    missatge: "Recordem la sortida al Museu de Ciències demà. Punt de trobada a les 8:45 a l'entrada principal.",
    usuariId: "coordinator",
    destinataris: ["professors", "alumnes"],
    tipus: "informacio",
    llegida: true
  },
  {
    titol: "Nou protocol de guàrdies",
    missatge: "S'ha actualitzat el protocol de guàrdies. Consulteu el document adjunt per a més detalls.",
    usuariId: "direccio",
    destinataris: ["professors"],
    tipus: "protocol",
    llegida: false
  }
];

// Crear fitxers CSV per a la importació
const createCSV = (data, filename) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escapar comes i cometes en els valors
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');
  
  writeFileSync(filename, csvContent, 'utf8');
  console.log(`✓ Generat ${filename} amb ${data.length} registres`);
};

// Generar tots els fitxers CSV
createCSV(professors, 'professors.csv');
createCSV(grups, 'grups.csv');
createCSV(aules, 'aules.csv');
createCSV(horaris.slice(0, 50), 'horaris.csv'); // Limitar per a prova
createCSV(guardies.slice(0, 30), 'guardies.csv'); // Limitar per a prova
createCSV(sortides, 'sortides.csv');
createCSV(assignacionsGuardia.slice(0, 40), 'assignacions-guardia.csv'); // Limitar per a prova
createCSV(tasques, 'tasques.csv');
createCSV(comunicacions, 'comunicacions.csv');

console.log('\n🎉 Generació de dades de prova completada!');
console.log('Fitxers generats:');
console.log('- professors.csv: Professors del centre educatiu');
console.log('- grups.csv: Grups i classes');
console.log('- aules.csv: Aules i espais del centre');
console.log('- horaris.csv: Horaris d\'assignatures');
console.log('- guardies.csv: Guàrdies planificades');
console.log('- sortides.csv: Sortides educatives');
console.log('- assignacions-guardia.csv: Assignacions de professors a guàrdies');
console.log('- tasques.csv: Tasques assignades');
console.log('- comunicacions.csv: Comunicacions del sistema');