import {
  users,
  professors,
  grups,
  alumnes,
  aules,
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
  type Horari,
  type InsertHorari,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count, between, gte, lte } from "drizzle-orm";

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

  // Professor operations
  getProfessors(): Promise<Professor[]>;
  getProfessor(id: number): Promise<Professor | undefined>;
  getProfessorByUserId(userId: string): Promise<Professor | undefined>;
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

  // Horari operations
  getHoraris(): Promise<Horari[]>;
  getHorarisByProfessor(professorId: number): Promise<Horari[]>;
  getHorarisByGrup(grupId: number): Promise<Horari[]>;
  createHorari(horari: InsertHorari): Promise<Horari>;
  updateHorari(id: number, horari: Partial<InsertHorari>): Promise<Horari>;
  deleteHorari(id: number): Promise<void>;

  // Sortida operations
  getSortides(): Promise<Sortida[]>;
  getSortidesThisWeek(): Promise<Sortida[]>;
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
    return await db.select().from(professors).orderBy(professors.cognoms, professors.nom);
  }

  async getProfessor(id: number): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.id, id));
    return professor;
  }

  async getProfessorByUserId(userId: string): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.userId, userId));
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

  async getAvailableProfessorsForGuard(guardiaId: number): Promise<Professor[]> {
    // Get guard details
    const [guardia] = await db.select().from(guardies).where(eq(guardies.id, guardiaId));
    if (!guardia) return [];

    // Get all professors
    const allProfessors = await db.select().from(professors);

    // Get professors already assigned to this guard
    const assignedProfessors = await db
      .select({ professorId: assignacionsGuardia.professorId })
      .from(assignacionsGuardia)
      .where(eq(assignacionsGuardia.guardiaId, guardiaId));

    const assignedIds = assignedProfessors.map(a => a.professorId);

    // Get professors on outings that overlap with the guard (simplified for now)
    // Note: This would need proper implementation based on how responsable field is stored

    // Filter available professors (not assigned and not on outings)
    const availableProfessors = allProfessors.filter(prof => 
      !assignedIds.includes(prof.id)
    );

    return availableProfessors;
  }

  // Grup operations
  async getGrups(): Promise<Grup[]> {
    return await db.select().from(grups).orderBy(grups.nivell, grups.nomGrup);
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
    return await db.select().from(alumnes).orderBy(alumnes.cognoms, alumnes.nom);
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
    return await db.select().from(aules).orderBy(aules.nomAula);
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

  // Horari operations
  async getHoraris(): Promise<Horari[]> {
    return await db
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
      })
      .from(horaris)
      .leftJoin(professors, eq(horaris.professorId, professors.id))
      .leftJoin(grups, eq(horaris.grupId, grups.id))
      .leftJoin(aules, eq(horaris.aulaId, aules.id))
      .orderBy(horaris.diaSetmana, horaris.horaInici);
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
  async getSortides(): Promise<any[]> {
    return await db.select({
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
      .orderBy(desc(sortides.dataInici));
  }

  async getSortidesThisWeek(): Promise<any[]> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return await db.select({
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
    .groupBy(guardies.id)
    .orderBy(desc(guardies.data), guardies.horaInici);

    return guardiasWithAssignments;
  }

  async getGuardiesWithDetails(): Promise<any[]> {
    return await db
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
      .leftJoin(aules, eq(guardies.aulaId, aules.id))
      .where(gte(guardies.data, new Date().toISOString().split('T')[0]))
      .orderBy(guardies.data, guardies.horaInici);
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
    return await db.select().from(tasques).orderBy(desc(tasques.dataCreacio));
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
    return await db.select().from(comunicacions).orderBy(desc(comunicacions.dataEnviament));
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
    const stats = await db
      .select({
        professorId: assignacionsGuardia.professorId,
        count: count(assignacionsGuardia.id),
      })
      .from(assignacionsGuardia)
      .groupBy(assignacionsGuardia.professorId);
    
    return stats;
  }

  async getProfessorWorkloadBalance(): Promise<any> {
    const balance = await db
      .select({
        professorId: assignacionsGuardia.professorId,
        guardCount: count(assignacionsGuardia.id),
      })
      .from(assignacionsGuardia)
      .innerJoin(guardies, eq(assignacionsGuardia.guardiaId, guardies.id))
      .where(gte(guardies.data, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]))
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
    const [session] = await db.insert(chatSessions).values({
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
    const [updatedAnyAcademic] = await db
      .update(anysAcademics)
      .set(anyAcademicData)
      .where(eq(anysAcademics.id, id))
      .returning();
    return updatedAnyAcademic;
  }

  async deleteAnyAcademic(id: number): Promise<void> {
    await db.delete(anysAcademics).where(eq(anysAcademics.id, id));
  }
}

export const storage = new DatabaseStorage();
