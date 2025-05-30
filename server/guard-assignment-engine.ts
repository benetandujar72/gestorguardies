import { db } from "./db";
import { storage } from "./storage";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "@shared/schema";

interface AssignmentPriority {
  professorId: number;
  priority: number; // 1 = highest priority
  reason: string;
  workloadScore: number;
}

interface GuardAssignmentContext {
  guardia: any;
  professors: any[];
  sortides: any[];
  currentAssignments: any[];
  horaris: any[];
}

export class GuardAssignmentEngine {
  
  /**
   * Algoritmo principal de asignación automática de guardias
   * Implementa los criterios de prioridad definidos
   */
  async assignGuardAutomatically(guardiaId: number): Promise<any[]> {
    try {
      // 1. Obtener información de la guardia
      const guardies = await storage.getGuardies();
      const guardia = guardies.find(g => g.id === guardiaId);
      if (!guardia) {
        throw new Error("Guardia no encontrada");
      }

      // 2. Obtener contexto completo
      const context = await this.getAssignmentContext(guardia);
      
      // 3. Calcular prioridades para todos los profesores
      const priorities = await this.calculateProfessorPriorities(context);
      
      console.log(`=== ASSIGNACIÓ AUTOMÀTICA GUÀRDIA ${guardia.id} ===`);
      console.log(`Data: ${guardia.data}, Hora: ${guardia.horaInici}-${guardia.horaFi}, Tipus: ${guardia.tipusGuardia}`);
      console.log(`Professors disponibles analitzats: ${priorities.length}`);
      
      // 4. Ordenar por prioridad y seleccionar
      const sortedProfessors = priorities.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Menor número = mayor prioridad
        }
        // En caso de empate, usar workloadScore (menor = mayor prioridad)
        return a.workloadScore - b.workloadScore;
      });

      console.log("=== TOP 5 PROFESSORS PER PRIORITAT ===");
      sortedProfessors.slice(0, 5).forEach((prof, index) => {
        console.log(`${index + 1}. Professor ID ${prof.professorId} - Prioritat: ${prof.priority} - Motiu: ${prof.reason} - Score: ${prof.workloadScore}`);
      });

      // 5. Seleccionar profesores según el tipo de guardia
      const numProfessorsNeeded = this.getRequiredProfessors(guardia.tipusGuardia);
      const selectedProfessors = sortedProfessors.slice(0, numProfessorsNeeded);

      console.log(`=== PROFESSORS SELECCIONATS (${selectedProfessors.length}/${numProfessorsNeeded}) ===`);
      selectedProfessors.forEach((prof, index) => {
        console.log(`${index + 1}. Professor ID ${prof.professorId} - Prioritat: ${prof.priority} - Motiu: ${prof.reason}`);
      });

      // 6. Crear las asignaciones
      const assignments = [];
      for (const prof of selectedProfessors) {
        console.log(`Creant assignació per Professor ID ${prof.professorId} amb prioritat ${prof.priority}`);
        const assignment = await storage.createAssignacioGuardia({
          guardiaId: guardia.id,
          professorId: prof.professorId,
          prioritat: prof.priority, // Afegim la prioritat calculada
          estat: "assignada",
          motiu: `Assignació automàtica - ${prof.reason}`
        });
        assignments.push(assignment);
        console.log(`Assignació creada amb ID ${assignment.id}`);
      }

      // 7. Actualizar estado de la guardia a "assignada"
      await storage.updateGuardia(guardia.id, { estat: "assignada" });
      console.log(`Guardia ${guardia.id} actualizada a estado "assignada"`);

      // 8. Generar comunicaciones automáticas
      await this.generateAssignmentCommunications(guardia, assignments);

      // 9. Actualizar métricas
      await this.updateMetrics(guardia, assignments);

      console.log(`=== ASSIGNACIÓ COMPLETADA ===`);
      return assignments;

    } catch (error) {
      console.error("Error en asignación automática:", error);
      throw error;
    }
  }

  /**
   * Obtiene el contexto completo necesario para la asignación
   */
  private async getAssignmentContext(guardia: any): Promise<GuardAssignmentContext> {
    const [professors, sortides, currentAssignments, horaris] = await Promise.all([
      storage.getProfessors(),
      storage.getSortidesThisWeek(),
      storage.getAssignacionsGuardiaByGuardia(guardia.id),
      storage.getHoraris()
    ]);

    return {
      guardia,
      professors,
      sortides,
      currentAssignments,
      horaris
    };
  }

  /**
   * Calcula las prioridades de todos los profesores según los criterios
   */
  private async calculateProfessorPriorities(context: GuardAssignmentContext): Promise<AssignmentPriority[]> {
    const priorities: AssignmentPriority[] = [];

    console.log(`=== ANALITZANT ${context.professors.length} PROFESSORS ===`);
    for (const professor of context.professors) {
      // Skip si ya está asignado a esta guardia
      if (context.currentAssignments.some(a => a.professorId === professor.id)) {
        console.log(`Professor ${professor.nom} ${professor.cognoms} (ID: ${professor.id}) - SALTAT (ja assignat)`);
        continue;
      }

      const priority = await this.calculateProfessorPriority(professor, context);
      priorities.push(priority);
      console.log(`Professor ${professor.nom} ${professor.cognoms} (ID: ${professor.id}) - Prioritat: ${priority.priority} - Motiu: ${priority.reason}`);
    }

    return priorities;
  }

  /**
   * Calcula la prioridad de un profesor específico
   */
  private async calculateProfessorPriority(
    professor: any, 
    context: GuardAssignmentContext
  ): Promise<AssignmentPriority> {
    
    let priority = 100; // Prioridad base (alta = menor número)
    let reason = "Disponible";
    
    // CRITERIO 1: Profesores liberados por sortidas (MÁXIMA PRIORIDAD)
    const isFreedByOuting = await this.isProfessorFreedByOuting(professor, context);
    if (isFreedByOuting.isFreed) {
      priority = 1;
      reason = `Liberado por sortida: ${isFreedByOuting.sortidaName}`;
    }
    
    // CRITERIO 2: Profesores de guardia asignada
    else if (await this.hasDutyAssignment(professor, context)) {
      priority = 10;
      reason = "Guardia asignada en horario";
    }
    
    // CRITERIO 3: Reuniones o horas de cargos
    else if (await this.hasAdministrativeRole(professor, context)) {
      priority = 20;
      reason = `Cargo administrativo: ${professor.carrec}`;
    }
    
    // CRITERIO 4-5: Equilibrio de carga de trabajo
    const workloadScore = await this.calculateWorkloadScore(professor);
    
    // Ajustar prioridad basada en carga de trabajo
    if (priority > 20) {
      priority = 30 + Math.floor(workloadScore / 10);
    }

    return {
      professorId: professor.id,
      priority,
      reason,
      workloadScore
    };
  }

  /**
   * Verifica si un profesor está liberado por una sortida
   */
  private async isProfessorFreedByOuting(
    professor: any, 
    context: GuardAssignmentContext
  ): Promise<{ isFreed: boolean; sortidaName?: string }> {
    
    const guardiaDate = context.guardia.data;
    const guardiaStart = context.guardia.horaInici;
    const guardiaEnd = context.guardia.horaFi;

    // Buscar sortidas que coincidan con la fecha de la guardia
    const concurrentSortidas = context.sortides.filter(sortida => {
      return sortida.dataInici === guardiaDate && 
             this.timeOverlaps(
               guardiaStart, guardiaEnd,
               sortida.horaInici, sortida.horaFi
             );
    });

    // Verificar si el profesor tenía clase con el grupo que sale
    for (const sortida of concurrentSortidas) {
      const hasClassWithGroup = context.horaris.some(horari => 
        horari.professorId === professor.id &&
        horari.grupId === sortida.grupId &&
        this.isDayOfWeek(guardiaDate, horari.diaSetmana) &&
        this.timeOverlaps(
          guardiaStart, guardiaEnd,
          horari.horaInici, horari.horaFi
        )
      );

      if (hasClassWithGroup) {
        return { isFreed: true, sortidaName: sortida.nom };
      }
    }

    return { isFreed: false };
  }

  /**
   * Verifica si un profesor tiene guardia asignada en su horario
   */
  private async hasDutyAssignment(professor: any, context: GuardAssignmentContext): Promise<boolean> {
    // Buscar en horarios si tiene "GUARDIA" asignada en este momento
    const guardiaDate = context.guardia.data;
    const guardiaStart = context.guardia.horaInici;
    const guardiaEnd = context.guardia.horaFi;

    const hasDuty = context.horaris.some(horari => 
      horari.professorId === professor.id &&
      horari.assignatura === "GUARDIA" &&
      this.isDayOfWeek(guardiaDate, horari.diaSetmana) &&
      this.timeOverlaps(guardiaStart, guardiaEnd, horari.horaInici, horari.horaFi)
    );

    return hasDuty;
  }

  /**
   * Verifica si un profesor tiene cargo administrativo
   */
  private async hasAdministrativeRole(professor: any, context: GuardAssignmentContext): Promise<boolean> {
    const administrativeRoles = [
      "Cap de departament",
      "Coordinador", 
      "Secretari",
      "Director",
      "Cap d'estudis"
    ];

    return administrativeRoles.includes(professor.rol);
  }

  /**
   * Calcula el score de carga de trabajo del profesor
   */
  private async calculateWorkloadScore(professor: any): Promise<number> {
    try {
      // Obtener asignaciones del último mes
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentAssignments = await db
        .select()
        .from(schema.assignacionsGuardia)
        .innerJoin(schema.guardies, eq(schema.assignacionsGuardia.guardiaId, schema.guardies.id))
        .where(
          and(
            eq(schema.assignacionsGuardia.professorId, professor.id),
            sql`${schema.guardies.data} >= ${oneMonthAgo.toISOString().split('T')[0]}`
          )
        );

      // Calcular diferentes tipos de métricas
      const totalAssignments = recentAssignments.length;
      const patioGuards = recentAssignments.filter(a => a.guardies.tipusGuardia === 'Pati').length;
      const libraryGuards = recentAssignments.filter(a => a.guardies.tipusGuardia === 'Biblioteca').length;

      // Score más alto = más carga de trabajo
      return (totalAssignments * 10) + (patioGuards * 5) + (libraryGuards * 3);

    } catch (error) {
      console.error("Error calculando workload score:", error);
      return 0;
    }
  }

  /**
   * Determina cuántos profesores se necesitan según el tipo de guardia
   */
  private getRequiredProfessors(tipusGuardia: string): number {
    switch (tipusGuardia) {
      case "Pati":
        return 2; // Patio necesita 2 profesores
      case "Biblioteca":
        return 1;
      case "Passadís":
        return 1;
      case "Entrada":
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Genera comunicacions automàtiques per a les assignacions
   */
  private async generateAssignmentCommunications(guardia: any, assignments: any[]): Promise<void> {
    try {
      for (const assignment of assignments) {
        // Obtenir dades del professor assignat
        const professor = await storage.getProfessor(assignment.professorId);
        if (!professor) continue;

        const dataFormatted = new Date(guardia.data).toLocaleDateString('ca-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const missatge = `Nova assignació de guàrdia:
📅 Data: ${dataFormatted}
⏰ Horari: ${guardia.horaInici} - ${guardia.horaFi}
📍 Tipus: ${guardia.tipusGuardia}
${guardia.lloc ? `🏢 Lloc: ${guardia.lloc}` : ''}

Assignació realitzada automàticament pel sistema.
Si us plau, confirmeu la vostra disponibilitat.`;

        // Crear comunicació per al professor assignat
        await storage.createComunicacio({
          tipusDest: 'Professor',
          destinatariId: professor.id,
          missatge: missatge,
          tipus: 'Assignació',
          llegit: false,
          emissorId: 1, // Sistema
          relatedGuardiaId: guardia.id
        });

        console.log(`Comunicació enviada al Professor ${professor.nom} ${professor.cognoms}`);
      }

      // Comunicació al coordinador o responsable de guardies
      const coordinadorMessage = `Assignació automàtica realitzada:
📊 Guàrdia: ${guardia.tipusGuardia} del ${new Date(guardia.data).toLocaleDateString('ca-ES')}
👥 Professors assignats: ${assignments.length}
🤖 Assignació automàtica completada amb èxit.

Detalls: ${assignments.map(a => `Professor ID ${a.professorId}`).join(', ')}`;

      await storage.createComunicacio({
        tipusDest: 'Coordinador',
        destinatariId: 1, // Coordinador principal
        missatge: coordinadorMessage,
        tipus: 'Informe',
        llegit: false,
        emissorId: 1,
        relatedGuardiaId: guardia.id
      });

      console.log(`Comunicació d'informe enviada al coordinador`);

    } catch (error) {
      console.error("Error generant comunicacions:", error);
    }
  }

  /**
   * Actualiza las métricas después de la asignación
   */
  private async updateMetrics(guardia: any, assignments: any[]): Promise<void> {
    try {
      for (const assignment of assignments) {
        await storage.createMetric({
          timestamp: new Date(),
          usuariId: "sistema",
          accio: "guard_auto_assignment",
          detalls: {
            guardiaId: guardia.id,
            professorId: assignment.professorId,
            tipusGuardia: guardia.tipusGuardia,
            autoAssigned: true
          },
          entityType: "assignment",
          entityId: assignment.id
        });
      }
    } catch (error) {
      console.error("Error actualizando métricas:", error);
    }
  }

  /**
   * Utilidades auxiliares
   */
  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  private isDayOfWeek(date: string, dayName: string): boolean {
    const dayNames = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
    const dateObj = new Date(date);
    const dayIndex = dateObj.getDay();
    return dayNames[dayIndex] === dayName;
  }

  /**
   * Obtiene estadísticas de equilibrio de guardias
   */
  async getWorkloadBalance(): Promise<any> {
    try {
      const professors = await storage.getProfessors();
      const workloadStats = [];

      for (const professor of professors) {
        const workloadScore = await this.calculateWorkloadScore(professor);
        const recentAssignments = await storage.getAssignacionsGuardiaByProfessor(professor.id);
        
        workloadStats.push({
          professor: `${professor.nom} ${professor.cognoms}`,
          totalAssignments: recentAssignments.length,
          workloadScore,
          department: professor.rol || 'Professor',
          role: professor.rol || 'Professor'
        });
      }

      return workloadStats.sort((a, b) => b.workloadScore - a.workloadScore);

    } catch (error) {
      console.error("Error obteniendo balance de carga:", error);
      return [];
    }
  }
}