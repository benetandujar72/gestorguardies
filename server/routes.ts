import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProfessorSchema,
  insertGrupSchema,
  insertAlumneSchema,
  insertAulaSchema,
  insertHorariSchema,
  insertSortidaSchema,
  insertGuardiaSchema,
  insertAssignacioGuardiaSchema,
  insertTascaSchema,
  insertComunicacioSchema,
  insertAttachmentSchema,
  insertMateriaSchema
} from "@shared/schema";
import { GuardAssignmentEngine } from "./guard-assignment-engine";
import { analyzeGuardAssignments, generateChatResponse } from "./openai";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'image/jpeg', 
      'image/png',
      'text/csv',
      'application/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Test endpoint for debugging (MUST BE FIRST)
  app.post('/api/chat/test', isAuthenticated, async (req, res) => {
    console.log("=== TEST ENDPOINT HIT ===");
    res.setHeader('Content-Type', 'application/json');
    res.json({ response: "Test response working!" });
  });

  // Simple Chat route (MUST BE EARLY)
  app.post('/api/chat/simple', isAuthenticated, async (req, res) => {
    try {
      console.log("=== SIMPLE CHAT ENDPOINT HIT ===");
      const { message } = req.body;
      const userId = (req as any).user.claims.sub;
      
      console.log("User message:", message);
      console.log("User ID:", userId);
      
      // Set proper content type
      res.setHeader('Content-Type', 'application/json');
      
      // Now use OpenAI for intelligent responses
      console.log("Calling OpenAI API...");
      const aiResponse = await generateChatResponse(message, []);
      console.log("OpenAI response received:", aiResponse);
      
      const result = { response: aiResponse };
      console.log("Sending JSON response:", result);
      
      res.json(result);
    } catch (error: any) {
      console.error("Simple chat error details:", error);
      console.error("Error stack:", error.stack);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Error processant el missatge amb IA", error: error.message });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const professor = await storage.getProfessorByUserId(userId);
      res.json({ ...user, professor });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Professor routes
  app.get('/api/professors', isAuthenticated, async (req, res) => {
    try {
      const professors = await storage.getProfessors();
      res.json(professors);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch professors" });
    }
  });

  app.post('/api/professors', isAuthenticated, async (req, res) => {
    try {
      const professorData = insertProfessorSchema.parse(req.body);
      const professor = await storage.createProfessor(professorData);
      
      // Create metric
      await storage.createMetric({
        anyAcademicId: professor.anyAcademicId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_professor',
        detalls: { professorId: professor.id },
        entityType: 'professor',
        entityId: professor.id
      });
      
      res.json(professor);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid professor data" });
    }
  });

  app.put('/api/professors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const professorData = insertProfessorSchema.partial().parse(req.body);
      const professor = await storage.updateProfessor(id, professorData);
      res.json(professor);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update professor" });
    }
  });

  app.delete('/api/professors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProfessor(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete professor" });
    }
  });

  // Grup routes
  app.get('/api/grups', isAuthenticated, async (req, res) => {
    try {
      const grups = await storage.getGrups();
      res.json(grups);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/grups', isAuthenticated, async (req, res) => {
    try {
      const grupData = insertGrupSchema.parse(req.body);
      const grup = await storage.createGrup(grupData);
      res.json(grup);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.put('/api/grups/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const grupData = insertGrupSchema.partial().parse(req.body);
      const grup = await storage.updateGrup(id, grupData);
      res.json(grup);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update group" });
    }
  });

  app.delete('/api/grups/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGrup(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete group" });
    }
  });

  // Alumne routes
  app.get('/api/alumnes', isAuthenticated, async (req, res) => {
    try {
      const { grupId } = req.query;
      const alumnes = grupId 
        ? await storage.getAlumnesByGrup(parseInt(grupId as string))
        : await storage.getAlumnes();
      res.json(alumnes);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post('/api/alumnes', isAuthenticated, async (req, res) => {
    try {
      const alumneData = insertAlumneSchema.parse(req.body);
      const alumne = await storage.createAlumne(alumneData);
      res.json(alumne);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  // Aula routes
  app.get('/api/aules', isAuthenticated, async (req, res) => {
    try {
      const aules = await storage.getAules();
      res.json(aules);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch classrooms" });
    }
  });

  app.post('/api/aules', isAuthenticated, async (req, res) => {
    try {
      const aulaData = insertAulaSchema.parse(req.body);
      const aula = await storage.createAula(aulaData);
      res.json(aula);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid classroom data" });
    }
  });

  // Materia routes
  app.get('/api/materies', isAuthenticated, async (req, res) => {
    try {
      const materies = await storage.getMateries();
      res.json(materies);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post('/api/materies', isAuthenticated, async (req, res) => {
    try {
      const materiaData = insertMateriaSchema.parse(req.body);
      const materia = await storage.createMateria(materiaData);
      res.json(materia);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid subject data" });
    }
  });

  app.put('/api/materies/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const materiaData = insertMateriaSchema.partial().parse(req.body);
      const materia = await storage.updateMateria(id, materiaData);
      res.json(materia);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid subject data" });
    }
  });

  app.delete('/api/materies/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMateria(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Horari routes
  app.get('/api/horaris', isAuthenticated, async (req, res) => {
    try {
      const { professorId, grupId } = req.query;
      let horaris;
      
      if (professorId) {
        horaris = await storage.getHorarisByProfessor(parseInt(professorId as string));
      } else if (grupId) {
        horaris = await storage.getHorarisByGrup(parseInt(grupId as string));
      } else {
        horaris = await storage.getHoraris();
      }
      
      res.json(horaris);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post('/api/horaris', isAuthenticated, async (req, res) => {
    try {
      const horariData = insertHorariSchema.parse(req.body);
      const horari = await storage.createHorari(horariData);
      res.json(horari);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  // Create multiple schedules (for multi-hour classes)
  app.post('/api/horaris/bulk', isAuthenticated, async (req, res) => {
    try {
      const { schedules } = req.body;
      const createdSchedules = [];
      
      for (const scheduleData of schedules) {
        const validatedData = insertHorariSchema.parse(scheduleData);
        const horari = await storage.createHorari(validatedData);
        createdSchedules.push(horari);
      }
      
      res.json({ 
        schedules: createdSchedules, 
        count: createdSchedules.length,
        message: `${createdSchedules.length} horaris creats correctament` 
      });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create multiple schedules" });
    }
  });

  app.patch('/api/horaris/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const horariData = insertHorariSchema.partial().parse(req.body);
      const horari = await storage.updateHorari(id, horariData);
      res.json(horari);
    } catch (error: any) {
      console.error('Error updating horari:', error);
      res.status(400).json({ message: "Failed to update schedule" });
    }
  });

  app.delete('/api/horaris/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHorari(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete schedule" });
    }
  });

  // Sortida routes
  app.get('/api/sortides', isAuthenticated, async (req, res) => {
    try {
      const { thisWeek } = req.query;
      const sortides = thisWeek === 'true' 
        ? await storage.getSortidesThisWeek()
        : await storage.getSortides();
      res.json(sortides);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch outings" });
    }
  });

  app.post('/api/sortides', isAuthenticated, async (req, res) => {
    try {
      console.log('Creating sortida with data:', req.body);
      
      // Add anyAcademicId to the request body if not present
      const activeYear = await storage.getActiveAcademicYear();
      const requestData = {
        ...req.body,
        anyAcademicId: req.body.anyAcademicId || activeYear
      };
      
      console.log('Final sortida data:', requestData);
      const sortidaData = insertSortidaSchema.parse(requestData);
      const sortida = await storage.createSortida(sortidaData);
      
      // Create metric for new outing
      await storage.createMetric({
        anyAcademicId: sortida.anyAcademicId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_sortida',
        detalls: { sortidaId: sortida.id },
        entityType: 'sortida',
        entityId: sortida.id
      });
      
      res.json(sortida);
    } catch (error: any) {
      console.error("Error creating sortida:", error);
      res.status(400).json({ message: "Invalid outing data", details: error.message });
    }
  });

  app.put('/api/sortides/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sortidaData = insertSortidaSchema.partial().parse(req.body);
      const sortida = await storage.updateSortida(id, sortidaData);
      
      // Create metric for updated outing
      await storage.createMetric({
        anyAcademicId: sortida.anyAcademicId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'actualitzar_sortida',
        detalls: { sortidaId: id, changes: sortidaData },
        entityType: 'sortida',
        entityId: id
      });
      
      res.json(sortida);
    } catch (error: any) {
      console.error("Error updating sortida:", error);
      res.status(400).json({ message: "Invalid outing data" });
    }
  });

  app.delete('/api/sortides/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSortida(id);
      
      // Create metric for deleted outing - use current academic year
      const activeYearId = await storage.getActiveAcademicYear();
      await storage.createMetric({
        anyAcademicId: activeYearId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'eliminar_sortida',
        detalls: { sortidaId: id },
        entityType: 'sortida',
        entityId: id
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting sortida:", error);
      res.status(500).json({ message: "Failed to delete outing" });
    }
  });

  // Guardia routes
  app.get('/api/guardies', isAuthenticated, async (req, res) => {
    try {
      const { today, date } = req.query;
      let guardies;
      
      if (today === 'true') {
        guardies = await storage.getGuardiesAvui();
      } else if (date) {
        guardies = await storage.getGuardiesByDate(date as string);
      } else {
        guardies = await storage.getGuardies();
      }
      
      res.json(guardies);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch guards" });
    }
  });

  app.get('/api/guardies', isAuthenticated, async (req, res) => {
    try {
      const guardies = await storage.getGuardies();
      res.json(guardies);
    } catch (error) {
      console.error("Error fetching guardies:", error);
      res.status(500).json({ message: "Failed to fetch guardies" });
    }
  });

  // Get guardies with detailed information for calendar view
  app.get('/api/guardies-calendar', isAuthenticated, async (req, res) => {
    try {
      const guardies = await storage.getGuardiesWithDetails();
      res.json(guardies);
    } catch (error) {
      console.error("Error fetching guardies calendar:", error);
      res.status(500).json({ message: "Failed to fetch guardies calendar" });
    }
  });

  app.post('/api/guardies', isAuthenticated, async (req, res) => {
    try {
      const guardiaData = insertGuardiaSchema.parse(req.body);
      const guardia = await storage.createGuardia(guardiaData);
      
      // Create metric
      await storage.createMetric({
        anyAcademicId: guardia.anyAcademicId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_guardia',
        detalls: { guardiaId: guardia.id },
        entityType: 'guardia',
        entityId: guardia.id,
      });
      
      res.json(guardia);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid guard data" });
    }
  });

  // Assignacio Guardia routes
  app.get('/api/assignacions-guardia', isAuthenticated, async (req, res) => {
    try {
      const { professorId, guardiaId } = req.query;
      let assignacions;
      
      if (professorId) {
        assignacions = await storage.getAssignacionsGuardiaByProfessor(parseInt(professorId as string));
      } else if (guardiaId) {
        assignacions = await storage.getAssignacionsGuardiaByGuardia(parseInt(guardiaId as string));
      } else {
        assignacions = await storage.getAssignacionsGuardia();
      }
      
      res.json(assignacions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch guard assignments" });
    }
  });

  app.post('/api/assignacions-guardia', isAuthenticated, async (req, res) => {
    try {
      console.log('Assignment creation request body:', req.body);
      const assignacioData = insertAssignacioGuardiaSchema.parse(req.body);
      console.log('Parsed assignment data:', assignacioData);
      
      const assignacio = await storage.createAssignacioGuardia(assignacioData);
      
      // Create metric (skip if fails to avoid blocking main operation)
      try {
        await storage.createMetric({
          anyAcademicId: assignacio.anyAcademicId,
          timestamp: new Date(),
          usuariId: (req as any).user.claims.sub,
          accio: 'assignar_guardia',
          detalls: { assignacioId: assignacio.id, professorId: assignacio.professorId, guardiaId: assignacio.guardiaId },
          entityType: 'assignacio_guardia',
          entityId: assignacio.id
        });
      } catch (metricError) {
        console.warn('Metric creation failed (non-blocking):', metricError);
      }
      
      res.json(assignacio);
    } catch (error: any) {
      console.error('Assignment creation error:', error);
      res.status(400).json({ 
        message: "Invalid assignment data", 
        details: error.message,
        errors: error.errors || []
      });
    }
  });

  // Get available professors for a specific guard duty
  app.get('/api/professors/available/:guardiaId', isAuthenticated, async (req, res) => {
    try {
      const guardiaId = parseInt(req.params.guardiaId);
      const availableProfessors = await storage.getAvailableProfessorsForGuard(guardiaId);
      res.json(availableProfessors);
    } catch (error: any) {
      console.error("Error fetching available professors:", error);
      res.status(500).json({ message: "Failed to fetch available professors" });
    }
  });

  // Auto-assign guards based on priority rules
  app.post('/api/assignacions-guardia/auto-assign', isAuthenticated, async (req, res) => {
    try {
      const { guardiaId } = req.body;
      
      if (!guardiaId) {
        return res.status(400).json({ message: "Guard ID is required" });
      }
      
      // Use the new guard assignment engine
      const engine = new GuardAssignmentEngine();
      const assignacions = await engine.assignGuardAutomatically(guardiaId);
      
      // Log the assignment action
      const activeYear = await storage.getAnysAcademics().then(years => 
        years.find(y => y.actiu)?.id || 1
      );
      await storage.createMetric({
        anyAcademicId: activeYear,
        timestamp: new Date(),
        usuariId: (req.user as any)?.claims?.sub || 'sistema',
        accio: 'auto_assign_guard',
        detalls: {
          guardiaId: guardiaId,
          assignedProfessors: assignacions.length,
          assignmentIds: assignacions.map(a => a.id)
        },
        entityType: 'guardia',
        entityId: guardiaId
      });
      
      res.json({
        success: true,
        assignacions,
        message: `Asignados ${assignacions.length} profesores automáticamente`,
        details: assignacions.map(a => ({
          professorId: a.professorId,
          observacions: a.observacions
        }))
      });
    } catch (error: any) {
      console.error("Error in auto-assignment:", error);
      res.status(500).json({ 
        success: false,
        message: "Error en la asignación automática",
        error: error.message 
      });
    }
  });

  // Tasca routes
  app.get('/api/tasques', isAuthenticated, async (req, res) => {
    try {
      const { assignacioId, pendent } = req.query;
      let tasques;
      
      if (assignacioId) {
        tasques = await storage.getTasquesByAssignacio(parseInt(assignacioId as string));
      } else if (pendent === 'true') {
        tasques = await storage.getTasquesPendents();
      } else {
        tasques = await storage.getTasques();
      }
      
      res.json(tasques);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasques', isAuthenticated, async (req, res) => {
    try {
      const tascaData = insertTascaSchema.parse(req.body);
      const tasca = await storage.createTasca(tascaData);
      
      // Create metric
      await storage.createMetric({
        anyAcademicId: tasca.anyAcademicId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_tasca',
        detalls: { tascaId: tasca.id },
        entityType: 'tasca',
        entityId: tasca.id
      });
      
      res.json(tasca);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put('/api/tasques/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tascaData = insertTascaSchema.partial().parse(req.body);
      const tasca = await storage.updateTasca(id, tascaData);
      res.json(tasca);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update task" });
    }
  });

  // File upload for tasks
  app.post('/api/tasques/:id/attachments', isAuthenticated, upload.array('files'), async (req, res) => {
    try {
      const tascaId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      const attachments = [];
      for (const file of files) {
        // Get active academic year for attachment
        const activeYear = await storage.getAnysAcademics().then(years => 
          years.find(y => y.actiu)?.id || 1
        );
        const attachment = await storage.createAttachment({
          anyAcademicId: activeYear,
          tascaId,
          nomFitxer: file.originalname,
          urlAlmacenament: `/uploads/${file.filename}`,
          metadata: {
            originalName: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
          },
          mida: file.size,
          tipus: file.mimetype,
        });
        attachments.push(attachment);
      }
      
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get('/api/tasques/:id/attachments', isAuthenticated, async (req, res) => {
    try {
      const tascaId = parseInt(req.params.id);
      const attachments = await storage.getAttachmentsByTasca(tascaId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Comunicacio routes
  app.get('/api/comunicacions', isAuthenticated, async (req, res) => {
    try {
      const { unread } = req.query;
      let comunicacions;
      
      if (unread === 'true') {
        comunicacions = await storage.getComunicacionsNoLlegides((req as any).user.claims.sub);
      } else {
        comunicacions = await storage.getComunicacions();
      }
      
      res.json(comunicacions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.post('/api/comunicacions', isAuthenticated, async (req, res) => {
    try {
      console.log("POST /api/comunicacions - Request body:", req.body);
      
      // Get active academic year
      const activeAcademicYear = await storage.getActiveAcademicYear();
      
      // Get professor ID for current user
      const currentProfessor = await storage.getProfessorByUserId((req as any).user.claims.sub);
      
      // Add required fields
      const comunicacioData = {
        ...req.body,
        anyAcademicId: activeAcademicYear,
        emissorId: currentProfessor?.id || null,
        destinatariId: parseInt(req.body.destinatariId)
      };
      
      console.log("Processed comunicacio data:", comunicacioData);
      
      const validatedData = insertComunicacioSchema.parse(comunicacioData);
      const comunicacio = await storage.createComunicacio(validatedData);
      
      // Create metric
      await storage.createMetric({
        anyAcademicId: comunicacio.anyAcademicId,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'enviar_comunicacio',
        detalls: { comunicacioId: comunicacio.id },
        entityType: 'comunicacio',
        entityId: comunicacio.id
      });
      
      res.json(comunicacio);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid communication data" });
    }
  });

  app.put('/api/comunicacions/:id/read', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markComunicacioAsRead(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to mark as read" });
    }
  });

  // Academic Years routes
  app.get('/api/anys-academics', isAuthenticated, async (req, res) => {
    try {
      const anysAcademics = await storage.getAnysAcademics();
      res.json(anysAcademics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch academic years" });
    }
  });

  app.post('/api/anys-academics', isAuthenticated, async (req, res) => {
    try {
      const anyAcademic = await storage.createAnyAcademic(req.body);
      res.json(anyAcademic);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create academic year" });
    }
  });

  app.put('/api/anys-academics/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const anyAcademic = await storage.updateAnyAcademic(id, req.body);
      res.json(anyAcademic);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update academic year" });
    }
  });

  app.delete('/api/anys-academics/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnyAcademic(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete academic year" });
    }
  });

  // Get active academic year ID
  app.get('/api/anys-academics/active/id', isAuthenticated, async (req, res) => {
    try {
      const activeYearId = await storage.getActiveAcademicYear();
      res.json({ activeYearId });
    } catch (error: any) {
      res.status(500).json({ message: "No active academic year found" });
    }
  });

  // Activate academic year (sets it as active and finalizes the previous one)
  app.post('/api/anys-academics/:id/activate', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the academic year to activate
      const yearToActivate = await storage.getAnyAcademic(id);
      if (!yearToActivate) {
        return res.status(404).json({ message: "Academic year not found" });
      }

      // Update to active status (this will automatically set previous active year to finalized)
      const updatedYear = await storage.updateAnyAcademic(id, { estat: 'actiu' });
      
      res.json({
        success: true,
        message: `Any acadèmic "${updatedYear.nom}" activat correctament`,
        academicYear: updatedYear
      });
    } catch (error: any) {
      console.error("Error activating academic year:", error);
      res.status(500).json({ message: "Failed to activate academic year" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/guard-stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getGuardAssignmentStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch guard statistics" });
    }
  });

  app.get('/api/analytics/workload-balance', isAuthenticated, async (req, res) => {
    try {
      const balance = await storage.getProfessorWorkloadBalance();
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch workload balance" });
    }
  });



  // AI Chat routes
  app.get('/api/chat/sessions', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      // For now, return empty array as we'll implement session listing later
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.get('/api/chat/active-session', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const session = await storage.getUserActiveChatSession(userId);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req, res) => {
    try {
      console.log("POST /api/chat/sessions - Creating new session");
      const userId = (req as any).user.claims.sub;
      console.log("User ID:", userId);
      
      const session = await storage.createChatSession(userId);
      console.log("Created session:", session);
      
      res.json(session);
    } catch (error: any) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get('/api/chat/messages/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Convert messages to expected format
      const messages = Array.isArray(session.missatges) ? session.missatges.map((msg: any, index: number) => ({
        id: `msg-${index}`,
        role: msg.emissor === 'usuari' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: new Date(msg.moment)
      })) : [];
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/session', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      
      // Get or create active session
      let session = await storage.getUserActiveChatSession(userId);
      if (!session) {
        session = await storage.createChatSession(userId);
      }
      
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.post('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req, res) => {
    try {
      console.log("=== CHAT MESSAGE ENDPOINT HIT ===");
      console.log("POST /api/chat/sessions/:sessionId/messages - Request received");
      console.log("Session ID:", req.params.sessionId);
      console.log("Request body:", req.body);
      console.log("Headers:", req.headers);
      
      const sessionId = parseInt(req.params.sessionId);
      const { content } = req.body;
      const userId = (req as any).user.claims.sub;
      
      console.log("Parsed sessionId:", sessionId);
      console.log("Content:", content);
      console.log("User ID:", userId);
      
      // Get session
      const session = await storage.getChatSession(sessionId);
      console.log("Retrieved session:", session);
      
      if (!session) {
        console.log("Session not found");
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Add user message
      const messages = Array.isArray(session.missatges) ? session.missatges : [];
      messages.push({
        emissor: 'usuari',
        text: content,
        moment: new Date().toISOString(),
      });
      
      // Generate AI response
      const aiResponse = await generateChatResponse(content, messages);
      
      // Add AI response
      messages.push({
        emissor: 'bot',
        text: aiResponse,
        moment: new Date().toISOString(),
      });
      
      // Update session
      await storage.updateChatSession(sessionId, { missatges: messages });
      
      // Create metric
      const activeYear = await storage.getAnysAcademics().then(years => 
        years.find(y => y.actiu)?.id || 1
      );
      await storage.createMetric({
        anyAcademicId: activeYear,
        timestamp: new Date(),
        usuariId: userId,
        accio: 'chat_message',
        detalls: { sessionId, messageLength: content.length },
        entityType: 'chat',
        entityId: sessionId,
      });
      
      // Return the new message in the expected format
      res.json({
        id: `msg-${messages.length - 1}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // CSV Import route
  app.post('/api/import/csv', isAuthenticated, upload.single('csvFile'), async (req, res) => {
    try {
      const file = req.file;
      const { entityType, academicYearId } = req.body;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      if (!academicYearId) {
        return res.status(400).json({ message: "Academic year ID is required" });
      }
      
      // Process CSV file with improved parsing
      const csvData = fs.readFileSync(file.path, 'utf8');
      const lines = csvData.split('\n').filter(line => line.trim().length > 0); // Filter empty lines
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Map common header variations to standard field names
      const headerMapping: { [key: string]: string } = {
        'cognom': 'cognoms',
        'cognoms': 'cognoms',
        'grupI': 'grupId',
        'grupId': 'grupId',
        'nom': 'nom',
        'email': 'email',
        'telefon': 'telefon',
        'professorId': 'professorId',
        'aulaId': 'aulaId',
        'responsableId': 'responsableId',
        // Headers específics per horaris
        'diaSemana': 'diaSemana',
        'diaSetmana': 'diaSetmana',
        'horaInici': 'horaInici',
        'horaFi': 'horaFi',
        'materia': 'materia',
        'assignatura': 'assignatura',
        // Headers específics per matèries
        'ID': 'id',
        'Nom': 'nom',
        'Codi': 'codi',
        'Departament': 'departament',
        'Hores Setmanals': 'horesSetmanals',
        'Tipus': 'tipus',
        'Curs': 'curs',
        'Descripció': 'descripcio'
      };
      
      let importedCount = 0;
      let errorCount = 0;
      
      console.log('CSV Headers found:', headers);
      console.log('Header mapping will be:', headerMapping);
      console.log('Processing', lines.length - 1, 'rows for entity type:', entityType);
      
      // Debug primera línia de dades per veure el problema
      if (lines.length > 1) {
        const firstDataLine = lines[1].split(',');
        console.log('First data line values:', firstDataLine);
        console.log('Number of headers:', headers.length, 'Number of values:', firstDataLine.length);
      }
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        // Skip lines that don't have the right number of columns
        if (values.length !== headers.length) {
          console.log(`Skipping row ${i}: expected ${headers.length} columns, got ${values.length}`);
          continue;
        }
        
        const record: any = {};
        headers.forEach((header, index) => {
          let value: any = values[index] ? values[index].trim() : '';
          
          // Map header to standard field name
          const standardFieldName = headerMapping[header] || header;
          
          // Convert numeric fields (except grupId, professorId and responsableId which can be codes)
          if ((standardFieldName === 'aulaId' || standardFieldName === 'horesSetmanals') && value) {
            console.log(`Converting ${standardFieldName}: "${value}" (${typeof value}) -> ${parseInt(value)} (${typeof parseInt(value)})`);
            value = parseInt(value);
          }
          
          // For professorId, only convert if it's purely numeric
          if (standardFieldName === 'professorId' && value && !isNaN(Number(value)) && Number.isInteger(Number(value))) {
            console.log(`Converting professorId: "${value}" (${typeof value}) -> ${parseInt(value)} (${typeof parseInt(value)})`);
            value = parseInt(value);
          }
          
          // Only set non-empty values to avoid undefined issues
          if (value !== '') {
            record[standardFieldName] = value;
          }
        });
          
        // Skip empty records
        if (Object.keys(record).length === 0) {
          continue;
        }
        
        // Add academic year ID to all records
        const recordWithAcademicYear = { 
          ...record, 
          anyAcademicId: parseInt(academicYearId) 
        };
        
        console.log(`Processing row ${i} for ${entityType}:`, recordWithAcademicYear);
        
        try {
          switch (entityType) {
            case 'professors':
              // Validate required fields for professors
              if (!record.nom || !record.email) {
                console.log(`Skipping row ${i}: missing required fields (nom or email)`);
                errorCount++;
                continue;
              }
              
              // Check if professor exists by email
              const existingProfessor = await storage.getProfessorByEmail(record.email);
              if (existingProfessor) {
                await storage.updateProfessor(existingProfessor.id, recordWithAcademicYear);
              } else {
                await storage.createProfessor(insertProfessorSchema.parse(recordWithAcademicYear));
              }
              break;
              
            case 'grups':
              // Validate required fields for grups
              if (!record.nomGrup) {
                console.log(`Skipping row ${i}: missing required field nomGrup`);
                errorCount++;
                continue;
              }
              console.log('Creating grup with data:', recordWithAcademicYear);
              await storage.createGrup(insertGrupSchema.parse(recordWithAcademicYear));
              break;
              
            case 'alumnes':
              // Validate required fields for alumnes  
              if (!record.nom || !record.grupId) {
                console.log(`Skipping row ${i}: missing required fields (nom or grupId)`);
                errorCount++;
                continue;
              }
              
              // Mapatge dels IDs del CSV als IDs reals de la base de dades
              const GRUP_ID_MAPPING: { [key: string]: number } = {
                '1A': 37, // 1r ESO A
                '1B': 38, // 1r ESO B 
                '1C': 39, // 1r ESO C
                '2A': 40, // 2n ESO A
                '2B': 41, // 2n ESO B
                '2C': 42, // 2n ESO C
                '3A': 43, // 3r ESO A
                '3B': 44, // 3r ESO B
                '3C': 45, // 3r ESO C
                '4A': 46, // 4t ESO A
                '4B': 47, // 4t ESO B
                '4C': 48, // 4t ESO C
                '4D': 49  // 4t ESO D
              };
              
              const csvGrupId = record.grupId.toString().trim();
              const realGrupId = GRUP_ID_MAPPING[csvGrupId];
              
              if (!realGrupId) {
                console.log(`Skipping row ${i}: grupId ${csvGrupId} no està mapejat`);
                errorCount++;
                continue;
              }
              
              // Crear el record amb el grupId correcte
              const alumneWithCorrectGrup = {
                ...recordWithAcademicYear,
                grupId: realGrupId
              };
              
              console.log(`Mapping grupId ${csvGrupId} -> ${realGrupId} for alumne: ${record.nom} ${record.cognoms}`);
              await storage.createAlumne(insertAlumneSchema.parse(alumneWithCorrectGrup));
              break;
              
            case 'aules':
              // Validate required fields for aules
              if (!record.nomAula) {
                console.log(`Skipping row ${i}: missing required field nomAula`);
                errorCount++;
                continue;
              }
              await storage.createAula(insertAulaSchema.parse(recordWithAcademicYear));
              break;
              
            case 'materies':
              // Validate required fields for materies
              if (!record.nom || !record.codi) {
                console.log(`Skipping row ${i}: missing required fields (nom or codi)`);
                errorCount++;
                continue;
              }
              
              await storage.createMateria(insertMateriaSchema.parse(recordWithAcademicYear));
              break;

            case 'sortides':
              // Validate required fields for sortides
              if (!record.nomSortida || !record.dataInici) {
                console.log(`Skipping row ${i}: missing required fields`);
                errorCount++;
                continue;
              }
              
              console.log(`Processing row ${i} for sortides:`, recordWithAcademicYear);
              await storage.createSortida(insertSortidaSchema.parse(recordWithAcademicYear));
              break;
              
            case 'guardies':
              // Processar guardies com a horaris especials
              // Validar camps requerits per guardies
              if (!record.diaSemana || !record.horaInici || !record.horaFi || !record.professorId) {
                console.log(`Skipping row ${i}: missing required fields for guardia (diaSemana, horaInici, horaFi, professorId)`);
                errorCount++;
                continue;
              }
              
              // Convertir dia de la setmana a número si és text
              let diaSetmana = record.diaSemana;
              if (typeof diaSetmana === 'string') {
                const diesSetmana: { [key: string]: number } = {
                  'dilluns': 1, 'dimarts': 2, 'dimecres': 3, 'dijous': 4, 'divendres': 5,
                  'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5
                };
                diaSetmana = diesSetmana[diaSetmana.toLowerCase()] || parseInt(diaSetmana);
              }
              
              // Crear horari especial per la guardia
              const guardiaHorari = {
                ...recordWithAcademicYear,
                diaSetmana: diaSetmana,
                assignatura: record.assignatura || 'G', // Usar 'G' per defecte per guardies
                aulaId: record.aulaId || null, // Aula opcional per guardies
                grupId: null // Les guardies no tenen grup assignat
              };
              
              console.log('Creating guardia as horari with data:', guardiaHorari);
              await storage.createHorari(insertHorariSchema.parse(guardiaHorari));
              break;
              
            case 'horaris':
              // Validate required fields for horaris
              if (!record.diaSemana && !record.diaSetmana || !record.horaInici || !record.horaFi || !record.professorId) {
                console.log(`Skipping row ${i}: missing required fields for horari (diaSemana: ${record.diaSemana || record.diaSetmana}, horaInici: ${record.horaInici}, horaFi: ${record.horaFi}, professorId: ${record.professorId})`);
                errorCount++;
                continue;
              }

              // Buscar professor per codi o crear-ne un de nou si és necessari
              let professorId = null;
              const professorCode = record.professorId.toString().trim();
              
              if (professorCode && professorCode !== '' && !isNaN(Number(professorCode))) {
                // Si és un número, usar directament
                professorId = parseInt(professorCode);
              } else if (professorCode && professorCode !== '') {
                // Si és un codi de text, buscar o crear professor
                try {
                  let professor = await storage.getProfessorByCode(professorCode);
                  if (!professor) {
                    // Crear professor nou amb el codi
                    const newProfessor = {
                      anyAcademicId: parseInt(academicYearId),
                      nom: professorCode,
                      cognoms: '',
                      email: `${professorCode.toLowerCase()}@escola.temp`,
                      codiProfessor: professorCode
                    };
                    professor = await storage.createProfessor(insertProfessorSchema.parse(newProfessor));
                  }
                  professorId = professor.id;
                } catch (error) {
                  console.log(`Error processing professor code ${professorCode}:`, error);
                  errorCount++;
                  continue;
                }
              }

              if (!professorId) {
                console.log(`Skipping row ${i}: invalid professorId: ${record.professorId}`);
                errorCount++;
                continue;
              }
              
              // Mapatge dels IDs de grup del CSV als IDs reals de la base de dades (si existeix grupId)
              let horariGrupId = record.grupId;
              if (record.grupId) {
                const GRUP_ID_MAPPING: { [key: string]: number } = {
                  '1A': 37, '1B': 38, '1C': 39,
                  '2A': 40, '2B': 41, '2C': 42,
                  '3A': 43, '3B': 44, '3C': 45,
                  '4A': 46, '4B': 47, '4C': 48, '4D': 49,
                  '4tA': 46, '4tB': 47, '4tC': 48, '4tD': 49  // Variants amb 4t
                };
                
                const csvGrupId = record.grupId.toString().trim();
                const mappedGrupId = GRUP_ID_MAPPING[csvGrupId];
                
                if (mappedGrupId) {
                  horariGrupId = mappedGrupId;
                  console.log(`Mapping grupId ${csvGrupId} -> ${horariGrupId} for horari`);
                } else {
                  console.log(`Warning: grupId ${csvGrupId} no està mapejat, usant valor original`);
                }
              }
              
              // Convertir dia de la setmana a número si és text
              let diaSetmanaHorari = record.diaSemana || record.diaSetmana;
              if (typeof diaSetmanaHorari === 'string') {
                const diesSetmana: { [key: string]: number } = {
                  'dilluns': 1, 'dimarts': 2, 'dimecres': 3, 'dijous': 4, 'divendres': 5,
                  'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5
                };
                diaSetmanaHorari = diesSetmana[diaSetmanaHorari.toLowerCase()] || parseInt(diaSetmanaHorari);
              }
              
              const horariData = {
                ...recordWithAcademicYear,
                professorId: professorId,
                grupId: horariGrupId,
                diaSetmana: diaSetmanaHorari,
                assignatura: record.materia || record.assignatura
              };
              
              console.log('Creating horari with data:', horariData);
              await storage.createHorari(insertHorariSchema.parse(horariData));
              break;
          }
          importedCount++;
        } catch (parseError) {
          console.error(`Error importing row ${i}:`, parseError);
          errorCount++;
        }
      }
      
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      
      // Create metric
      const activeYear = await storage.getAnysAcademics().then(years => 
        years.find(y => y.actiu)?.id || 1
      );
      await storage.createMetric({
        anyAcademicId: activeYear,
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'import_csv',
        detalls: { entityType, importedCount, totalRows: lines.length - 1 },
        entityType: 'csv_import',
        entityId: null
      });
      
      res.json({ 
        success: true, 
        importedCount,
        totalRows: lines.length - 1,
        message: `Successfully imported ${importedCount} records`
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to import CSV" });
    }
  });

  // Download CSV template endpoint
  app.get('/api/download/template', isAuthenticated, async (req, res) => {
    try {
      console.log('Template download request received:', req.query);
      const entityType = req.query.type as string;
      
      if (!entityType) {
        console.log('Missing entity type');
        return res.status(400).json({ message: "Entity type is required" });
      }
      
      console.log('Processing template for entity type:', entityType);

      let csvContent = '';
      let filename = '';

      switch (entityType) {
        case 'professors':
          csvContent = 'nom,cognoms,email,rol\nJoan,García López,joan.garcia@escola.edu,Professor\nMaria,Martínez Vidal,maria.martinez@escola.edu,Coordinadora';
          filename = 'plantilla_professors.csv';
          break;
        case 'grups':
          csvContent = 'nomGrup,nivell,especialitat\n1r ESO A,ESO,Ciències\n2n ESO B,ESO,Humanitats';
          filename = 'plantilla_grups.csv';
          break;
        case 'alumnes':
          csvContent = 'nom,cognoms,email,grupId\nPau,Ferrer Soler,pau.ferrer@estudiants.edu,1\nLaura,Vives Puig,laura.vives@estudiants.edu,1';
          filename = 'plantilla_alumnes.csv';
          break;
        case 'aules':
          csvContent = 'nomAula,capacitat,tipus,ubicacio\nAula 101,30,Estàndard,Planta baixa\nLaboratori 1,25,Laboratori,Primera planta';
          filename = 'plantilla_aules.csv';
          break;
        case 'materies':
          csvContent = 'nom,codi,departament,horesSetmanals,tipus,curs,descripcio\nMatemàtiques,MAT001,Ciències,4,obligatoria,1r ESO,Matemàtiques de primer d\'ESO\nCatalà,CAT001,Humanitats,3,obligatoria,1r ESO,Llengua catalana de primer d\'ESO';
          filename = 'plantilla_materies.csv';
          break;
        case 'sortides':
          csvContent = 'nomSortida,dataInici,dataFi,descripcio,lloc,grupId,responsableId\nVisita al Museu,2025-06-15,2025-06-15,Visita cultural al museu de ciències,Museu de Ciències,1,1\nExcursió muntanya,2025-06-20,2025-06-20,Sortida de senderisme per la muntanya,Parc Natural,2,2';
          filename = 'plantilla_sortides.csv';
          break;
        case 'horaris':
          csvContent = 'diaSemana,horaInici,horaFi,materia,professorId,grupId,aulaId\nDilluns,08:00,09:00,Matemàtiques,1,1,1\nDilluns,09:00,10:00,Català,2,1,2';
          filename = 'plantilla_horaris.csv';
          break;
        case 'guardies':
          csvContent = 'diaSemana,horaInici,horaFi,assignatura,professorId,aulaId,observacions\nDilluns,10:00,11:00,G,5,,Guardia de pati\nDimarts,09:00,10:00,G,3,,Guardia biblioteca\nDimecres,10:00,11:00,G,8,,Guardia passadís\nDijous,09:00,10:00,G,9,,Guardia entrada\nDivendres,10:00,11:00,G,10,,Guardia pati';
          filename = 'plantilla_guardies.csv';
          break;
        default:
          return res.status(400).json({ message: "Invalid entity type" });
      }

      console.log('Sending CSV content:', csvContent.substring(0, 100) + '...');
      console.log('Filename:', filename);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
      
      console.log('Template sent successfully');
    } catch (error: any) {
      console.error('Error generating template:', error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Export CSV endpoint
  app.get('/api/export/csv', isAuthenticated, async (req, res) => {
    try {
      const entityType = req.query.type as string;
      
      if (!entityType) {
        return res.status(400).json({ message: "Entity type is required" });
      }

      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      switch (entityType) {
        case 'sortides':
          data = await storage.getSortides();
          filename = 'sortides.csv';
          headers = ['ID', 'Nom Sortida', 'Descripció', 'Lloc', 'Data Inici', 'Data Fi', 'Grup', 'Responsable'];
          break;
        
        case 'professors':
          data = await storage.getProfessors();
          filename = 'professors.csv';
          headers = ['ID', 'Nom', 'Cognoms', 'Email', 'Departament', 'Rol'];
          break;
        
        case 'grups':
          data = await storage.getGrups();
          filename = 'grups.csv';
          headers = ['ID', 'Nom Grup', 'Curs', 'Nivell', 'Alumnes Count'];
          break;
        
        case 'alumnes':
          data = await storage.getAlumnes();
          filename = 'alumnes.csv';
          headers = ['ID', 'Nom', 'Cognoms', 'Email', 'Grup ID'];
          break;
        
        case 'aules':
          data = await storage.getAules();
          filename = 'aules.csv';
          headers = ['ID', 'Nom', 'Planta', 'Capacitat', 'Tipus'];
          break;
        
        case 'materies':
          data = await storage.getMateries();
          filename = 'materies.csv';
          headers = ['ID', 'Nom', 'Codi', 'Departament', 'Hores Setmanals', 'Tipus', 'Curs', 'Descripció'];
          break;
        
        case 'horaris':
          data = await storage.getHoraris();
          filename = 'horaris.csv';
          headers = ['ID', 'Professor ID', 'Grup ID', 'Aula ID', 'Dia Setmana', 'Hora Inici', 'Hora Fi', 'Assignatura'];
          break;
        
        case 'guardies':
          // Exportar guardies com a horaris amb assignatura 'G'
          const allHoraris = await storage.getHoraris();
          data = allHoraris.filter(horari => horari.assignatura === 'G' || horari.assignatura === 'GUARDIA');
          filename = 'guardies.csv';
          headers = ['ID', 'Professor ID', 'Aula ID', 'Dia Setmana', 'Hora Inici', 'Hora Fi', 'Assignatura', 'Observacions'];
          break;
        
        default:
          return res.status(400).json({ message: "Invalid entity type" });
      }

      // Convert data to CSV format
      const csvRows = [headers.join(',')];
      
      data.forEach(item => {
        const row: string[] = [];
        
        switch (entityType) {
          case 'sortides':
            row.push(
              String(item.id || ''),
              `"${item.nomSortida || ''}"`,
              `"${item.descripcio || ''}"`,
              `"${item.lloc || ''}"`,
              item.dataInici || '',
              item.dataFi || '',
              `"${item.grup?.nomGrup || ''}"`,
              `"${item.responsable ? `${item.responsable.nom} ${item.responsable.cognoms}` : ''}"`,
            );
            break;
          
          case 'professors':
            row.push(
              String(item.id || ''),
              `"${item.nom || ''}"`,
              `"${item.cognoms || ''}"`,
              `"${item.email || ''}"`,
              `"${item.departament || ''}"`,
              `"${item.rol || ''}"`,
            );
            break;
          
          case 'grups':
            row.push(
              String(item.id || ''),
              `"${item.nomGrup || ''}"`,
              `"${item.curs || ''}"`,
              `"${item.nivell || ''}"`,
              String(item.alumnesCount || 0),
            );
            break;
          
          case 'alumnes':
            row.push(
              String(item.id || ''),
              `"${item.nom || ''}"`,
              `"${item.cognoms || ''}"`,
              `"${item.email || ''}"`,
              String(item.grupId || ''),
            );
            break;
          
          case 'aules':
            row.push(
              String(item.id || ''),
              `"${item.nom || ''}"`,
              `"${item.planta || ''}"`,
              String(item.capacitat || 0),
              `"${item.tipus || ''}"`,
            );
            break;
          
          case 'materies':
            row.push(
              String(item.id || ''),
              `"${item.nom || ''}"`,
              `"${item.codi || ''}"`,
              `"${item.departament || ''}"`,
              String(item.horesSetmanals || 0),
              `"${item.tipus || ''}"`,
              `"${item.curs || ''}"`,
              `"${item.descripcio || ''}"`,
            );
            break;
          
          case 'horaris':
            row.push(
              String(item.id || ''),
              String(item.professorId || ''),
              String(item.grupId || ''),
              String(item.aulaId || ''),
              `"${item.diaSetmana || ''}"`,
              item.horaInici || '',
              item.horaFi || '',
              `"${item.assignatura || ''}"`,
            );
            break;
          
          case 'guardies':
            // Convertir dia de setmana de número a text
            const diesSetmana = ['', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
            const diaText = diesSetmana[item.diaSetmana] || item.diaSetmana;
            
            row.push(
              String(item.id || ''),
              String(item.professorId || ''),
              String(item.aulaId || ''),
              `"${diaText}"`,
              item.horaInici || '',
              item.horaFi || '',
              `"${item.assignatura || ''}"`,
              `"${item.observacions || ''}"`,
            );
            break;
        }
        
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Add BOM for UTF-8 to ensure proper encoding in Excel
      res.write('\ufeff');
      res.end(csvContent);

    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Serve uploaded files
  app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/workload-balance', isAuthenticated, async (req, res) => {
    try {
      const engine = new GuardAssignmentEngine();
      const workloadBalance = await engine.getWorkloadBalance();
      res.json(workloadBalance);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get workload balance" });
    }
  });

  app.get('/api/analytics/guard-stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getGuardAssignmentStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get guard stats" });
    }
  });

  // Route for creating professors quickly
  app.post('/api/setup/create-professors', isAuthenticated, async (req, res) => {
    try {
      console.log('Creating professors...');
      
      // Get active academic year for professors
      const activeYear = await storage.getAnysAcademics().then(years => 
        years.find(y => y.actiu)?.id || 1
      );

      // Profesores del centro educativo
      const profesoresData = [
        { anyAcademicId: activeYear, nom: "Patricia", cognoms: "Fajardo", email: "patricia.fajardo@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Alba", cognoms: "Serqueda", email: "alba.serqueda@escola.cat", rol: "cap_departament", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Marta", cognoms: "Fernàndez", email: "marta.fernandez@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Mar", cognoms: "Villar", email: "mar.villar@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Eva", cognoms: "Martin", email: "eva.martin@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Joan", cognoms: "Marí", email: "joan.mari@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Julia", cognoms: "Coll", email: "julia.coll@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Roger", cognoms: "Sabartes", email: "roger.sabartes@escola.cat", rol: "cap_departament", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Maria", cognoms: "Creus", email: "maria.creus@escola.cat", rol: "tutor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Liliana", cognoms: "Perea", email: "liliana.perea@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "JC", cognoms: "Tinoco", email: "jc.tinoco@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Toni", cognoms: "Motos", email: "toni.motos@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Teresa", cognoms: "Caralto", email: "teresa.caralto@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Albert", cognoms: "Parrilla", email: "albert.parrilla@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Noe", cognoms: "Muñoz", email: "noe.munoz@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Albert", cognoms: "Freixenet", email: "albert.freixenet@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Itziar", cognoms: "Fuentes", email: "itziar.fuentes@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Berta", cognoms: "Riera", email: "berta.riera@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Laura", cognoms: "Manchado", email: "laura.manchado@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Luis", cognoms: "Cabrera", email: "luis.cabrera@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Benet", cognoms: "Andujar", email: "benet.andujar@escola.cat", rol: "cap_departament", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Dani", cognoms: "Palau", email: "dani.palau@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Inmaculada", cognoms: "Murillo", email: "inmaculada.murillo@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Mireia", cognoms: "Vendrell", email: "mireia.vendrell@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Maria J.", cognoms: "Romero", email: "mariaj.romero@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Marta", cognoms: "Lopez", email: "marta.lopez@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Xavier", cognoms: "Reyes", email: "xavier.reyes@escola.cat", rol: "professor", passwordHash: null },
        { anyAcademicId: activeYear, nom: "Elvira", cognoms: "Parra", email: "elvira.parra@escola.cat", rol: "professor", passwordHash: null }
      ];

      const profesoresCreados = [];
      for (const profesor of profesoresData) {
        try {
          const created = await storage.createProfessor(profesor);
          profesoresCreados.push(created);
          console.log(`Created: ${profesor.nom} ${profesor.cognoms}`);
        } catch (error: any) {
          if (!error.message.includes('unique')) {
            console.error(`Error creating ${profesor.nom}:`, error.message);
          }
        }
      }

      res.json({
        success: true,
        professors: profesoresCreados.length,
        message: `Creados ${profesoresCreados.length} profesores del centro educativo`
      });

    } catch (error: any) {
      console.error("Error creating professors:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error creando profesores",
        error: error.message 
      });
    }
  });

  // ENDPOINTS PER SUBSTITUCIONS DE SORTIDES

  // Obtenir classes que cal substituir per una sortida
  app.get('/api/sortides/:sortidaId/classes-substituir', isAuthenticated, async (req, res) => {
    try {
      console.log('=== INICI RUTA CLASSES-SUBSTITUIR ===');
      const sortidaId = parseInt(req.params.sortidaId);
      console.log('sortidaId:', sortidaId);
      
      const activeYear = await storage.getActiveAcademicYearFull();
      console.log('activeYear:', activeYear);
      
      if (!activeYear) {
        console.log('ERROR: No hi ha any acadèmic actiu');
        return res.status(400).json({ message: "No hi ha cap any acadèmic actiu" });
      }

      console.log('Cridant getClassesToSubstitute amb:', { sortidaId, anyAcademicId: activeYear.id });
      const classesToSubstitute = await storage.getClassesToSubstitute(sortidaId, activeYear.id);
      console.log('Resultat getClassesToSubstitute:', classesToSubstitute);
      
      if (classesToSubstitute.length === 0) {
        console.log('No classes trobades - retornant error 400');
        return res.status(400).json({ message: "No hi ha cap classe que necessiti substitució per aquesta sortida" });
      }
      
      res.json(classesToSubstitute);
    } catch (error: any) {
      console.error("Error getting classes to substitute:", error);
      res.status(500).json({ message: "Error obtenint classes a substituir" });
    }
  });

  // Obtenir professors disponibles per substituir una classe específica
  app.get('/api/horari/:horariId/professors-disponibles', isAuthenticated, async (req, res) => {
    try {
      const horariId = parseInt(req.params.horariId);
      console.log(`=== INICI RUTA PROFESSORS-DISPONIBLES ===`);
      console.log(`horariId: ${horariId}`);
      
      const activeYear = await storage.getActiveAcademicYear();
      console.log('activeYear:', activeYear);
      console.log('activeYear type:', typeof activeYear);
      
      if (!activeYear) {
        console.log('No hi ha any acadèmic actiu');
        return res.status(400).json({ message: "No hi ha cap any acadèmic actiu" });
      }

      // Si activeYear és només un número (ID), usar-lo directament
      const anyAcademicId = typeof activeYear === 'number' ? activeYear : activeYear.id;
      console.log('anyAcademicId final:', anyAcademicId);

      const availableProfessors = await storage.getProfessorsAvailableForSubstitution(horariId, anyAcademicId);
      console.log(`Resultat professors disponibles: ${availableProfessors.length} professors`);
      res.json(availableProfessors);
    } catch (error: any) {
      console.error("Error getting available professors:", error);
      res.status(500).json({ message: "Error obtenint professors disponibles" });
    }
  });

  // Assignar professors acompanyants a una sortida
  app.post('/api/sortides/:sortidaId/professors', isAuthenticated, async (req, res) => {
    try {
      const sortidaId = parseInt(req.params.sortidaId);
      const { professorIds } = req.body;
      const activeYear = await storage.getAnysAcademics().then(years => 
        years.find(y => y.actiu)
      );
      
      if (!activeYear) {
        return res.status(400).json({ message: "No hi ha cap any acadèmic actiu" });
      }

      const assignacions = [];
      for (const professorId of professorIds) {
        const assignacio = await storage.createSortidaProfessor({
          anyAcademicId: activeYear.id,
          sortidaId,
          professorId,
          tipus: 'acompanyant'
        });
        assignacions.push(assignacio);
      }

      res.json(assignacions);
    } catch (error: any) {
      console.error("Error assigning professors to sortida:", error);
      res.status(500).json({ message: "Error assignant professors a la sortida" });
    }
  });

  // Gestionar alumnes afectats per una sortida
  app.post('/api/sortides/:sortidaId/alumnes', isAuthenticated, async (req, res) => {
    try {
      const sortidaId = parseInt(req.params.sortidaId);
      const { alumneIds } = req.body;
      const activeYear = await storage.getAnysAcademics().then(years => 
        years.find(y => y.actiu)
      );
      
      if (!activeYear) {
        return res.status(400).json({ message: "No hi ha cap any acadèmic actiu" });
      }

      const assignacions = [];
      for (const alumneId of alumneIds) {
        const assignacio = await storage.createSortidaAlumne({
          anyAcademicId: activeYear.id,
          sortidaId,
          alumneId,
          confirmacio: 'confirmat'
        });
        assignacions.push(assignacio);
      }

      res.json(assignacions);
    } catch (error: any) {
      console.error("Error assigning alumnes to sortida:", error);
      res.status(500).json({ message: "Error assignant alumnes a la sortida" });
    }
  });

  // Crear substitució per una classe específica
  app.post('/api/sortides/:sortidaId/substitucions', isAuthenticated, async (req, res) => {
    try {
      const sortidaId = parseInt(req.params.sortidaId);
      const { horariOriginalId, professorOriginalId, professorSubstitutId, observacions } = req.body;
      const activeYear = await storage.getActiveAcademicYearFull();
      
      if (!activeYear) {
        return res.status(400).json({ message: "No hi ha cap any acadèmic actiu" });
      }

      const substitucio = await storage.createSortidaSubstitucio({
        anyAcademicId: activeYear.id,
        sortidaId,
        horariOriginalId,
        professorOriginalId,
        professorSubstitutId,
        estat: 'planificada',
        observacions: observacions || '',
        comunicacioEnviada: false
      });

      res.json(substitucio);
    } catch (error: any) {
      console.error("Error creating substitution:", error);
      res.status(500).json({ message: "Error creant substitució" });
    }
  });

  // Confirmar totes les substitucions d'una sortida i enviar comunicacions
  app.post('/api/sortides/:sortidaId/confirmar-substitucions', isAuthenticated, async (req, res) => {
    try {
      const sortidaId = parseInt(req.params.sortidaId);
      const activeYear = await storage.getActiveAcademicYearFull();
      
      if (!activeYear) {
        return res.status(400).json({ message: "No hi ha cap any acadèmic actiu" });
      }

      // Obtenir totes les substitucions de la sortida
      const substitucions = await storage.getSortidaSubstitucions(sortidaId);
      
      // Obtenir informació de la sortida
      const sortida = await storage.getSortida(sortidaId);
      if (!sortida) {
        return res.status(404).json({ message: "Sortida no trobada" });
      }

      // Actualitzar estat de totes les substitucions
      const confirmades = [];
      for (const substitucio of substitucions) {
        const updated = await storage.updateSortidaSubstitucio(substitucio.id, {
          estat: 'confirmada',
          comunicacioEnviada: true
        });
        confirmades.push(updated);

        // Crear comunicació per al professor substitut
        await storage.createComunicacio({
          anyAcademicId: activeYear.id,
          tipusDest: 'professor',
          destinatariId: substitucio.professorSubstitutId,
          missatge: `Has estat assignat com a professor substitut per la sortida "${sortida.nomSortida}" el ${sortida.dataInici}. ${substitucio.observacions || ''}`,
          tipus: 'notificacio',
          emissorId: null // Sistema automàtic
        });

        // Crear comunicació per al professor original
        await storage.createComunicacio({
          anyAcademicId: activeYear.id,
          tipusDest: 'professor',
          destinatariId: substitucio.professorOriginalId,
          missatge: `La teva classe ha estat coberta per la sortida "${sortida.nomSortida}" el ${sortida.dataInici}. Professor substitut assignat.`,
          tipus: 'informativa',
          emissorId: null // Sistema automàtic
        });
      }

      // Crear mètrica
      await storage.createMetric({
        anyAcademicId: activeYear.id,
        timestamp: new Date(),
        usuariId: (req.user as any)?.claims?.sub || 'sistema',
        accio: 'confirmar_substitucions_sortida',
        detalls: {
          sortidaId,
          substitucionsConfirmades: confirmades.length,
          comunicacionsEnviades: confirmades.length * 2
        },
        entityType: 'sortida',
        entityId: sortidaId
      });

      res.json({
        success: true,
        substitucionsConfirmades: confirmades.length,
        comunicacionsEnviades: confirmades.length * 2,
        message: `Confirmades ${confirmades.length} substitucions i enviades ${confirmades.length * 2} comunicacions`
      });
    } catch (error: any) {
      console.error("Error confirming substitutions:", error);
      res.status(500).json({ message: "Error confirmant substitucions" });
    }
  });

  // Obtenir substitucions d'una sortida
  app.get('/api/sortides/:sortidaId/substitucions', isAuthenticated, async (req, res) => {
    try {
      const sortidaId = parseInt(req.params.sortidaId);
      const substitucions = await storage.getSortidaSubstitucions(sortidaId);
      res.json(substitucions);
    } catch (error: any) {
      console.error("Error getting sortida substitutions:", error);
      res.status(500).json({ message: "Error obtenint substitucions de la sortida" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
