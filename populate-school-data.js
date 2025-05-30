// Script para poblar la base de datos con los datos reales del centro educativo
const BASE_URL = 'http://localhost:5000/api';

// Datos extraídos del CSV real del centro
const profesores = [
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

const grupos = [
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
  // Guardias para la próxima semana
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

// Función para realizar peticiones autenticadas
async function authenticatedRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return response.json();
}

async function populateDatabase() {
  console.log('🏫 Iniciando población de la base de datos con datos del centro educativo...\n');

  try {
    // 1. Crear profesores
    console.log('👨‍🏫 Creando profesores...');
    const profesoresCreados = [];
    for (const profesor of profesores) {
      try {
        const response = await authenticatedRequest('/professors', 'POST', profesor);
        profesoresCreados.push(response);
        console.log(`✓ Creado: ${profesor.nom} ${profesor.cognoms} - ${profesor.departament}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`- Ya existe: ${profesor.nom} ${profesor.cognoms}`);
        } else {
          console.log(`✗ Error creando ${profesor.nom}: ${error.message}`);
        }
      }
    }

    // 2. Crear grupos
    console.log('\n📚 Creando grupos...');
    const gruposCreados = [];
    for (const grupo of grupos) {
      try {
        const response = await authenticatedRequest('/grups', 'POST', grupo);
        gruposCreados.push(response);
        console.log(`✓ Creado: ${grupo.nom} - ${grupo.alumnesCount} alumnes`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`- Ya existe: ${grupo.nom}`);
        } else {
          console.log(`✗ Error creando ${grupo.nom}: ${error.message}`);
        }
      }
    }

    // 3. Crear aulas
    console.log('\n🏛️ Creando aulas...');
    const aulasCreadas = [];
    for (const aula of aulas) {
      try {
        const response = await authenticatedRequest('/aules', 'POST', aula);
        aulasCreadas.push(response);
        console.log(`✓ Creada: ${aula.nom} - ${aula.tipus} (${aula.capacitat} places)`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`- Ya existe: ${aula.nom}`);
        } else {
          console.log(`✗ Error creando ${aula.nom}: ${error.message}`);
        }
      }
    }

    // 4. Crear guardias
    console.log('\n🛡️ Creando guardias...');
    const guardiasCreadas = [];
    for (const guardia of guardias) {
      try {
        const response = await authenticatedRequest('/guardies', 'POST', guardia);
        guardiasCreadas.push(response);
        console.log(`✓ Creada: ${guardia.data} ${guardia.horaInici}-${guardia.horaFi} - ${guardia.tipusGuardia}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`- Ya existe: ${guardia.data} ${guardia.horaInici}`);
        } else {
          console.log(`✗ Error creando guardia: ${error.message}`);
        }
      }
    }

    // 5. Crear sortidas
    console.log('\n🚌 Creando sortidas...');
    const sortidasCreadas = [];
    for (const sortida of sortidas) {
      try {
        const response = await authenticatedRequest('/sortides', 'POST', sortida);
        sortidasCreadas.push(response);
        console.log(`✓ Creada: ${sortida.nom} - ${sortida.dataInici}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`- Ya existe: ${sortida.nom}`);
        } else {
          console.log(`✗ Error creando ${sortida.nom}: ${error.message}`);
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
    console.log('\n📝 Ahora puedes:');
    console.log('   1. Probar la asignación automática de guardias');
    console.log('   2. Crear horarios de materias');
    console.log('   3. Gestionar las asignaciones del profesorado');

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error.message);
  }
}

// Ejecutar si el script se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase();
}

export { populateDatabase };