import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  smallint,
  time,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
// Taula d'anys acadèmics
export const anysAcademics = pgTable("anys_academics", {
  id: serial("any_academic_id").primaryKey(),
  nom: varchar("nom").notNull(), // "2024-25"
  dataInici: date("data_inici").notNull(),
  dataFi: date("data_fi").notNull(),
  estat: varchar("estat").notNull().default("actiu"), // "actiu", "inactiu", "finalitzat"
  observacions: text("observacions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Core school entities based on ER diagram
export const professors = pgTable("professors", {
  id: serial("professor_id").primaryKey(),
  anyAcademicId: integer("any_academic_id").references(() => anysAcademics.id).notNull(),
  nom: varchar("nom").notNull(),
  cognoms: varchar("cognoms").notNull(),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash"),
  rol: varchar("rol").notNull().default("professor"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grups = pgTable("grups", {
  id: serial("grup_id").primaryKey(),
  nomGrup: varchar("nom_grup").notNull(),
  curs: varchar("curs"),
  nivell: varchar("nivell"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alumnes = pgTable("alumnes", {
  id: serial("alumne_id").primaryKey(),
  nom: varchar("nom").notNull(),
  cognoms: varchar("cognoms").notNull(),
  grupId: integer("grup_id").references(() => grups.id),
  email: varchar("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aules = pgTable("aules", {
  id: serial("aula_id").primaryKey(),
  nomAula: varchar("nom_aula").notNull(),
  capacitat: integer("capacitat"),
  tipus: varchar("tipus"),
  equipament: text("equipament"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const horaris = pgTable("horaris", {
  id: serial("horari_id").primaryKey(),
  professorId: integer("professor_id").references(() => professors.id),
  grupId: integer("grup_id").references(() => grups.id),
  aulaId: integer("aula_id").references(() => aules.id),
  diaSetmana: smallint("dia_setmana").notNull(), // 1-7 (Monday-Sunday)
  horaInici: time("hora_inici").notNull(),
  horaFi: time("hora_fi").notNull(),
  assignatura: varchar("assignatura"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sortides = pgTable("sortides", {
  id: serial("sortida_id").primaryKey(),
  nomSortida: varchar("nom_sortida").notNull(),
  dataInici: timestamp("data_inici").notNull(),
  dataFi: timestamp("data_fi").notNull(),
  grupId: integer("grup_id").references(() => grups.id),
  descripcio: text("descripcio"),
  lloc: varchar("lloc"),
  responsableId: integer("responsable_id").references(() => professors.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guardies = pgTable("guardies", {
  id: serial("guardia_id").primaryKey(),
  data: date("data").notNull(),
  horaInici: time("hora_inici").notNull(),
  horaFi: time("hora_fi").notNull(),
  tipusGuardia: varchar("tipus_guardia").notNull(), // "pati", "biblioteca", "aula", etc.
  estat: varchar("estat").notNull().default("pendent"), // "pendent", "assignada", "completada"
  lloc: varchar("lloc"),
  observacions: text("observacions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignacionsGuardia = pgTable("assignacions_guardia", {
  id: serial("assigna_id").primaryKey(),
  guardiaId: integer("guardia_id").references(() => guardies.id),
  professorId: integer("professor_id").references(() => professors.id),
  prioritat: smallint("prioritat").notNull(), // 1=highest priority
  timestampAsg: timestamp("timestamp_asg").defaultNow(),
  estat: varchar("estat").notNull().default("assignada"), // "assignada", "acceptada", "rebutjada", "completada"
  motiu: varchar("motiu"), // "sortida", "reunio", "carrec", "equilibri"
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasques = pgTable("tasques", {
  id: serial("tasca_id").primaryKey(),
  assignaId: integer("assigna_id").references(() => assignacionsGuardia.id),
  descripcio: text("descripcio").notNull(),
  estat: varchar("estat").notNull().default("pendent"), // "pendent", "en_progress", "completada", "cancel·lada"
  dataCreacio: timestamp("data_creacio").defaultNow(),
  dataVenciment: date("data_venciment"),
  prioritat: varchar("prioritat").default("mitjana"), // "baixa", "mitjana", "alta", "urgent"
  adjunts: jsonb("adjunts"), // Array of file references
  comentaris: text("comentaris"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comunicacions = pgTable("comunicacions", {
  id: serial("com_id").primaryKey(),
  tipusDest: varchar("tipus_dest").notNull(), // "professor", "grup", "administracio"
  destinatariId: integer("destinatari_id"),
  missatge: text("missatge").notNull(),
  dataEnviament: timestamp("data_enviament").defaultNow(),
  tipus: varchar("tipus").default("notificacio"), // "notificacio", "urgent", "informativa"
  llegit: boolean("llegit").default(false),
  emissorId: integer("emissor_id").references(() => professors.id),
  relatedGuardiaId: integer("related_guardia_id").references(() => guardies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics and metrics tables
export const metrics = pgTable("metrics", {
  id: serial("metric_id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  usuariId: varchar("usuari_id").references(() => users.id),
  accio: varchar("accio").notNull(),
  detalls: jsonb("detalls"),
  entityType: varchar("entity_type"),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: serial("prediction_id").primaryKey(),
  data: date("data").notNull(),
  context: jsonb("context").notNull(),
  resultat: jsonb("resultat").notNull(),
  confidence: integer("confidence"), // 0-100
  tipus: varchar("tipus").notNull(), // "assignacio", "equilibri", "optimitzacio"
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat sessions for AI bot
export const chatSessions = pgTable("chat_sessions", {
  id: serial("session_id").primaryKey(),
  usuariId: varchar("usuari_id").references(() => users.id),
  inici: timestamp("inici").defaultNow(),
  missatges: jsonb("missatges").notNull().default([]),
  tancada: boolean("tancada").default(false),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// File attachments
export const attachments = pgTable("attachments", {
  id: serial("attachment_id").primaryKey(),
  tascaId: integer("tasca_id").references(() => tasques.id),
  nomFitxer: varchar("nom_fitxer").notNull(),
  urlAlmacenament: varchar("url_almacenament").notNull(),
  metadata: jsonb("metadata"),
  mida: integer("mida"),
  tipus: varchar("tipus"),
  pujatEl: timestamp("pujat_el").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const professorsRelations = relations(professors, ({ many, one }) => ({
  horaris: many(horaris),
  assignacionsGuardia: many(assignacionsGuardia),
  comunicacionsEmeses: many(comunicacions, { relationName: "comunicacionsEmeses" }),
  user: one(users, {
    fields: [professors.userId],
    references: [users.id],
  }),
}));

export const grupsRelations = relations(grups, ({ many }) => ({
  alumnes: many(alumnes),
  horaris: many(horaris),
  sortides: many(sortides),
}));

export const alumnesRelations = relations(alumnes, ({ one }) => ({
  grup: one(grups, {
    fields: [alumnes.grupId],
    references: [grups.id],
  }),
}));

export const aulesRelations = relations(aules, ({ many }) => ({
  horaris: many(horaris),
}));

export const horarisRelations = relations(horaris, ({ one }) => ({
  professor: one(professors, {
    fields: [horaris.professorId],
    references: [professors.id],
  }),
  grup: one(grups, {
    fields: [horaris.grupId],
    references: [grups.id],
  }),
  aula: one(aules, {
    fields: [horaris.aulaId],
    references: [aules.id],
  }),
}));

export const sortidesRelations = relations(sortides, ({ one }) => ({
  grup: one(grups, {
    fields: [sortides.grupId],
    references: [grups.id],
  }),
  responsable: one(professors, {
    fields: [sortides.responsableId],
    references: [professors.id],
  }),
}));

export const guardiesRelations = relations(guardies, ({ many }) => ({
  assignacions: many(assignacionsGuardia),
}));

export const assignacionsGuardiaRelations = relations(assignacionsGuardia, ({ one, many }) => ({
  guardia: one(guardies, {
    fields: [assignacionsGuardia.guardiaId],
    references: [guardies.id],
  }),
  professor: one(professors, {
    fields: [assignacionsGuardia.professorId],
    references: [professors.id],
  }),
  tasques: many(tasques),
}));

export const tasquesRelations = relations(tasques, ({ one, many }) => ({
  assignacio: one(assignacionsGuardia, {
    fields: [tasques.assignaId],
    references: [assignacionsGuardia.id],
  }),
  attachments: many(attachments),
}));

export const comunicacionsRelations = relations(comunicacions, ({ one }) => ({
  emissor: one(professors, {
    fields: [comunicacions.emissorId],
    references: [professors.id],
    relationName: "comunicacionsEmeses",
  }),
  relatedGuardia: one(guardies, {
    fields: [comunicacions.relatedGuardiaId],
    references: [guardies.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  tasca: one(tasques, {
    fields: [attachments.tascaId],
    references: [tasques.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProfessorSchema = createInsertSchema(professors).omit({
  id: true,
  createdAt: true,
});

export const insertGrupSchema = createInsertSchema(grups).omit({
  id: true,
  createdAt: true,
});

export const insertAlumneSchema = createInsertSchema(alumnes).omit({
  id: true,
  createdAt: true,
});

export const insertAulaSchema = createInsertSchema(aules).omit({
  id: true,
  createdAt: true,
});

export const insertHorariSchema = createInsertSchema(horaris).omit({
  id: true,
  createdAt: true,
});

export const insertSortidaSchema = createInsertSchema(sortides).omit({
  id: true,
  createdAt: true,
}).extend({
  dataInici: z.coerce.date(),
  dataFi: z.coerce.date(),
});

export const insertGuardiaSchema = createInsertSchema(guardies).omit({
  id: true,
  createdAt: true,
}).extend({
  data: z.coerce.date(),
});

export const insertAssignacioGuardiaSchema = createInsertSchema(assignacionsGuardia).omit({
  id: true,
  createdAt: true,
  timestampAsg: true,
});

export const insertTascaSchema = createInsertSchema(tasques).omit({
  id: true,
  createdAt: true,
  dataCreacio: true,
});

export const insertComunicacioSchema = createInsertSchema(comunicacions).omit({
  id: true,
  createdAt: true,
  dataEnviament: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
  pujatEl: true,
});

// Type exports
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Professor = typeof professors.$inferSelect;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type Grup = typeof grups.$inferSelect;
export type InsertGrup = z.infer<typeof insertGrupSchema>;
export type Alumne = typeof alumnes.$inferSelect;
export type InsertAlumne = z.infer<typeof insertAlumneSchema>;
export type Aula = typeof aules.$inferSelect;
export type InsertAula = z.infer<typeof insertAulaSchema>;
export type Horari = typeof horaris.$inferSelect;
export type InsertHorari = z.infer<typeof insertHorariSchema>;
export type Sortida = typeof sortides.$inferSelect;
export type InsertSortida = z.infer<typeof insertSortidaSchema>;
export type Guardia = typeof guardies.$inferSelect;
export type InsertGuardia = z.infer<typeof insertGuardiaSchema>;
export type AssignacioGuardia = typeof assignacionsGuardia.$inferSelect;
export type InsertAssignacioGuardia = z.infer<typeof insertAssignacioGuardiaSchema>;
export type Tasca = typeof tasques.$inferSelect;
export type InsertTasca = z.infer<typeof insertTascaSchema>;
export type Comunicacio = typeof comunicacions.$inferSelect;
export type InsertComunicacio = z.infer<typeof insertComunicacioSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Metric = typeof metrics.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;

// Extended types for API responses with joined data
export type SortidaWithRelations = {
  id: number;
  nomSortida: string;
  dataInici: Date;
  dataFi: Date;
  grupId: number | null;
  descripcio: string | null;
  lloc: string | null;
  responsableId: number | null;
  createdAt: Date | null;
  grupNom: string | null;
  responsableNom: string | null;
  responsableCognoms: string | null;
  responsableFullName?: string;
  grup?: {
    id: number;
    nomGrup: string;
  } | null;
  responsable?: {
    id: number;
    nom: string;
    cognoms: string;
    fullName: string;
  } | null;
};

export type GuardiaWithRelations = {
  id: number;
  data: string;
  horaInici: string;
  horaFi: string;
  tipusGuardia: string;
  estat: string;
  lloc: string | null;
  observacions: string | null;
  createdAt: Date | null;
  assignacions?: AssignacioGuardiaWithProfessor[];
};

export type AssignacioGuardiaWithProfessor = {
  id: number;
  guardiaId: number;
  professorId: number;
  observacions: string | null;
  createdAt: Date | null;
  professor?: {
    id: number;
    nom: string;
    cognoms: string;
    fullName: string;
  };
};
