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
import { eq, desc, and, or, sql, count, between, gte, lte, isNotNull, isNull } from "drizzle-orm";

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

  // Guardia operations
  getGuardies(): Promise<Guardia[]>;
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
        : null,
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
    await db.delete(sortides).where(eq(sortides.id, id));
  }

  // Guardia operations
  async getGuardies(): Promise<Guardia[]> {
    const activeYear = await this.getActiveAcademicYear();
    const guardiasWithAssignments = await db.select({
      id: guardies.id,
      data: guardies.data,
      horaInici: guardies.horaInici,
      horaFi: guardies.horaFi,
      tipusGuardia: guardies.tipusGuardia,
      estat: guardies.estat,
      lloc: guardies.lloc,
      observacions: guardies.observacions,
      createdAt: guardies.createdAt,
      anyAcademicId: guardies.anyAcademicId,
      // Include assignment data
      assignacions: sql`
        COALESCE(
          json_agg(
            json_build_object(
              'id', ${assignacionsGuardia.id},
              'professorId', ${assignacionsGuardia.professorId},
              'prioritat', ${assignacionsGuardia.prioritat},
              'estat', ${assignacionsGuardia.estat},
              'professor', json_build_object(
                'id', ${professors.id},
                'nom', ${professors.nom},
                'cognoms', ${professors.cognoms}
              )
            )
          ) FILTER (WHERE ${assignacionsGuardia.id} IS NOT NULL),
          '[]'::json
        )
      `
    })
    .from(guardies)
    .leftJoin(assignacionsGuardia, eq(guardies.id, assignacionsGuardia.guardiaId))
    .leftJoin(professors, eq(assignacionsGuardia.professorId, professors.id))
    .where(eq(guardies.anyAcademicId, activeYear))
    .groupBy(guardies.id)
    .orderBy(desc(guardies.data), guardies.horaInici);

    return guardiasWithAssignments;
  }

  async getGuardiesWithDetails(): Promise<any[]> {
    // Obtenir guardies regulars
    const guardiesRegulars = await db
      .select({
        id: guardies.id,
        data: guardies.data,
        hora: guardies.horaInici,
        tipusGuardia: guardies.tipusGuardia,
        categoria: guardies.estat,
        observacions: guardies.observacions,
        assignacioId: assignacionsGuardia.id,
        professor: sql`
          CASE 
            WHEN ${professors.id} IS NOT NULL THEN 
              json_build_object(
                'id', ${professors.id},
                'nom', ${professors.nom},
                'cognoms', ${professors.cognoms}
              )
            ELSE NULL
          END
        `,
        aula: sql`
          CASE 
            WHEN ${aules.id} IS NOT NULL THEN 
              json_build_object(
                'id', ${aules.id},
                'nom', ${aules.nomAula}
              )
            ELSE NULL
          END
        `
      })
      .from(guardies)
      .leftJoin(assignacionsGuardia, eq(guardies.id, assignacionsGuardia.guardiaId))
      .leftJoin(professors, eq(assignacionsGuardia.professorId, professors.id))
      .leftJoin(aules, eq(guardies.id, aules.id))
      .where(gte(guardies.data, new Date().toISOString().split('T')[0]))
      .orderBy(guardies.data, guardies.horaInici);

    // Obtenir substitucions actives (assignacions sense guardiaId)
    const substitucions = await db.execute(sql`
      SELECT 
        ag.assigna_id as id,
        COALESCE(s.data_inici::date, CURRENT_DATE) as data,
        COALESCE(
          SUBSTRING(t.descripcio FROM 'de ([0-9]{2}:[0-9]{2}:[0-9]{2})'),
          '09:00:00'
        ) as hora,
        'Substitució' as "tipusGuardia",
        ag.estat as categoria,
        CONCAT('Substitució - ', COALESCE(s.nom_sortida, t.titol)) as observacions,
        ag.assigna_id as "assignacioId",
        json_build_object(
          'id', p.professor_id,
          'nom', p.nom,
          'cognoms', p.cognoms
        ) as professor,
        NULL as aula
      FROM assignacions_guardia ag
      LEFT JOIN professors p ON ag.professor_id = p.professor_id
      LEFT JOIN tasques t ON t.assigna_id = ag.assigna_id
      LEFT JOIN sortides s ON t.descripcio LIKE CONCAT('%', s.nom_sortida, '%')
      WHERE ag.guardia_id IS NULL 
        AND ag.motiu = 'substitucio'
        AND ag.estat = 'assignada'
        AND ag.any_academic_id = (
          SELECT any_academic_id FROM anys_academics WHERE estat = 'actiu' LIMIT 1
        )
      ORDER BY ag.assigna_id DESC
    `);

    // Combinar resultats
    const substitucionsFormatted = substitucions.rows.map((sub: any) => ({
      id: `sub_${sub.id}`,
      data: sub.data,
      hora: sub.hora,
      tipusGuardia: sub.tipusGuardia,
      categoria: sub.categoria,
      observacions: sub.observacions,
      assignacioId: sub.assignacioId,
      professor: sub.professor,
      aula: sub.aula
    }));

    return [...guardiesRegulars, ...substitucionsFormatted];
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

  // Tasca operations
  async getTasques(): Promise<Tasca[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select().from(tasques)
      .where(eq(tasques.anyAcademicId, activeYear))
      .orderBy(desc(tasques.dataCreacio));
  }

  async getTasquesByAssignacio(assignacioId: number): Promise<Tasca[]> {
    return await db.select().from(tasques).where(eq(tasques.assignaId, assignacioId));
  }

  async getTasquesPendents(): Promise<Tasca[]> {
    return await db.select().from(tasques).where(eq(tasques.estat, 'pendent'));
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

  // Comunicacio operations
  async getComunicacions(): Promise<Comunicacio[]> {
    const activeYear = await this.getActiveAcademicYear();
    return await db.select().from(comunicacions)
      .where(eq(comunicacions.anyAcademicId, activeYear))
      .orderBy(desc(comunicacions.dataEnviament));
  }

  async getComunicacionsNoLlegides(userId: string): Promise<Comunicacio[]> {
    // This would need proper user linking logic
    return await db.select().from(comunicacions).where(eq(comunicacions.llegit, false));
  }

  async createComunicacio(comunicacio: InsertComunicacio): Promise<Comunicacio> {
    const [newComunicacio] = await db.insert(comunicacions).values(comunicacio).returning();
    return newComunicacio;
  }

  async markComunicacioAsRead(id: number): Promise<void> {
    await db.update(comunicacions).set({ llegit: true }).where(eq(comunicacions.id, id));
  }

  // File attachment operations
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [newAttachment] = await db.insert(attachments).values(attachment).returning();
    return newAttachment;
  }

  async getAttachmentsByTasca(tascaId: number): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.tascaId, tascaId));
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Analytics and metrics
  async createMetric(metric: Omit<Metric, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(metrics).values(metric);
  }

  async getGuardAssignmentStats(): Promise<any> {
    const activeYear = await this.getActiveAcademicYear();
    
    const stats = await db
      .select({
        professorId: assignacionsGuardia.professorId,
        count: count(assignacionsGuardia.id),
      })
      .from(assignacionsGuardia)
      .where(eq(assignacionsGuardia.anyAcademicId, activeYear))
      .groupBy(assignacionsGuardia.professorId);
    
    return stats;
  }

  async getProfessorWorkloadBalance(): Promise<any> {
    const activeYear = await this.getActiveAcademicYear();
    
    const balance = await db
      .select({
        professorId: assignacionsGuardia.professorId,
        guardCount: count(assignacionsGuardia.id),
      })
      .from(assignacionsGuardia)
      .leftJoin(guardies, eq(assignacionsGuardia.guardiaId, guardies.id))
      .where(eq(assignacionsGuardia.anyAcademicId, activeYear))
      .groupBy(assignacionsGuardia.professorId);
    
    return balance;
  }

  // AI predictions
  async createPrediction(prediction: Omit<Prediction, 'id' | 'createdAt'>): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getLatestPredictions(tipus: string, limit: number = 10): Promise<Prediction[]> {
    return await db.select().from(predictions)
      .where(eq(predictions.tipus, tipus))
      .orderBy(desc(predictions.createdAt))
      .limit(limit);
  }

  // Chat sessions
  async createChatSession(userId: string): Promise<ChatSession> {
    const activeYear = await this.getActiveAcademicYear();
    const [session] = await db.insert(chatSessions).values({
      anyAcademicId: activeYear,
      usuariId: userId,
      missatges: [],
    }).returning();
    return session;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  }

  async updateChatSession(id: number, session: Partial<ChatSession>): Promise<ChatSession> {
    const [updatedSession] = await db
      .update(chatSessions)
      .set({...session, lastActivity: new Date()})
      .where(eq(chatSessions.id, id))
      .returning();
    return updatedSession;
  }

  async getUserActiveChatSession(userId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions)
      .where(and(eq(chatSessions.usuariId, userId), eq(chatSessions.tancada, false)))
      .orderBy(desc(chatSessions.lastActivity))
      .limit(1);
    return session;
  }

  // Academic Year operations
  async getAnysAcademics(): Promise<any[]> {
    return await db.select().from(anysAcademics).orderBy(desc(anysAcademics.createdAt));
  }

  async getAnyAcademic(id: number): Promise<any | undefined> {
    const [anyAcademic] = await db.select().from(anysAcademics).where(eq(anysAcademics.id, id));
    return anyAcademic;
  }

  async createAnyAcademic(anyAcademicData: any): Promise<any> {
    const [newAnyAcademic] = await db.insert(anysAcademics).values(anyAcademicData).returning();
    return newAnyAcademic;
  }

  async updateAnyAcademic(id: number, anyAcademicData: any): Promise<any> {
    // Si el nuevo estado es "actiu", primero cambiar el año académico activo anterior a "finalitzat"
    if (anyAcademicData.estat === 'actiu') {
      // Buscar el año académico actualmente activo (si existe)
      const currentActiveYear = await db
        .select()
        .from(anysAcademics)
        .where(eq(anysAcademics.estat, 'actiu'))
        .limit(1);

      // Si hay un año académico activo y no es el mismo que estamos actualizando
      if (currentActiveYear.length > 0 && currentActiveYear[0].id !== id) {
        // Cambiar el año académico anterior a "finalitzat"
        await db
          .update(anysAcademics)
          .set({ estat: 'finalitzat' })
          .where(eq(anysAcademics.id, currentActiveYear[0].id));
        
        console.log(`Any acadèmic ${currentActiveYear[0].nom} (ID: ${currentActiveYear[0].id}) canviat a "finalitzat"`);
      }
    }

    // Actualizar el año académico solicitado
    const [updatedAnyAcademic] = await db
      .update(anysAcademics)
      .set(anyAcademicData)
      .where(eq(anysAcademics.id, id))
      .returning();
    
    console.log(`Any acadèmic ${updatedAnyAcademic.nom} (ID: ${id}) actualitzat a estat "${updatedAnyAcademic.estat}"`);
    return updatedAnyAcademic;
  }

  async deleteAnyAcademic(id: number): Promise<void> {
    await db.delete(anysAcademics).where(eq(anysAcademics.id, id));
  }

  // Mètodes per gestionar substitucions de sortides
  async getSortidaProfessors(sortidaId: number): Promise<SortidaProfessor[]> {
    return await db
      .select()
      .from(sortidaProfessors)
      .where(eq(sortidaProfessors.sortidaId, sortidaId));
  }

  async createSortidaProfessor(data: InsertSortidaProfessor): Promise<SortidaProfessor> {
    const [newRecord] = await db.insert(sortidaProfessors).values(data).returning();
    return newRecord;
  }

  async getSortidaAlumnes(sortidaId: number): Promise<SortidaAlumne[]> {
    return await db
      .select()
      .from(sortidaAlumnes)
      .where(eq(sortidaAlumnes.sortidaId, sortidaId));
  }

  async createSortidaAlumne(data: InsertSortidaAlumne): Promise<SortidaAlumne> {
    const [newRecord] = await db.insert(sortidaAlumnes).values(data).returning();
    return newRecord;
  }

  async getSortidaSubstitucions(sortidaId: number): Promise<SortidaSubstitucio[]> {
    return await db
      .select()
      .from(sortidaSubstitucions)
      .where(eq(sortidaSubstitucions.sortidaId, sortidaId));
  }

  async createSortidaSubstitucio(data: InsertSortidaSubstitucio): Promise<SortidaSubstitucio> {
    const [newRecord] = await db.insert(sortidaSubstitucions).values(data).returning();
    return newRecord;
  }

  async updateSortidaSubstitucio(id: number, data: Partial<InsertSortidaSubstitucio>): Promise<SortidaSubstitucio> {
    const [updated] = await db
      .update(sortidaSubstitucions)
      .set(data)
      .where(eq(sortidaSubstitucions.id, id))
      .returning();
    return updated;
  }

  // Mètode per obtenir classes que cal substituir per una sortida
  async getClassesToSubstitute(sortidaId: number, anyAcademicId: number) {
    try {
      console.log(`Buscant substitucions per sortida ${sortidaId}, any acadèmic ${anyAcademicId}`);
      
      // Primer obtenir la informació de la sortida
      const sortidaResult = await db.execute(sql`
        SELECT responsable_id, data_inici, data_fi, nom_sortida
        FROM sortides 
        WHERE sortida_id = ${sortidaId}
      `);

      if (sortidaResult.rows.length === 0) {
        console.log('Sortida no trobada');
        return [];
      }

      const sortida = sortidaResult.rows[0] as any;
      console.log(`Sortida trobada: ${sortida.nom_sortida}, responsable: ${sortida.responsable_id}`);
      console.log(`Dates: ${sortida.data_inici} - ${sortida.data_fi}`);

      // Calcular els dies de la setmana afectats
      const dataInici = new Date(sortida.data_inici);
      const dataFi = new Date(sortida.data_fi);
      
      // Obtenir dia de la setmana (1=dilluns, 7=diumenge)
      const diaSetmana = dataInici.getDay() === 0 ? 7 : dataInici.getDay();
      console.log(`Dia de la setmana afectat: ${diaSetmana}`);
      
      // Obtenir hora d'inici i fi en format HH:MM:SS mantenint la zona horària local
      const horaInici = String(dataInici.getHours()).padStart(2, '0') + ':' + 
                       String(dataInici.getMinutes()).padStart(2, '0') + ':' + 
                       String(dataInici.getSeconds()).padStart(2, '0');
      const horaFi = String(dataFi.getHours()).padStart(2, '0') + ':' + 
                    String(dataFi.getMinutes()).padStart(2, '0') + ':' + 
                    String(dataFi.getSeconds()).padStart(2, '0');
      console.log(`Horari afectat: ${horaInici} - ${horaFi}`);

      // Buscar classes del professor responsable que coincideixin amb les dates/hores de la sortida
      // EXCLOENT les que ja tenen substitut assignat
      const result = await db.execute(sql`
        SELECT 
          h.horari_id as id,
          h.professor_id as "professorId",
          h.grup_id as "grupId", 
          h.aula_id as "aulaId",
          h.dia_setmana as "diaSetmana",
          h.hora_inici as "horaInici",
          h.hora_fi as "horaFi",
          h.assignatura,
          p.professor_id as professor_id,
          p.nom as professor_nom,
          p.cognoms as professor_cognoms,
          g.grup_id as grup_id,
          g.nom_grup as grup_nom,
          a.aula_id as aula_id,
          a.nom_aula as aula_nom
        FROM horaris h
        LEFT JOIN professors p ON h.professor_id = p.professor_id
        LEFT JOIN grups g ON h.grup_id = g.grup_id
        LEFT JOIN aules a ON h.aula_id = a.aula_id
        WHERE h.any_academic_id = ${anyAcademicId}
          AND h.professor_id = ${sortida.responsable_id}
          AND h.dia_setmana = ${diaSetmana}
          AND (
            (h.hora_inici >= ${horaInici} AND h.hora_inici < ${horaFi})
            OR (h.hora_fi > ${horaInici} AND h.hora_fi <= ${horaFi})
            OR (h.hora_inici <= ${horaInici} AND h.hora_fi >= ${horaFi})
          )
          AND (h.assignatura IS NULL OR h.assignatura = '' OR h.assignatura != 'G')
          AND NOT EXISTS (
            SELECT 1 FROM tasques t 
            WHERE t.descripcio LIKE CONCAT('%', h.horari_id, '%')
              AND t.estat IN ('pendent', 'en_curs', 'completada')
              AND t.data_creacio >= CURRENT_DATE - INTERVAL '7 days'
          )
          AND NOT EXISTS (
            SELECT 1 FROM sortida_substitucions ss
            WHERE ss.horari_original_id = h.horari_id
              AND ss.estat = 'confirmada'
          )
      `);

      console.log(`Consulta SQL executada per professor ${sortida.responsable_id}, dia ${diaSetmana}, ${horaInici}-${horaFi}`);

      const classesASubstituir = result.rows.map((row: any) => ({
        id: row.id,
        professorId: row.professorId,
        grupId: row.grupId,
        aulaId: row.aulaId,
        diaSetmana: row.diaSetmana,
        horaInici: row.horaInici,
        horaFi: row.horaFi,
        assignatura: row.assignatura,
        professor: {
          id: row.professor_id,
          nom: row.professor_nom,
          cognoms: row.professor_cognoms,
        },
        grup: row.grup_id ? {
          id: row.grup_id,
          nomGrup: row.grup_nom,
        } : null,
        aula: row.aula_id ? {
          id: row.aula_id,
          nomAula: row.aula_nom,
        } : null,
      }));

      console.log(`Trobades ${classesASubstituir.length} classes a substituir`);
      return classesASubstituir;

    } catch (error) {
      console.error('Error en getClassesToSubstitute:', error);
      return [];
    }
  }

  // Mètode per obtenir professors disponibles per substitució segons criteris correctes
  async getProfessorsAvailableForSubstitution(horariId: number, anyAcademicId: number) {
    try {
      console.log(`=== BÚSQUEDA OPTIMITZADA ===`);
      console.log(`Horari: ${horariId}, Any: ${anyAcademicId}`);

      if (!anyAcademicId) {
        console.log('Any acadèmic no definit');
        return [];
      }

      // QUERY ÚNICA OPTIMITZADA - Combina totes les cerques en una sola consulta CTE
      const candidatsResult = await db.execute(sql`
        WITH classe_info AS (
          SELECT h.dia_setmana, h.hora_inici, h.hora_fi, h.professor_id as professor_original,
                 g.nom_grup, p.nom as professor_nom, p.cognoms as professor_cognoms
          FROM horaris h
          LEFT JOIN grups g ON h.grup_id = g.grup_id
          LEFT JOIN professors p ON h.professor_id = p.professor_id
          WHERE h.horari_id = ${horariId}
        ),
        professors_guardia AS (
          SELECT p.professor_id as id, p.nom, p.cognoms, 1 as prioritat, 'Guàrdia' as motiu,
                 '#10B981' as color, 'guardia' as tipus
          FROM professors p
          INNER JOIN horaris h ON p.professor_id = h.professor_id
          CROSS JOIN classe_info ci
          WHERE p.any_academic_id = ${anyAcademicId}
            AND h.dia_setmana = ci.dia_setmana
            AND h.hora_inici = ci.hora_inici
            AND h.hora_fi = ci.hora_fi
            AND h.assignatura = 'G'
            AND p.professor_id != ci.professor_original
            AND h.any_academic_id = ${anyAcademicId}
        ),
        tots_candidats AS (
          SELECT * FROM professors_guardia
        ),
        candidats_amb_guardies AS (
          SELECT tc.*, 
                 COALESCE(ag_stats.total_guardies, 0) as guardiesRealiitzades
          FROM tots_candidats tc
          LEFT JOIN (
            SELECT professor_id, COUNT(*) as total_guardies
            FROM assignacions_guardia
            WHERE any_academic_id = ${anyAcademicId}
            GROUP BY professor_id
          ) ag_stats ON tc.id = ag_stats.professor_id
        )
        SELECT * FROM candidats_amb_guardies
        ORDER BY prioritat ASC, guardiesRealiitzades ASC, nom ASC
        LIMIT 100
      `);

      const candidats = candidatsResult.rows.map((row: any) => ({
        id: row.id,
        nom: row.nom,
        cognoms: row.cognoms,
        prioritat: row.prioritat,
        motiu: row.motiu,
        color: row.color,
        guardiesRealiitzades: Number(row.guardiesrealiitzades || 0),
        tipus: row.tipus
      }));

      console.log(`=== RESULTAT OPTIMITZAT: ${candidats.length} candidats ===`);
      
      // Mostrar només els primers per no sobrecarregar logs
      candidats.slice(0, 5).forEach(c => {
        console.log(`- ${c.nom} ${c.cognoms} (P:${c.prioritat}, G:${c.guardiesRealiitzades}) - ${c.motiu}`);
      });

      if (candidats.length > 5) {
        console.log(`... i ${candidats.length - 5} més`);
      }

      return candidats;

    } catch (error) {
      console.error('Error en getProfessorsAvailableForSubstitution:', error);
      return [];
    }
  }

  private getPriorityColor(percentatgeRealitzat: number): string {
    // Escala de colors degradant: menys guàrdies realitzades = més prioritari (verd)
    // Més guàrdies realitzades = menys prioritari (vermell/negre)
    if (percentatgeRealitzat <= 10) return 'emerald'; // Molt prioritari
    if (percentatgeRealitzat <= 25) return 'green';   // Alta prioritat
    if (percentatgeRealitzat <= 40) return 'lime';    // Bona prioritat
    if (percentatgeRealitzat <= 55) return 'yellow';  // Mitjana prioritat
    if (percentatgeRealitzat <= 70) return 'amber';   // Baixa prioritat
    if (percentatgeRealitzat <= 85) return 'orange';  // Molt baixa prioritat
    if (percentatgeRealitzat <= 95) return 'red';     // Crítica prioritat
    return 'slate'; // Sobrecàrregat (equivalent a negre)
  }

  // Crear nova tasca
  async createTasca(tascaData: any): Promise<any> {
    const [newTasca] = await db.insert(tasques).values(tascaData).returning();
    return newTasca;
  }

  // Crear nova comunicació
  async createComunicacio(comunicacioData: any): Promise<any> {
    const [newComunicacio] = await db.insert(comunicacions).values(comunicacioData).returning();
    return newComunicacio;
  }

  // Obtenir professor per ID
  async getProfessor(id: number): Promise<any | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.id, id));
    return professor;
  }

  // Crear assignació de guàrdia
  async createAssignacioGuardia(assignacioData: any): Promise<any> {
    const [newAssignacio] = await db.insert(assignacionsGuardia).values(assignacioData).returning();
    return newAssignacio;
  }
}

export const storage = new DatabaseStorage();
