import { storage } from "./storage";

export class GuardAssignmentEngine {
  
  /**
   * Algoritmo principal de asignación automática de guardias (simplificado)
   */
  async assignGuardAutomatically(guardiaId: number): Promise<any[]> {
    try {
      console.log(`=== ASSIGNACIÓ AUTOMÀTICA GUÀRDIA ${guardiaId} ===`);
      
      // 1. Obtener información de la guardia
      const guardies = await storage.getGuardies();
      const guardia = guardies.find(g => g.id === guardiaId);
      if (!guardia) {
        throw new Error("Guardia no encontrada");
      }

      // 2. Obtener profesores disponibles
      const professors = await storage.getProfessors();
      
      // 3. Filtrar profesores ya asignados
      const currentAssignments = await storage.getAssignacionsGuardiaByGuardia(guardia.id);
      const assignedProfessorIds = currentAssignments.map(a => a.professorId);
      const availableProfessors = professors.filter(p => !assignedProfessorIds.includes(p.id));
      
      console.log(`Professors disponibles: ${availableProfessors.length}`);

      // 4. Seleccionar primer professor disponible (simplificat)
      if (availableProfessors.length === 0) {
        console.log("No hi ha professors disponibles");
        return [];
      }

      const selectedProfessor = availableProfessors[0];
      console.log(`Professor seleccionat: ${selectedProfessor.nom} ${selectedProfessor.cognoms}`);

      // 5. Crear assignació
      const assignment = await storage.createAssignacioGuardia({
        guardiaId: guardia.id,
        professorId: selectedProfessor.id,
        prioritat: 1,
        estat: "assignada",
        motiu: "Assignació automàtica",
        anyAcademicId: guardia.anyAcademicId
      });

      console.log(`Assignació creada amb ID ${assignment.id}`);
      return [assignment];

    } catch (error) {
      console.error("Error en asignación automática:", error);
      throw error;
    }
  }
}