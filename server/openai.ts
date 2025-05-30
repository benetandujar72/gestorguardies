import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function analyzeGuardAssignments(context: any): Promise<any> {
  try {
    const prompt = `
Analitza el context de guardies escolars i proporciona recomanacions d'assignació seguint aquestes regles de prioritat:
1. Professors alliberats per sortides/activitats a la seva hora
2. Professors de guàrdia assignats
3. Professors amb reunions o càrrecs administratius
4. Equilibri de distribució basant-se en assignacions prèvies

Context: ${JSON.stringify(context)}

Respon amb JSON en aquest format:
{
  "assignacions": [
    {
      "professorId": number,
      "nom": "string",
      "prioritat": number,
      "motiu": "string",
      "confidence": number
    }
  ],
  "confidence": number,
  "raonament": "string",
  "equilibri": {
    "professorId": number,
    "guardiesActuals": number,
    "recomanacio": "string"
  }[]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ets un expert en gestió educativa i assignació de guardies escolars. Analitza els patrons i proporciona recomanacions intel·ligents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error analyzing guard assignments:", error);
    return {
      assignacions: [],
      confidence: 0,
      raonament: "Error en l'anàlisi",
      equilibri: []
    };
  }
}

export async function generateChatResponse(userMessage: string, chatHistory: any[]): Promise<string> {
  try {
    // Obtenir dades reals del sistema per proporcionar context a la IA
    const guardiesAvui = await storage.getGuardiesAvui();
    const guardies = await storage.getGuardies();
    const professors = await storage.getProfessors();
    const sortides = await storage.getSortidesThisWeek();
    const tasquesPendents = await storage.getTasquesPendents();
    
    console.log("Dades obtingudes per al chat:", {
      guardiesAvui: guardiesAvui.length,
      totalGuardies: guardies.length,
      professors: professors.length,
      sortides: sortides.length,
      tasquesPendents: tasquesPendents.length
    });

    const contextData = {
      guardiesAvui: guardiesAvui.length,
      totalGuardies: guardies.length,
      professors: professors.length,
      sortides: sortides.length,
      tasquesPendents: tasquesPendents.length,
      professorsNoms: professors.slice(0, 5).map(p => p.nom), // Mostrar només alguns noms
      darreresGuardies: guardies.slice(-3).map(g => ({
        data: g.data,
        horaInici: g.horaInici,
        tipus: g.tipus
      }))
    };

    const systemPrompt = `
Ets un assistent IA especialitzat en gestió de guardies escolars. Tens accés a les dades reals del sistema actual:

DADES SISTEMA ACTUAL:
- Guardies avui: ${contextData.guardiesAvui}
- Total guardies al sistema: ${contextData.totalGuardies}
- Professors registrats: ${contextData.professors}
- Sortides aquesta setmana: ${contextData.sortides}
- Tasques pendents: ${contextData.tasquesPendents}

Quan l'usuari pregunti sobre guardies, professors o tasques, utilitza aquestes dades reals per donar informació precisa.

Ajudes amb:
- Planificació i assignació de guardies
- Anàlisi de càrrega de treball del professorat
- Prediccions i optimitzacions
- Resolució de conflictes d'horaris
- Estadístiques i mètriques

Respon sempre en català de manera útil i professional utilitzant les dades reals del sistema.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.emissor === 'usuari' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Ho sento, no he pogut processar la teva consulta.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "Hi ha hagut un error en processar la teva consulta. Si us plau, torna-ho a intentar.";
  }
}

export async function generateScheduleOptimizations(scheduleData: any): Promise<any> {
  try {
    const prompt = `
Analitza les dades d'horaris escolars i proporciona optimitzacions per:
- Minimitzar conflictes d'aules
- Equilibrar la càrrega del professorat
- Optimitzar l'ús d'espais
- Detectar possibles problemes

Dades: ${JSON.stringify(scheduleData)}

Respon amb JSON:
{
  "optimitzacions": [
    {
      "tipus": "string",
      "descripcio": "string",
      "impacte": "alt|mitjà|baix",
      "accions": ["string"]
    }
  ],
  "conflictes": [
    {
      "tipus": "string",
      "descripcio": "string",
      "solucio": "string"
    }
  ],
  "metriques": {
    "eficiencia": number,
    "equilibri": number,
    "utilitzacioAules": number
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ets un expert en optimització d'horaris escolars i gestió d'espais educatius."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error generating schedule optimizations:", error);
    return {
      optimitzacions: [],
      conflictes: [],
      metriques: { eficiencia: 0, equilibri: 0, utilitzacioAules: 0 }
    };
  }
}

export async function predictGuardNeeds(historicalData: any): Promise<any> {
  try {
    const prompt = `
Basant-te en dades històriques de guardies, prediu les necessitats futures i patrons:

Dades històriques: ${JSON.stringify(historicalData)}

Proporciona prediccions per:
- Dies amb més necessitat de guardies
- Professors amb més probabilitat de necessitar substitució
- Recomanacions estacionals
- Patrons de sortides i activitats

Respon amb JSON:
{
  "prediccions": [
    {
      "data": "string",
      "probabilitat": number,
      "tipus": "string",
      "descripcio": "string"
    }
  ],
  "patrons": [
    {
      "nom": "string",
      "frequencia": "string",
      "recomanacio": "string"
    }
  ],
  "alertes": [
    {
      "tipus": "string",
      "missatge": "string",
      "prioritat": "alta|mitjana|baixa"
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ets un analista predictiu especialitzat en patrons educatius i gestió de personal docent."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error predicting guard needs:", error);
    return {
      prediccions: [],
      patrons: [],
      alertes: []
    };
  }
}
