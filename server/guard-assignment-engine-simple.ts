import { storage } from "./storage";

export class GuardAssignmentEngine {
  
  /**
   * Algoritmo principal de asignación automática de guardias (simplificado)
   */
  async assignGuardAutomatically(guardiaId: number): Promise<any[]> {
    try {
      console.log(`=== ASSIGNACIÓ AUTOMÀTICA GUÀRDIA ${guardiaId} ===`);
      
      // 1. Verificar que la guàrdia existeix a la BD
      const guardia = await storage.getGuardiaById(guardiaId);
      if (!guardia) {
        console.error(`Guàrdia amb ID ${guardiaId} no existeix a la base de dades`);
        throw new Error(`Guàrdia amb ID ${guardiaId} no trobada`);
      }

      // 2. Obtenir professors disponibles per aquesta guàrdia
      const availableProfessors = await storage.getAvailableProfessorsForGuard(guardia.id);
      
      console.log(`Data: ${guardia.data}, Tipus: ${guardia.tipusGuardia}`);
      console.log(`Professors disponibles: ${availableProfessors.length}`);

      // 3. Verificar si hi ha professors disponibles
      if (availableProfessors.length === 0) {
        console.log("No hi ha professors disponibles per aquesta guàrdia");
        return [];
      }

      // 4. Seleccionar el primer professor disponible (algorisme simplificat)
      const selectedProfessor = availableProfessors[0];
      console.log(`Professor seleccionat: ${selectedProfessor.nom} ${selectedProfessor.cognoms} (ID: ${selectedProfessor.id})`);

      // 5. Crear l'assignació a la base de dades
      const assignment = await storage.createAssignacioGuardia({
        guardiaId: guardia.id,
        professorId: selectedProfessor.id,
        prioritat: 1,
        estat: "assignada",
        motiu: "Assignació automàtica amb IA",
        anyAcademicId: guardia.anyAcademicId
      });

      // 6. Actualitzar l'estat de la guàrdia a "assignada"
      await storage.updateGuardia(guardia.id, { estat: "assignada" });

      console.log(`✅ Assignació completada - ID: ${assignment.id}`);
      console.log(`✅ Guàrdia ${guardia.id} actualitzada a estat "assignada"`);
      
      return [assignment];

    } catch (error) {
      console.error("Error en asignación automática:", error);
      throw error;
    }
  }
}