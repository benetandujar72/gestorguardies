import {
  users,
  professors,
  grups,
  alumnes,
  aules,
  materies,
  horaris,
  sortides,
  guardies,
  assignacionsGuardia,
  tasques,
  comunicacions,
  attachments,
  metrics,
  predictions,
  chatSessions,
  chatMessages,
  anysAcademics,
  sortidaProfessors,
  sortidaAlumnes,
  sortidaSubstitucions,
  type User,
  type UpsertUser,
  type Professor,
  type InsertProfessor,
  type Grup,
  type InsertGrup,
  type Alumne,
  type InsertAlumne,
  type Aula,
  type InsertAula,
  type Materia,
  type InsertMateria,
  type Horari,
  type InsertHorari,
  type HorariWithRelations,
  type Sortida,
  type InsertSortida,
  type Guardia,
  type InsertGuardia,
  type AssignacioGuardia,
  type InsertAssignacioGuardia,
  type Tasca,
  type InsertTasca,
  type Comunicacio,
  type InsertComunicacio,
  type Attachment,
  type InsertAttachment,
  type Metric,
  type Prediction,
  type ChatSession,
  type SortidaWithRelations,
  type GuardiaWithRelations,
  type SortidaProfessor,
  type InsertSortidaProfessor,
  type SortidaAlumne,
  type InsertSortidaAlumne,
  type SortidaSubstitucio,
  type InsertSortidaSubstitucio,
  type AssignacioGuardiaWithProfessor,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, count, between, gte, lte, isNotNull, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Academic Year operations
  getAnysAcademics(): Promise<any[]>;
  getAnyAcademic(id: number): Promise<any | undefined>;
  createAnyAcademic(anyAcademic: any): Promise<any>;
  updateAnyAcademic(id: number, anyAcademic: any): Promise<any>;
  deleteAnyAcademic(id: number): Promise<void>;
  getActiveAcademicYear(): Promise<number>;
  getActiveAcademicYearFull(): Promise<any>;

  // Professor operations
  getProfessors(): Promise<Professor[]>;
  getProfessor(id: number): Promise<Professor | undefined>;
  getProfessorByUserId(userId: string): Promise<Professor | undefined>;
  getProfessorByEmail(email: string): Promise<Professor | undefined>;
  getProfessorByCode(code: string): Promise<Professor | undefined>;
  createProfessor(professor: InsertProfessor): Promise<Professor>;
  updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor>;
  deleteProfessor(id: number): Promise<void>;
  getAvailableProfessorsForGuard(guardiaId: number): Promise<Professor[]>;

  // Grup operations
  getGrups(): Promise<Grup[]>;
  getGrup(id: number): Promise<Grup | undefined>;
  createGrup(grup: InsertGrup): Promise<Grup>;
  updateGrup(id: number, grup: Partial<InsertGrup>): Promise<Grup>;
  deleteGrup(id: number): Promise<void>;

  // Alumne operations
  getAlumnes(): Promise<Alumne[]>;
  getAlumnesByGrup(grupId: number): Promise<Alumne[]>;
  createAlumne(alumne: InsertAlumne): Promise<Alumne>;
  updateAlumne(id: number, alumne: Partial<InsertAlumne>): Promise<Alumne>;
  deleteAlumne(id: number): Promise<void>;

  // Aula operations
  getAules(): Promise<Aula[]>;
  getAula(id: number): Promise<Aula | undefined>;
  createAula(aula: InsertAula): Promise<Aula>;
  updateAula(id: number, aula: Partial<InsertAula>): Promise<Aula>;
  deleteAula(id: number): Promise<void>;

  // Materia operations
  getMateries(): Promise<Materia[]>;
  getMateria(id: number): Promise<Materia | undefined>;
  createMateria(materia: InsertMateria): Promise<Materia>;
  updateMateria(id: number, materia: Partial<InsertMateria>): Promise<Materia>;
  deleteMateria(id: number): Promise<void>;

  // Horari operations
  getHorari(id: number): Promise<Horari | undefined>;
  getHoraris(): Promise<HorariWithRelations[]>;
  getHorarisByProfessor(professorId: number): Promise<Horari[]>;
  getHorarisByGrup(grupId: number): Promise<Horari[]>;
  createHorari(horari: InsertHorari): Promise<Horari>;
  updateHorari(id: number, horari: Partial<InsertHorari>): Promise<Horari>;
  deleteHorari(id: number): Promise<void>;

  // Sortida operations
  getSortida(id: number): Promise<SortidaWithRelations | undefined>;
  getSortides(): Promise<SortidaWithRelations[]>;
  getSortidesThisWeek(): Promise<SortidaWithRelations[]>;
  createSortida(sortida: InsertSortida): Promise<Sortida>;
  updateSortida(id: number, sortida: Partial<InsertSortida>): Promise<Sortida>;
  deleteSortida(id: number): Promise<void>;

  // Guardia operations - SISTEMA UNIFICAT
  getGuardies(): Promise<Guardia[]>;
  getGuardiaById(id: number): Promise<Guardia | undefined>;
  getGuardiesWithDetails(): Promise<any[]>;
  getGuardiesAvui(): Promise<Guardia[]>;
  getGuardiesByDate(date: string): Promise<Guardia[]>;
  createGuardia(guardia: InsertGuardia): Promise<Guardia>;
  updateGuardia(id: number, guardia: Partial<InsertGuardia>): Promise<Guardia>;
  deleteGuardia(id: number): Promise<void>;

  // Assignacio Guardia operations
  getAssignacionsGuardia(): Promise<AssignacioGuardia[]>;
  getAssignacionsGuardiaByProfessor(professorId: number): Promise<AssignacioGuardia[]>;
  getAssignacionsGuardiaByGuardia(guardiaId: number): Promise<AssignacioGuardia[]>;
  createAssignacioGuardia(assignacio: InsertAssignacioGuardia): Promise<AssignacioGuardia>;
  updateAssignacioGuardia(id: number, assignacio: Partial<InsertAssignacioGuardia>): Promise<AssignacioGuardia>;
  deleteAssignacioGuardia(id: number): Promise<void>;

  // Tasca operations
  getTasques(): Promise<Tasca[]>;
  getTasquesByAssignacio(assignacioId: number): Promise<Tasca[]>;
  getTasquesPendents(): Promise<Tasca[]>;
  createTasca(tasca: InsertTasca): Promise<Tasca>;
  updateTasca(id: number, tasca: Partial<InsertTasca>): Promise<Tasca>;
  deleteTasca(id: number): Promise<void>;

  // Comunicacio operations
  getComunicacions(): Promise<Comunicacio[]>;
  getComunicacionsNoLlegides(userId: string): Promise<Comunicacio[]>;
  createComunicacio(comunicacio: InsertComunicacio): Promise<Comunicacio>;
  markComunicacioAsRead(id: number): Promise<void>;

  // File attachment operations
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachmentsByTasca(tascaId: number): Promise<Attachment[]>;
  deleteAttachment(id: number): Promise<void>;

  // Analytics and metrics
  createMetric(metric: Omit<Metric, 'id' | 'createdAt'>): Promise<void>;
  getGuardAssignmentStats(): Promise<any>;
  getProfessorWorkloadBalance(): Promise<any>;

  // AI predictions
  createPrediction(prediction: Omit<Prediction, 'id' | 'createdAt'>): Promise<Prediction>;
  getLatestPredictions(tipus: string, limit?: number): Promise<Prediction[]>;

  // Chat sessions
  createChatSession(userId: string): Promise<ChatSession>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  updateChatSession(id: number, session: Partial<ChatSession>): Promise<ChatSession>;
  getUserActiveChatSession(userId: string): Promise<ChatSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to get active academic year
  async getActiveAcademicYear(): Promise<number> {
    const [activeYear] = await db
      .select({ id: anysAcademics.id })
      .from(anysAcademics)
      .where(eq(anysAcademics.estat, 'actiu'))
      .limit(1);
    
    if (!activeYear) {
      throw new Error('No active academic year found');
    }
    
    return activeYear.id;
  }

  // Mètode auxiliar per obtenir l'any acadèmic actiu complet
  async getActiveAcademicYearFull(): Promise<any> {
    const [activeYear] = await db
      .select()
      .from(anysAcademics)
      .where(eq(anysAcademics.estat, 'actiu'))
      .limit(1);
    
    if (!activeYear) {
      throw new Error('No active academic year found');
    }
    
    return activeYear;
  }

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Professor operations
  async getProfessors(): Promise<Professor[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select().from(professors)
      .where(eq(professors.anyAcademicId, activeYear))
      .orderBy(professors.cognoms, professors.nom);
  }

  async getProfessor(id: number): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.id, id));
    return professor;
  }

  async getProfessorByUserId(userId: string): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.userId, userId));
    return professor;
  }

  async getProfessorByEmail(email: string): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.email, email));
    return professor;
  }

  async getProfessorByCode(code: string): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(
      or(
        eq(professors.codiProfessor, code),
        eq(professors.nom, code)
      )
    );
    return professor;
  }

  async createProfessor(professor: InsertProfessor): Promise<Professor> {
    const [newProfessor] = await db.insert(professors).values(professor).returning();
    return newProfessor;
  }

  async updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor> {
    const [updatedProfessor] = await db
      .update(professors)
      .set(professor)
      .where(eq(professors.id, id))
      .returning();
    return updatedProfessor;
  }

  async deleteProfessor(id: number): Promise<void> {
    await db.delete(professors).where(eq(professors.id, id));
  }

  async getAvailableProfessorsForGuard(guardiaId: number): Promise<any[]> {
    try {
      // Get guard details
      const [guardia] = await db
        .select()
        .from(guardies)
        .where(eq(guardies.id, guardiaId));
      
      if (!guardia) return [];

      // Get all professors for the active academic year
      const activeYear = await this.getActiveAcademicYear();
      const allProfessors = await db
        .select()
        .from(professors)
        .where(eq(professors.anyAcademicId, activeYear));

      // Get professors already assigned to this guard
      const assignedProfessors = await db
        .select({ professorId: assignacionsGuardia.professorId })
        .from(assignacionsGuardia)
        .where(eq(assignacionsGuardia.guardiaId, guardiaId));

      const assignedIds = assignedProfessors.map(a => a.professorId);

      // Get guard date and time info for availability check
      const guardDate = new Date(guardia.data);
      const dayOfWeek = guardDate.getDay() === 0 ? 7 : guardDate.getDay(); // Convert Sunday from 0 to 7

      // Get professors who have classes scheduled during the guard time
      const busyProfessors = await db
        .select({
          professorId: horaris.professorId,
          assignatura: horaris.assignatura,
          materiaId: horaris.materiaId
        })
        .from(horaris)
        .where(
          and(
            eq(horaris.anyAcademicId, activeYear),
            eq(horaris.diaSetmana, dayOfWeek),
            eq(horaris.horaInici, guardia.horaInici),
            eq(horaris.horaFi, guardia.horaFi),
            sql`${horaris.materiaId} IS NOT NULL` // Has a subject assigned
          )
        );

      const busyProfessorIds = busyProfessors.map(h => h.professorId);
      
      console.log(`Guard time: ${guardia.horaInici}-${guardia.horaFi}, Day: ${dayOfWeek}`);
      console.log(`Found ${busyProfessors.length} professors with classes scheduled`);
      console.log(`Busy professor IDs:`, busyProfessorIds);

      // Available professors are those who:
      // 1. Are not already assigned to this guard
      // 2. Don't have a class scheduled at this time
      const availableProfessors = allProfessors
        .filter(prof => 
          !assignedIds.includes(prof.id) && 
          !busyProfessorIds.includes(prof.id)
        )
        .map(prof => {
          return {
            ...prof,
            prioritat: 10, // Available for guard duty
            motiu: "Disponible per guàrdia",
            grupObjectiu: "",
            badgeVariant: 'default' as const,
            prioritatColor: 'bg-green-100 text-green-800'
          };
        })
        .sort((a, b) => `${a.cognoms} ${a.nom}`.localeCompare(`${b.cognoms} ${b.nom}`));

      console.log(`Found ${availableProfessors.length} available professors for guard ${guardiaId}`);
      return availableProfessors;

    } catch (error) {
      console.error('Error getting available professors:', error);
      return [];
    }
  }

  // Grup operations
  async getGrups(): Promise<Grup[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select().from(grups)
      .where(eq(grups.anyAcademicId, activeYear))
      .orderBy(grups.nivell, grups.nomGrup);
  }

  async getGrup(id: number): Promise<Grup | undefined> {
    const [grup] = await db.select().from(grups).where(eq(grups.id, id));
    return grup;
  }

  async createGrup(grup: InsertGrup): Promise<Grup> {
    const [newGrup] = await db.insert(grups).values(grup).returning();
    return newGrup;
  }

  async updateGrup(id: number, grup: Partial<InsertGrup>): Promise<Grup> {
    const [updatedGrup] = await db
      .update(grups)
      .set(grup)
      .where(eq(grups.id, id))
      .returning();
    return updatedGrup;
  }

  async deleteGrup(id: number): Promise<void> {
    await db.delete(grups).where(eq(grups.id, id));
  }

  // Alumne operations
  async getAlumnes(): Promise<Alumne[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select().from(alumnes)
      .where(eq(alumnes.anyAcademicId, activeYear))
      .orderBy(alumnes.cognoms, alumnes.nom);
  }

  async getAlumnesByGrup(grupId: number): Promise<Alumne[]> {
    return await db.select().from(alumnes).where(eq(alumnes.grupId, grupId));
  }

  async createAlumne(alumne: InsertAlumne): Promise<Alumne> {
    const [newAlumne] = await db.insert(alumnes).values(alumne).returning();
    return newAlumne;
  }

  async updateAlumne(id: number, alumne: Partial<InsertAlumne>): Promise<Alumne> {
    const [updatedAlumne] = await db
      .update(alumnes)
      .set(alumne)
      .where(eq(alumnes.id, id))
      .returning();
    return updatedAlumne;
  }

  async deleteAlumne(id: number): Promise<void> {
    await db.delete(alumnes).where(eq(alumnes.id, id));
  }

  // Aula operations
  async getAules(): Promise<Aula[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select().from(aules)
      .where(eq(aules.anyAcademicId, activeYear))
      .orderBy(aules.nomAula);
  }

  async getAula(id: number): Promise<Aula | undefined> {
    const [aula] = await db.select().from(aules).where(eq(aules.id, id));
    return aula;
  }

  async createAula(aula: InsertAula): Promise<Aula> {
    const [newAula] = await db.insert(aules).values(aula).returning();
    return newAula;
  }

  async updateAula(id: number, aula: Partial<InsertAula>): Promise<Aula> {
    const [updatedAula] = await db
      .update(aules)
      .set(aula)
      .where(eq(aules.id, id))
      .returning();
    return updatedAula;
  }

  async deleteAula(id: number): Promise<void> {
    await db.delete(aules).where(eq(aules.id, id));
  }

  // Materia operations
  async getMateries(): Promise<Materia[]> {
    const activeAcademicYear = await this.getActiveAcademicYear();
    return await db.select().from(materies).where(eq(materies.anyAcademicId, activeAcademicYear));
  }

  async getMateria(id: number): Promise<Materia | undefined> {
    const [materia] = await db.select().from(materies).where(eq(materies.id, id));
    return materia;
  }

  async createMateria(materia: InsertMateria): Promise<Materia> {
    const activeAcademicYear = await this.getActiveAcademicYear();
    const [newMateria] = await db.insert(materies).values({
      ...materia,
      anyAcademicId: activeAcademicYear
    }).returning();
    return newMateria;
  }

  async updateMateria(id: number, materia: Partial<InsertMateria>): Promise<Materia> {
    const [updatedMateria] = await db
      .update(materies)
      .set(materia)
      .where(eq(materies.id, id))
      .returning();
    return updatedMateria;
  }

  async deleteMateria(id: number): Promise<void> {
    await db.delete(materies).where(eq(materies.id, id));
  }

  // Horari operations
  async getHorari(id: number): Promise<Horari | undefined> {
    const [horari] = await db.select().from(horaris).where(eq(horaris.id, id));
    return horari;
  }

  async getHoraris(): Promise<HorariWithRelations[]> {
    const activeYear = await this.getActiveAcademicYear();
    console.log('Active academic year ID:', activeYear);
    
    const result = await db
      .select({
        id: horaris.id,
        professorId: horaris.professorId,
        grupId: horaris.grupId,
        aulaId: horaris.aulaId,
        diaSetmana: horaris.diaSetmana,
        horaInici: horaris.horaInici,
        horaFi: horaris.horaFi,
        assignatura: horaris.assignatura,
        createdAt: horaris.createdAt,
        anyAcademicId: horaris.anyAcademicId,
        materiaId: horaris.materiaId,
        professor: {
          id: professors.id,
          nom: professors.nom,
          cognoms: professors.cognoms,
        },
        grup: {
          id: grups.id,
          nomGrup: grups.nomGrup,
        },
        aula: {
          id: aules.id,
          nomAula: aules.nomAula,
        },
        materia: {
          id: materies.id,
          nom: materies.nom,
          codi: materies.codi,
        },
      })
      .from(horaris)
      .leftJoin(professors, eq(horaris.professorId, professors.id))
      .leftJoin(grups, eq(horaris.grupId, grups.id))
      .leftJoin(aules, eq(horaris.aulaId, aules.id))
      .leftJoin(materies, eq(horaris.materiaId, materies.id))
      .where(eq(horaris.anyAcademicId, activeYear))
      .orderBy(horaris.diaSetmana, horaris.horaInici);
      
    console.log('Horaris found for active year:', result.length);
    return result;
  }

  async getHorarisByProfessor(professorId: number): Promise<Horari[]> {
    return await db.select().from(horaris).where(eq(horaris.professorId, professorId));
  }

  async getHorarisByGrup(grupId: number): Promise<Horari[]> {
    return await db.select().from(horaris).where(eq(horaris.grupId, grupId));
  }

  async createHorari(horari: InsertHorari): Promise<Horari> {
    const [newHorari] = await db.insert(horaris).values(horari).returning();
    return newHorari;
  }

  async updateHorari(id: number, horari: Partial<InsertHorari>): Promise<Horari> {
    const [updatedHorari] = await db
      .update(horaris)
      .set(horari)
      .where(eq(horaris.id, id))
      .returning();
    return updatedHorari;
  }

  async deleteHorari(id: number): Promise<void> {
    await db.delete(horaris).where(eq(horaris.id, id));
  }

  // Sortida operations
  async getSortida(id: number): Promise<SortidaWithRelations | undefined> {
    const activeYear = await this.getActiveAcademicYear();
    const [result] = await db.select({
      id: sortides.id,
      nomSortida: sortides.nomSortida,
      dataInici: sortides.dataInici,
      dataFi: sortides.dataFi,
      grupId: sortides.grupId,
      descripcio: sortides.descripcio,
      lloc: sortides.lloc,
      responsableId: sortides.responsableId,
      createdAt: sortides.createdAt,
      grupNom: grups.nomGrup,
      responsableNom: professors.nom,
      responsableCognoms: professors.cognoms,
    }).from(sortides)
      .leftJoin(grups, eq(sortides.grupId, grups.id))
      .leftJoin(professors, eq(sortides.responsableId, professors.id))
      .where(and(eq(sortides.anyAcademicId, activeYear), eq(sortides.id, id)))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result,
      responsableFullName: result.responsableNom && result.responsableCognoms 
        ? `${result.responsableNom} ${result.responsableCognoms}` 
        : undefined,
      grup: result.grupNom ? {
        id: result.grupId!,
        nomGrup: result.grupNom,
      } : null,
      responsable: result.responsableNom ? {
        id: result.responsableId!,
        nom: result.responsableNom,
        cognoms: result.responsableCognoms!,
        fullName: `${result.responsableNom} ${result.responsableCognoms}`,
      } : null,
    };
  }

  async getSortides(): Promise<SortidaWithRelations[]> {
    const activeYear = await this.getActiveAcademicYear();
    
    // Filtrar sortides que NO tenen substitucions assignades (tasques de substitució)
    const rawResults = await db.select({
      id: sortides.id,
      nomSortida: sortides.nomSortida,
      dataInici: sortides.dataInici,
      dataFi: sortides.dataFi,
      grupId: sortides.grupId,
      descripcio: sortides.descripcio,
      lloc: sortides.lloc,
      responsableId: sortides.responsableId,
      createdAt: sortides.createdAt,
      grupNom: grups.nomGrup,
      responsableNom: professors.nom,
      responsableCognoms: professors.cognoms,
    }).from(sortides)
      .leftJoin(grups, eq(sortides.grupId, grups.id))
      .leftJoin(professors, eq(sortides.responsableId, professors.id))
      .leftJoin(tasques, eq(tasques.sortidaId, sortides.id))
      .where(
        and(
          eq(sortides.anyAcademicId, activeYear),
          isNull(tasques.id) // Només sortides sense tasques de substitució
        )
      )
      .orderBy(desc(sortides.dataInici));

    return rawResults.map(result => ({
      ...result,
      responsableFullName: result.responsableNom && result.responsableCognoms 
        ? `${result.responsableNom} ${result.responsableCognoms}` 
        : undefined,
      grup: result.grupNom ? {
        id: result.grupId!,
        nomGrup: result.grupNom,
      } : null,
      responsable: result.responsableNom ? {
        id: result.responsableId!,
        nom: result.responsableNom,
        cognoms: result.responsableCognoms!,
        fullName: `${result.responsableNom} ${result.responsableCognoms}`,
      } : null,
    }));
  }

  async getSortidesThisWeek(): Promise<SortidaWithRelations[]> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const rawResults = await db.select({
      id: sortides.id,
      nomSortida: sortides.nomSortida,
      dataInici: sortides.dataInici,
      dataFi: sortides.dataFi,
      grupId: sortides.grupId,
      descripcio: sortides.descripcio,
      lloc: sortides.lloc,
      responsableId: sortides.responsableId,
      createdAt: sortides.createdAt,
      grupNom: grups.nomGrup,
      responsableNom: professors.nom,
      responsableCognoms: professors.cognoms,
    }).from(sortides)
      .leftJoin(grups, eq(sortides.grupId, grups.id))
      .leftJoin(professors, eq(sortides.responsableId, professors.id))
      .where(between(sortides.dataInici, startOfWeek, endOfWeek));

    return rawResults.map(result => ({
      ...result,
      responsableFullName: result.responsableNom && result.responsableCognoms 
        ? `${result.responsableNom} ${result.responsableCognoms}` 
        : undefined,
      grup: result.grupNom ? {
        id: result.grupId!,
        nomGrup: result.grupNom,
      } : null,
      responsable: result.responsableNom ? {
        id: result.responsableId!,
        nom: result.responsableNom,
        cognoms: result.responsableCognoms!,
        fullName: `${result.responsableNom} ${result.responsableCognoms}`,
      } : null,
    }));
  }

  async createSortida(sortida: InsertSortida): Promise<Sortida> {
    const [newSortida] = await db.insert(sortides).values(sortida).returning();
    
    // Generar guardies automàticament quan es crea la sortida
    if (newSortida.responsableId) {
      await this.generateGuardiesForSortida(newSortida.id, newSortida.responsableId, newSortida.dataInici, newSortida.dataFi, newSortida.anyAcademicId);
    }
    
    return newSortida;
  }

  async updateSortida(id: number, sortida: Partial<InsertSortida>): Promise<Sortida> {
    const [updatedSortida] = await db
      .update(sortides)
      .set(sortida)
      .where(eq(sortides.id, id))
      .returning();
    return updatedSortida;
  }

  async deleteSortida(id: number): Promise<void> {
    // Eliminar guardies relacionades amb aquesta sortida
    await db.delete(guardies).where(eq(guardies.sortidaId, id));
    await db.delete(sortides).where(eq(sortides.id, id));
  }

  // Generació automàtica de guardies per sortides
  async generateGuardiesForSortida(sortidaId: number, professorId: number, dataInici: Date, dataFi: Date, anyAcademicId: number): Promise<void> {
    // Obtenir horaris del professor durant el període de la sortida
    const horarisAfectats = await db.select()
      .from(horaris)
      .where(and(
        eq(horaris.professorId, professorId),
        eq(horaris.anyAcademicId, anyAcademicId)
      ));

    if (horarisAfectats.length === 0) {
      return; // No hi ha horaris a substituir
    }

    // Generar dates durant el període de la sortida
    const dates: Date[] = [];
    const currentDate = new Date(dataInici);
    while (currentDate <= dataFi) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Per cada data, generar guardies per les classes del professor
    for (const data of dates) {
      const diaSetmana = data.getDay(); // 0=diumenge, 1=dilluns, etc.
      
      // Filtrar horaris per dia de la setmana (convertir a format 1-7 on 1=dilluns)
      const diaSetmanaAjustat = diaSetmana === 0 ? 7 : diaSetmana;
      const horarisDelDia = horarisAfectats.filter(h => h.diaSetmana === diaSetmanaAjustat);

      for (const horari of horarisDelDia) {
        // Crear una guàrdia per cada classe afectada
        await db.insert(guardies).values({
          anyAcademicId,
          sortidaId,
          horariOriginalId: horari.id,
          professorOriginalId: professorId,
          professorSubstitutId: null, // Sense assignar inicialment
          data: data.toISOString().split('T')[0], // Format YYYY-MM-DD
          horaInici: horari.horaInici,
          horaFi: horari.horaFi,
          tipusGuardia: "sortida",
          estat: "pendent",
          lloc: horari.aulaId ? `Aula ${horari.aulaId}` : null,
          observacions: `Substitució per sortida: ${sortidaId}`,
          comunicacioEnviada: false
        });
      }
    }
  }

  // SISTEMA UNIFICAT DE GUARDIES - Operacions principals
  async getGuardies(): Promise<Guardia[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select({
      id: guardies.id,
      anyAcademicId: guardies.anyAcademicId,
      sortidaId: guardies.sortidaId,
      horariOriginalId: guardies.horariOriginalId,
      professorOriginalId: guardies.professorOriginalId,
      professorSubstitutId: guardies.professorSubstitutId,
      data: guardies.data,
      horaInici: guardies.horaInici,
      horaFi: guardies.horaFi,
      tipusGuardia: guardies.tipusGuardia,
      estat: guardies.estat,
      lloc: guardies.lloc,
      observacions: guardies.observacions,
      comunicacioEnviada: guardies.comunicacioEnviada,
      createdAt: guardies.createdAt,
    })
    .from(guardies)
    .where(eq(guardies.anyAcademicId, activeYear))
    .orderBy(desc(guardies.data), guardies.horaInici);
  }

  async getGuardiaById(id: number): Promise<Guardia | undefined> {
    const [guardia] = await db.select().from(guardies).where(eq(guardies.id, id));
    return guardia;
  }

  async getGuardiesAvui(): Promise<Guardia[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(guardies).where(eq(guardies.data, today));
  }

  async getGuardiesByDate(date: string): Promise<Guardia[]> {
    return await db.select().from(guardies).where(eq(guardies.data, date));
  }

  async createGuardia(guardia: InsertGuardia): Promise<Guardia> {
    const [newGuardia] = await db.insert(guardies).values(guardia).returning();
    return newGuardia;
  }

  async updateGuardia(id: number, guardia: Partial<InsertGuardia>): Promise<Guardia> {
    const [updatedGuardia] = await db
      .update(guardies)
      .set(guardia)
      .where(eq(guardies.id, id))
      .returning();
    return updatedGuardia;
  }

  async deleteGuardia(id: number): Promise<void> {
    await db.delete(guardies).where(eq(guardies.id, id));
  }

  // Assignacio Guardia operations
  async getAssignacionsGuardia(): Promise<AssignacioGuardia[]> {
    return await db.select().from(assignacionsGuardia).orderBy(desc(assignacionsGuardia.timestampAsg));
  }

  async getAssignacionsGuardiaByProfessor(professorId: number): Promise<AssignacioGuardia[]> {
    return await db.select().from(assignacionsGuardia)
      .where(eq(assignacionsGuardia.professorId, professorId));
  }

  async getAssignacionsGuardiaByGuardia(guardiaId: number): Promise<AssignacioGuardia[]> {
    return await db.select().from(assignacionsGuardia)
      .where(eq(assignacionsGuardia.guardiaId, guardiaId));
  }

  async createAssignacioGuardia(assignacio: InsertAssignacioGuardia): Promise<AssignacioGuardia> {
    const [newAssignacio] = await db.insert(assignacionsGuardia).values(assignacio).returning();
    return newAssignacio;
  }

  async updateAssignacioGuardia(id: number, assignacio: Partial<InsertAssignacioGuardia>): Promise<AssignacioGuardia> {
    const [updatedAssignacio] = await db
      .update(assignacionsGuardia)
      .set(assignacio)
      .where(eq(assignacionsGuardia.id, id))
      .returning();
    return updatedAssignacio;
  }

  async deleteAssignacioGuardia(id: number): Promise<void> {
    await db.delete(assignacionsGuardia).where(eq(assignacionsGuardia.id, id));
  }

  // Academic year operations
  async getAcademicYears(): Promise<any[]> {
    return await db.select().from(anysAcademics).orderBy(desc(anysAcademics.dataInici));
  }



  async setActiveAcademicYear(yearId: number): Promise<void> {
    await db
      .update(anysAcademics)
      .set({ estat: "inactiu" });
    
    await db
      .update(anysAcademics)
      .set({ estat: "actiu" })
      .where(eq(anysAcademics.id, yearId));
  }

  // Missing functions that are referenced in routes
  async getClassesToSubstitute(params: { sortidaId: number; anyAcademicId: number }): Promise<any[]> {
    const { sortidaId, anyAcademicId } = params;
    
    console.log(`DEBUG getClassesToSubstitute: sortidaId=${sortidaId}, anyAcademicId=${anyAcademicId}`);
    
    // Get sortida details
    const [sortida] = await db.select().from(sortides).where(eq(sortides.id, sortidaId)).limit(1);
    if (!sortida) {
      console.log('DEBUG: Sortida no trobada');
      return [];
    }
    
    console.log(`DEBUG: Sortida trobada - responsableId=${sortida.responsableId}, dataInici=${sortida.dataInici}, dataFi=${sortida.dataFi}`);

    // Check if professor exists
    if (!sortida.responsableId) {
      console.log('DEBUG: No hi ha professor responsable assignat');
      return [];
    }

    // Get professor's schedule during the trip period
    const horarisAfectats = await db.select({
      id: horaris.id,
      professorId: horaris.professorId,
      grupId: horaris.grupId,
      aulaId: horaris.aulaId,
      materiaId: horaris.materiaId,
      diaSetmana: horaris.diaSetmana,
      horaInici: horaris.horaInici,
      horaFi: horaris.horaFi,
      assignatura: horaris.assignatura,
      professorNom: professors.nom,
      professorCognoms: professors.cognoms,
      grupNom: grups.nomGrup,
      aulaNom: aules.nomAula,
      materiaNom: materies.nom
    })
    .from(horaris)
    .leftJoin(professors, eq(horaris.professorId, professors.id))
    .leftJoin(grups, eq(horaris.grupId, grups.id))
    .leftJoin(aules, eq(horaris.aulaId, aules.id))
    .leftJoin(materies, eq(horaris.materiaId, materies.id))
    .where(and(
      eq(horaris.professorId, sortida.responsableId),
      eq(horaris.anyAcademicId, anyAcademicId)
    ));

    console.log(`DEBUG: Horaris trobats per professor ${sortida.responsableId}: ${horarisAfectats.length}`);

    // Generate classes for each day of the trip
    const classes: any[] = [];
    const startDate = new Date(sortida.dataInici);
    const endDate = new Date(sortida.dataFi);
    
    console.log(`DEBUG: Període sortida - ${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // Convert Sunday=0 to Sunday=7
      
      console.log(`DEBUG: Processant dia ${d.toISOString().split('T')[0]} (dia setmana: ${dayOfWeek})`);
      
      const classesForDay = horarisAfectats.filter(h => h.diaSetmana === dayOfWeek);
      console.log(`DEBUG: Classes trobades per dia ${dayOfWeek}: ${classesForDay.length}`);
      
      for (const horari of classesForDay) {
        const classe = {
          data: d.toISOString().split('T')[0],
          horaInici: horari.horaInici,
          horaFi: horari.horaFi,
          assignatura: horari.assignatura || 'Classe sense assignatura',
          grup: horari.grupNom || 'Grup desconegut',
          aula: horari.aulaNom || 'Aula no assignada',
          professor: `${horari.professorNom} ${horari.professorCognoms}`,
          horariId: horari.id,
          professorId: horari.professorId
        };
        console.log(`DEBUG: Afegint classe - ${classe.assignatura} a les ${classe.horaInici}`);
        classes.push(classe);
      }
    }

    console.log(`DEBUG: Total classes a substituir: ${classes.length}`);
    return classes;
  }

  async getTasques(): Promise<Tasca[]> {
    return await db.select().from(tasques).orderBy(desc(tasques.createdAt));
  }

  async getTascaById(id: number): Promise<Tasca | undefined> {
    const [tasca] = await db.select().from(tasques).where(eq(tasques.id, id)).limit(1);
    return tasca;
  }

  async createTasca(tasca: InsertTasca): Promise<Tasca> {
    const [newTasca] = await db.insert(tasques).values(tasca).returning();
    return newTasca;
  }

  async updateTasca(id: number, tasca: Partial<InsertTasca>): Promise<Tasca> {
    const [updatedTasca] = await db
      .update(tasques)
      .set(tasca)
      .where(eq(tasques.id, id))
      .returning();
    return updatedTasca;
  }

  async deleteTasca(id: number): Promise<void> {
    await db.delete(tasques).where(eq(tasques.id, id));
  }

  async getComunicacions(): Promise<Comunicacio[]> {
    return await db.select().from(comunicacions).orderBy(desc(comunicacions.createdAt));
  }

  async getComunicacioById(id: number): Promise<Comunicacio | undefined> {
    const [comunicacio] = await db.select().from(comunicacions).where(eq(comunicacions.id, id)).limit(1);
    return comunicacio;
  }

  async createComunicacio(comunicacio: InsertComunicacio): Promise<Comunicacio> {
    const [newComunicacio] = await db.insert(comunicacions).values(comunicacio).returning();
    return newComunicacio;
  }

  async updateComunicacio(id: number, comunicacio: Partial<InsertComunicacio>): Promise<Comunicacio> {
    const [updatedComunicacio] = await db
      .update(comunicacions)
      .set(comunicacio)
      .where(eq(comunicacions.id, id))
      .returning();
    return updatedComunicacio;
  }

  async deleteComunicacio(id: number): Promise<void> {
    await db.delete(comunicacions).where(eq(comunicacions.id, id));
  }

  async getAttachments(): Promise<Attachment[]> {
    return await db.select().from(attachments).orderBy(desc(attachments.createdAt));
  }

  async getAttachmentById(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
    return attachment;
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [newAttachment] = await db.insert(attachments).values(attachment).returning();
    return newAttachment;
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  async getMetrics(): Promise<Metric[]> {
    return await db.select().from(metrics).orderBy(desc(metrics.createdAt));
  }

  async createMetric(metric: Omit<Metric, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(metrics).values(metric);
  }

  async getPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt));
  }

  async createPrediction(prediction: Omit<Prediction, 'id' | 'createdAt'>): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getLatestPredictions(tipus: string, limit: number = 10): Promise<Prediction[]> {
    return await db.select()
      .from(predictions)
      .where(eq(predictions.tipus, tipus))
      .orderBy(desc(predictions.createdAt))
      .limit(limit);
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).orderBy(desc(chatSessions.createdAt));
  }

  async createChatSession(session: any): Promise<ChatSession> {
    const [newSession] = await db.insert(chatSessions).values(session).returning();
    return newSession;
  }

  async updateChatSession(id: number, updates: any): Promise<ChatSession> {
    const [updatedSession] = await db
      .update(chatSessions)
      .set(updates)
      .where(eq(chatSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteChatSession(id: number): Promise<void> {
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  async createSortidaProfessor(sortidaProfessor: any): Promise<any> {
    const [newSortidaProfessor] = await db.insert(sortidaProfessors).values(sortidaProfessor).returning();
    return newSortidaProfessor;
  }

  async getSortidaProfessorsBySortida(sortidaId: number): Promise<any[]> {
    return await db.select().from(sortidaProfessors).where(eq(sortidaProfessors.sortidaId, sortidaId));
  }

  async deleteSortidaProfessor(sortidaId: number, professorId: number): Promise<void> {
    await db.delete(sortidaProfessors)
      .where(and(
        eq(sortidaProfessors.sortidaId, sortidaId),
        eq(sortidaProfessors.professorId, professorId)
      ));
  }

  async createSortidaAlumne(sortidaAlumne: any): Promise<any> {
    const [newSortidaAlumne] = await db.insert(sortidaAlumnes).values(sortidaAlumne).returning();
    return newSortidaAlumne;
  }

  async getSortidaAlumnesBySortida(sortidaId: number): Promise<any[]> {
    return await db.select().from(sortidaAlumnes).where(eq(sortidaAlumnes.sortidaId, sortidaId));
  }

  async deleteSortidaAlumne(sortidaId: number, alumneId: number): Promise<void> {
    await db.delete(sortidaAlumnes)
      .where(and(
        eq(sortidaAlumnes.sortidaId, sortidaId),
        eq(sortidaAlumnes.alumneId, alumneId)
      ));
  }

  async createSortidaSubstitucio(substitucio: any): Promise<any> {
    const [newSubstitucio] = await db.insert(sortidaSubstitucions).values(substitucio).returning();
    return newSubstitucio;
  }

  async getSortidaSubstitucions(): Promise<any[]> {
    return await db.select().from(sortidaSubstitucions).orderBy(desc(sortidaSubstitucions.createdAt));
  }

  async getSortidaSubstituciosBySortida(sortidaId: number): Promise<any[]> {
    return await db.select().from(sortidaSubstitucions).where(eq(sortidaSubstitucions.sortidaId, sortidaId));
  }

  async updateSortidaSubstitucio(id: number, updates: any): Promise<any> {
    const [updatedSubstitucio] = await db
      .update(sortidaSubstitucions)
      .set(updates)
      .where(eq(sortidaSubstitucions.id, id))
      .returning();
    return updatedSubstitucio;
  }

  async deleteSortidaSubstitucio(id: number): Promise<void> {
    await db.delete(sortidaSubstitucions).where(eq(sortidaSubstitucions.id, id));
  }

  // Missing academic year functions
  async getAnysAcademics(): Promise<any[]> {
    return await this.getAcademicYears();
  }

  async getAnyAcademic(id: number): Promise<any> {
    const [year] = await db.select().from(anysAcademics).where(eq(anysAcademics.id, id)).limit(1);
    return year;
  }

  async createAnyAcademic(data: any): Promise<any> {
    const [newYear] = await db.insert(anysAcademics).values(data).returning();
    return newYear;
  }

  async updateAnyAcademic(id: number, data: any): Promise<any> {
    const [updatedYear] = await db
      .update(anysAcademics)
      .set(data)
      .where(eq(anysAcademics.id, id))
      .returning();
    return updatedYear;
  }

  async deleteAnyAcademic(id: number): Promise<void> {
    await db.delete(anysAcademics).where(eq(anysAcademics.id, id));
  }



  // New enhanced methods for advanced substitution management
  async getHoresAlliberadesPorSortida(sortidaId: number): Promise<any[]> {
    try {
      const activeYear = await this.getActiveAcademicYearFull();
      if (!activeYear) {
        throw new Error("No hi ha cap any acadèmic actiu");
      }

      // Get the trip information first
      const [sortida] = await db.select().from(sortides).where(eq(sortides.id, sortidaId)).limit(1);
      if (!sortida) {
        throw new Error("Sortida no trobada");
      }

      // Get the group that is going on the trip
      if (!sortida.grupId) {
        throw new Error("La sortida no té un grup assignat");
      }

      // Get all schedules for this group during the trip dates
      const schedules = await db
        .select({
          horariId: horaris.id,
          diaSetmana: horaris.diaSetmana,
          horaInici: horaris.horaInici,
          horaFi: horaris.horaFi,
          professorId: horaris.professorId,
          assignatura: horaris.assignatura,
          aulaId: horaris.aulaId,
          professorNom: professors.nom,
          professorCognoms: professors.cognoms,
          aulaNom: aules.nomAula
        })
        .from(horaris)
        .leftJoin(professors, eq(horaris.professorId, professors.id))
        .leftJoin(aules, eq(horaris.aulaId, aules.id))
        .where(and(
          eq(horaris.grupId, sortida.grupId),
          eq(horaris.anyAcademicId, activeYear.id)
        ))
        .orderBy(horaris.diaSetmana, horaris.horaInici);

      return schedules.map(schedule => ({
        diaSetmana: schedule.diaSetmana,
        horaInici: schedule.horaInici,
        horaFi: schedule.horaFi,
        professorId: schedule.professorId,
        professorNom: `${schedule.professorNom} ${schedule.professorCognoms}`.trim(),
        assignatura: schedule.assignatura,
        aulaId: schedule.aulaId,
        aulaNom: schedule.aulaNom,
        horariId: schedule.horariId
      }));
    } catch (error) {
      console.error('Error getting hores alliberades:', error);
      throw error;
    }
  }

  async getProfessorsDisponiblesPerHora(diaSetmana: number, horaInici: string, horaFi: string): Promise<any[]> {
    try {
      const activeYear = await this.getActiveAcademicYearFull();
      if (!activeYear) {
        throw new Error("No hi ha cap any acadèmic actiu");
      }

      // Get professors with guard duty at this time
      const professorsAmbGuardia = await db
        .select({
          id: professors.id,
          nom: professors.nom,
          cognoms: professors.cognoms,
          guardiesRealiitzades: sql<number>`COUNT(assignacionsGuardia.id)`.as('guardiesRealiitzades')
        })
        .from(professors)
        .leftJoin(assignacionsGuardia, eq(professors.id, assignacionsGuardia.professorId))
        .leftJoin(horaris, and(
          eq(professors.id, horaris.professorId),
          eq(horaris.diaSetmana, diaSetmana),
          eq(horaris.horaInici, horaInici),
          eq(horaris.anyAcademicId, activeYear.id)
        ))
        .where(and(
          eq(professors.anyAcademicId, activeYear.id),
          isNull(horaris.id) // Not teaching at this time
        ))
        .groupBy(professors.id, professors.nom, professors.cognoms);

      // Get professors who are free at this time (not teaching)
      const professorsLliures = await db
        .select({
          id: professors.id,
          nom: professors.nom,
          cognoms: professors.cognoms,
          guardiesRealiitzades: sql<number>`COUNT(assignacionsGuardia.id)`.as('guardiesRealiitzades')
        })
        .from(professors)
        .leftJoin(assignacionsGuardia, eq(professors.id, assignacionsGuardia.professorId))
        .leftJoin(horaris, and(
          eq(professors.id, horaris.professorId),
          eq(horaris.diaSetmana, diaSetmana),
          eq(horaris.horaInici, horaInici),
          eq(horaris.anyAcademicId, activeYear.id)
        ))
        .where(and(
          eq(professors.anyAcademicId, activeYear.id),
          isNull(horaris.id) // Not teaching at this time
        ))
        .groupBy(professors.id, professors.nom, professors.cognoms);

      // Combine and prioritize results
      const professorsDisponibles = professorsLliures.map(prof => ({
        id: prof.id,
        nom: prof.nom,
        cognoms: prof.cognoms,
        prioritat: 1, // Lower number = higher priority
        guardiesRealiitzades: prof.guardiesRealiitzades || 0,
        color: 'Lliure',
        motiu: 'Professor lliure en aquesta hora',
        tipus: 'Lliure' as const,
        disponible: true
      }));

      // Sort by guard workload (fewer guards = higher priority)
      return professorsDisponibles.sort((a, b) => a.guardiesRealiitzades - b.guardiesRealiitzades);
    } catch (error) {
      console.error('Error getting professors disponibles per hora:', error);
      throw error;
    }
  }

  async crearSubstitucionsMultiple(substitucionsData: any[]): Promise<any[]> {
    try {
      const activeYear = await this.getActiveAcademicYearFull();
      if (!activeYear) {
        throw new Error("No hi ha cap any acadèmic actiu");
      }

      const results = [];
      
      for (const substitucio of substitucionsData) {
        const newSubstitucio = await db.insert(sortidaSubstitucions).values({
          anyAcademicId: activeYear.id,
          sortidaId: substitucio.sortidaId,
          horariOriginalId: substitucio.horariId,
          professorOriginalId: substitucio.professorOriginalId,
          professorSubstitutId: substitucio.professorSubstitutId,
          estat: 'planificada',
          observacions: substitucio.observacions || '',
          comunicacioEnviada: false,
          createdAt: new Date()
        }).returning();
        
        results.push(newSubstitucio[0]);
      }

      return results;
    } catch (error) {
      console.error('Error creating multiple substitutions:', error);
      throw error;
    }
  }

  // Missing analytics functions
  async getGuardAssignmentStats(): Promise<any[]> {
    return [];
  }

  async getProfessorWorkloadBalance(): Promise<any[]> {
    return [];
  }

  // Chat session management for chatbot
  async getUserActiveChatSession(userId: string): Promise<any | null> {
    try {
      const activeYear = await this.getActiveAcademicYearFull();
      if (!activeYear) return null;

      const [session] = await db
        .select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.usuariId, userId),
          eq(chatSessions.anyAcademicId, activeYear.id),
          eq(chatSessions.tancada, false)
        ))
        .orderBy(desc(chatSessions.createdAt))
        .limit(1);
      
      return session || null;
    } catch (error) {
      console.error('Error getting user active chat session:', error);
      return null;
    }
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    try {
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, id))
        .limit(1);
      
      return session;
    } catch (error) {
      console.error('Error getting chat session:', error);
      return undefined;
    }
  }

  async getChatMessages(sessionId: string): Promise<any[]> {
    try {
      const sessionIdNum = parseInt(sessionId);
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionIdNum))
        .orderBy(asc(chatMessages.createdAt));
      
      return messages;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async addChatMessage(sessionId: string, role: string, content: string): Promise<any> {
    try {
      const sessionIdNum = parseInt(sessionId);
      
      // Update session with new message in JSON array and last activity
      const session = await this.getChatSession(sessionIdNum);
      if (session) {
        const currentMessages = Array.isArray(session.missatges) ? session.missatges : [];
        const newMessage = { role, content, timestamp: new Date().toISOString() };
        const updatedMessages = [...currentMessages, newMessage];
        
        await db
          .update(chatSessions)
          .set({ 
            missatges: updatedMessages,
            lastActivity: new Date()
          })
          .where(eq(chatSessions.id, sessionIdNum));
      }

      // Also store in separate messages table
      const [message] = await db
        .insert(chatMessages)
        .values({
          sessionId: sessionIdNum,
          role,
          content,
          createdAt: new Date()
        })
        .returning();
      
      return message;
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  // Communication functions
  async getComunicacionsNoLlegides(userId: string): Promise<Comunicacio[]> {
    try {
      const result = await db
        .select()
        .from(comunicacions)
        .where(and(
          eq(comunicacions.destinatariId, parseInt(userId)),
          eq(comunicacions.llegit, false)
        ))
        .orderBy(desc(comunicacions.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error getting unread communications:', error);
      return [];
    }
  }

  async markComunicacioAsRead(comunicacioId: number): Promise<void> {
    try {
      console.log(`Storage: Updating communication ${comunicacioId} to mark as read...`);
      const result = await db
        .update(comunicacions)
        .set({ llegit: true })
        .where(eq(comunicacions.id, comunicacioId))
        .returning({ id: comunicacions.id });
      
      console.log(`Storage: Update result:`, result);
      
      if (result.length === 0) {
        throw new Error(`Communication with ID ${comunicacioId} not found`);
      }
    } catch (error) {
      console.error(`Storage: Error marking communication ${comunicacioId} as read:`, error);
      throw error;
    }
  }

  // Task management functions
  async getTasquesByAssignacio(assignacioId: number): Promise<Tasca[]> {
    try {
      const result = await db
        .select()
        .from(tasques)
        .where(eq(tasques.assignaId, assignacioId))
        .orderBy(desc(tasques.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error getting tasks by assignment:', error);
      return [];
    }
  }

  async getTasquesPendents(): Promise<Tasca[]> {
    try {
      const result = await db
        .select()
        .from(tasques)
        .where(eq(tasques.estat, 'pendent'))
        .orderBy(desc(tasques.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error getting pending tasks:', error);
      return [];
    }
  }

  async getAttachmentsByTasca(tascaId: number): Promise<any[]> {
    try {
      // If there's no attachments table, return empty array
      return [];
    } catch (error) {
      console.error('Error getting attachments by task:', error);
      return [];
    }
  }

  // Guard details function
  async getGuardiesWithDetails(): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: guardies.id,
          data: guardies.data,
          horaInici: guardies.horaInici,
          horaFi: guardies.horaFi,
          tipusGuardia: guardies.tipusGuardia,
          lloc: guardies.lloc,
          estat: guardies.estat,
          anyAcademicId: guardies.anyAcademicId,
          sortidaId: guardies.sortidaId,
          professor: {
            id: professors.id,
            nom: professors.nom,
            cognoms: professors.cognoms
          }
        })
        .from(guardies)
        .leftJoin(assignacionsGuardia, eq(guardies.id, assignacionsGuardia.guardiaId))
        .leftJoin(professors, eq(assignacionsGuardia.professorId, professors.id))
        .orderBy(desc(guardies.data));
      
      return result;
    } catch (error) {
      console.error('Error getting guards with details:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
