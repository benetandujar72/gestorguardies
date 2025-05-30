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
  insertAttachmentSchema
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
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const professor = await storage.getProfessorByUserId(userId);
      res.json({ ...user, professor });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Professor routes
  app.get('/api/professors', isAuthenticated, async (req, res) => {
    try {
      const professors = await storage.getProfessors();
      res.json(professors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch professors" });
    }
  });

  app.post('/api/professors', isAuthenticated, async (req, res) => {
    try {
      const professorData = insertProfessorSchema.parse(req.body);
      const professor = await storage.createProfessor(professorData);
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_professor',
        detalls: { professorId: professor.id },
      });
      
      res.json(professor);
    } catch (error) {
      res.status(400).json({ message: "Invalid professor data" });
    }
  });

  app.put('/api/professors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const professorData = insertProfessorSchema.partial().parse(req.body);
      const professor = await storage.updateProfessor(id, professorData);
      res.json(professor);
    } catch (error) {
      res.status(400).json({ message: "Failed to update professor" });
    }
  });

  app.delete('/api/professors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProfessor(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete professor" });
    }
  });

  // Grup routes
  app.get('/api/grups', isAuthenticated, async (req, res) => {
    try {
      const grups = await storage.getGrups();
      res.json(grups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/grups', isAuthenticated, async (req, res) => {
    try {
      const grupData = insertGrupSchema.parse(req.body);
      const grup = await storage.createGrup(grupData);
      res.json(grup);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.put('/api/grups/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const grupData = insertGrupSchema.partial().parse(req.body);
      const grup = await storage.updateGrup(id, grupData);
      res.json(grup);
    } catch (error) {
      res.status(400).json({ message: "Failed to update group" });
    }
  });

  app.delete('/api/grups/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGrup(id);
      res.json({ success: true });
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post('/api/alumnes', isAuthenticated, async (req, res) => {
    try {
      const alumneData = insertAlumneSchema.parse(req.body);
      const alumne = await storage.createAlumne(alumneData);
      res.json(alumne);
    } catch (error) {
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  // Aula routes
  app.get('/api/aules', isAuthenticated, async (req, res) => {
    try {
      const aules = await storage.getAules();
      res.json(aules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classrooms" });
    }
  });

  app.post('/api/aules', isAuthenticated, async (req, res) => {
    try {
      const aulaData = insertAulaSchema.parse(req.body);
      const aula = await storage.createAula(aulaData);
      res.json(aula);
    } catch (error) {
      res.status(400).json({ message: "Invalid classroom data" });
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post('/api/horaris', isAuthenticated, async (req, res) => {
    try {
      const horariData = insertHorariSchema.parse(req.body);
      const horari = await storage.createHorari(horariData);
      res.json(horari);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch outings" });
    }
  });

  app.post('/api/sortides', isAuthenticated, async (req, res) => {
    try {
      const sortidaData = insertSortidaSchema.parse(req.body);
      const sortida = await storage.createSortida(sortidaData);
      
      // Create metric for new outing
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_sortida',
        detalls: { sortidaId: sortida.id },
      });
      
      res.json(sortida);
    } catch (error) {
      res.status(400).json({ message: "Invalid outing data" });
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guards" });
    }
  });

  app.post('/api/guardies', isAuthenticated, async (req, res) => {
    try {
      const guardiaData = insertGuardiaSchema.parse(req.body);
      const guardia = await storage.createGuardia(guardiaData);
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_guardia',
        detalls: { guardiaId: guardia.id },
      });
      
      res.json(guardia);
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guard assignments" });
    }
  });

  app.post('/api/assignacions-guardia', isAuthenticated, async (req, res) => {
    try {
      const assignacioData = insertAssignacioGuardiaSchema.parse(req.body);
      const assignacio = await storage.createAssignacioGuardia(assignacioData);
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'assignar_guardia',
        detalls: { assignacioId: assignacio.id, professorId: assignacio.professorId, guardiaId: assignacio.guardiaId },
      });
      
      res.json(assignacio);
    } catch (error) {
      res.status(400).json({ message: "Invalid assignment data" });
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
      await storage.createMetric({
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasques', isAuthenticated, async (req, res) => {
    try {
      const tascaData = insertTascaSchema.parse(req.body);
      const tasca = await storage.createTasca(tascaData);
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_tasca',
        detalls: { tascaId: tasca.id },
      });
      
      res.json(tasca);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put('/api/tasques/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tascaData = insertTascaSchema.partial().parse(req.body);
      const tasca = await storage.updateTasca(id, tascaData);
      res.json(tasca);
    } catch (error) {
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
        const attachment = await storage.createAttachment({
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
    } catch (error) {
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get('/api/tasques/:id/attachments', isAuthenticated, async (req, res) => {
    try {
      const tascaId = parseInt(req.params.id);
      const attachments = await storage.getAttachmentsByTasca(tascaId);
      res.json(attachments);
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.post('/api/comunicacions', isAuthenticated, async (req, res) => {
    try {
      const comunicacioData = insertComunicacioSchema.parse(req.body);
      const comunicacio = await storage.createComunicacio(comunicacioData);
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'enviar_comunicacio',
        detalls: { comunicacioId: comunicacio.id },
      });
      
      res.json(comunicacio);
    } catch (error) {
      res.status(400).json({ message: "Invalid communication data" });
    }
  });

  app.put('/api/comunicacions/:id/read', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markComunicacioAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to mark as read" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/guard-stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getGuardAssignmentStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guard statistics" });
    }
  });

  app.get('/api/analytics/workload-balance', isAuthenticated, async (req, res) => {
    try {
      const balance = await storage.getProfessorWorkloadBalance();
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workload balance" });
    }
  });

  // AI Chat routes
  app.post('/api/chat/session', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      
      // Get or create active session
      let session = await storage.getUserActiveChatSession(userId);
      if (!session) {
        session = await storage.createChatSession(userId);
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.post('/api/chat/:sessionId/message', isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { message } = req.body;
      const userId = (req as any).user.claims.sub;
      
      // Get session
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Add user message
      const messages = Array.isArray(session.missatges) ? session.missatges : [];
      messages.push({
        emissor: 'usuari',
        text: message,
        moment: new Date().toISOString(),
      });
      
      // Generate AI response
      const aiResponse = await generateChatResponse(message, messages);
      
      // Add AI response
      messages.push({
        emissor: 'bot',
        text: aiResponse,
        moment: new Date().toISOString(),
      });
      
      // Update session
      await storage.updateChatSession(sessionId, { missatges: messages });
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: userId,
        accio: 'chat_message',
        detalls: { sessionId, messageLength: message.length },
      });
      
      res.json({ response: aiResponse });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // CSV Import route
  app.post('/api/import/csv', isAuthenticated, upload.single('csvFile'), async (req, res) => {
    try {
      const file = req.file;
      const { entityType } = req.body;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Process CSV file (simplified implementation)
      const csvData = fs.readFileSync(file.path, 'utf8');
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      let importedCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
          const record: any = {};
          headers.forEach((header, index) => {
            record[header.trim()] = values[index].trim();
          });
          
          try {
            switch (entityType) {
              case 'professors':
                await storage.createProfessor(insertProfessorSchema.parse(record));
                break;
              case 'grups':
                await storage.createGrup(insertGrupSchema.parse(record));
                break;
              case 'alumnes':
                await storage.createAlumne(insertAlumneSchema.parse(record));
                break;
              case 'aules':
                await storage.createAula(insertAulaSchema.parse(record));
                break;
              case 'sortides':
                await storage.createSortida(insertSortidaSchema.parse(record));
                break;
            }
            importedCount++;
          } catch (parseError) {
            console.error(`Error importing row ${i}:`, parseError);
          }
        }
      }
      
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      
      // Create metric
      await storage.createMetric({
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'import_csv',
        detalls: { entityType, importedCount, totalRows: lines.length - 1 },
      });
      
      res.json({ 
        success: true, 
        importedCount,
        totalRows: lines.length - 1,
        message: `Successfully imported ${importedCount} records`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import CSV" });
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
    } catch (error) {
      res.status(500).json({ message: "Failed to get workload balance" });
    }
  });

  app.get('/api/analytics/guard-stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getGuardAssignmentStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get guard stats" });
    }
  });

  // Route for populating database with school data
  app.post('/api/setup/populate-school-data', isAuthenticated, async (req, res) => {
    try {
      // Profesores del centro educativo
      const profesoresData = [
        { nom: "Patricia", cognoms: "Fajardo", email: "patricia.fajardo@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Alba", cognoms: "Serqueda", email: "alba.serqueda@escola.cat", rol: "cap_departament", passwordHash: null },
        { nom: "Marta", cognoms: "Fernàndez", email: "marta.fernandez@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Mar", cognoms: "Villar", email: "mar.villar@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Eva", cognoms: "Martin", email: "eva.martin@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Joan", cognoms: "Marí", email: "joan.mari@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Julia", cognoms: "Coll", email: "julia.coll@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Roger", cognoms: "Sabartes", email: "roger.sabartes@escola.cat", rol: "cap_departament", passwordHash: null },
        { nom: "Maria", cognoms: "Creus", email: "maria.creus@escola.cat", rol: "tutor", passwordHash: null },
        { nom: "Liliana", cognoms: "Perea", email: "liliana.perea@escola.cat", rol: "professor", passwordHash: null },
        { nom: "JC", cognoms: "Tinoco", email: "jc.tinoco@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Toni", cognoms: "Motos", email: "toni.motos@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Teresa", cognoms: "Caralto", email: "teresa.caralto@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Albert", cognoms: "Parrilla", email: "albert.parrilla@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Noe", cognoms: "Muñoz", email: "noe.munoz@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Albert", cognoms: "Freixenet", email: "albert.freixenet@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Itziar", cognoms: "Fuentes", email: "itziar.fuentes@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Berta", cognoms: "Riera", email: "berta.riera@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Laura", cognoms: "Manchado", email: "laura.manchado@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Luis", cognoms: "Cabrera", email: "luis.cabrera@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Benet", cognoms: "Andujar", email: "benet.andujar@escola.cat", rol: "cap_departament", passwordHash: null },
        { nom: "Dani", cognoms: "Palau", email: "dani.palau@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Inmaculada", cognoms: "Murillo", email: "inmaculada.murillo@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Mireia", cognoms: "Vendrell", email: "mireia.vendrell@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Maria J.", cognoms: "Romero", email: "mariaj.romero@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Marta", cognoms: "Lopez", email: "marta.lopez@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Xavier", cognoms: "Reyes", email: "xavier.reyes@escola.cat", rol: "professor", passwordHash: null },
        { nom: "Elvira", cognoms: "Parra", email: "elvira.parra@escola.cat", rol: "professor", passwordHash: null }
      ];

      const grupsData = [
        { nom: "1r ESO A", curs: "1r", nivell: "ESO" },
        { nom: "1r ESO B", curs: "1r", nivell: "ESO" },
        { nom: "1r ESO C", curs: "1r", nivell: "ESO" },
        { nom: "2n ESO A", curs: "2n", nivell: "ESO" },
        { nom: "2n ESO B", curs: "2n", nivell: "ESO" },
        { nom: "2n ESO C", curs: "2n", nivell: "ESO" },
        { nom: "3r ESO A", curs: "3r", nivell: "ESO" },
        { nom: "3r ESO B", curs: "3r", nivell: "ESO" },
        { nom: "3r ESO C", curs: "3r", nivell: "ESO" },
        { nom: "4t ESO A", curs: "4t", nivell: "ESO" },
        { nom: "4t ESO B", curs: "4t", nivell: "ESO" },
        { nom: "4t ESO C", curs: "4t", nivell: "ESO" },
        { nom: "4t ESO D", curs: "4t", nivell: "ESO" }
      ];

      const aulesData = [
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

      const guardiasData = [
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

      const sortidasData = [
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

      // 1. Crear profesores
      const profesoresCreados = [];
      for (const profesor of profesoresData) {
        try {
          const created = await storage.createProfessor(profesor);
          profesoresCreados.push(created);
        } catch (error) {
          if (!error.message.includes('unique')) {
            throw error;
          }
        }
      }

      // 2. Crear grupos
      const gruposCreados = [];
      for (const grupo of grupsData) {
        try {
          const created = await storage.createGrup(grupo);
          gruposCreados.push(created);
        } catch (error) {
          if (!error.message.includes('unique')) {
            throw error;
          }
        }
      }

      // 3. Crear aulas
      const aulasCreadas = [];
      for (const aula of aulesData) {
        try {
          const created = await storage.createAula(aula);
          aulasCreadas.push(created);
        } catch (error) {
          if (!error.message.includes('unique')) {
            throw error;
          }
        }
      }

      // 4. Crear guardias
      const guardiasCreadas = [];
      for (const guardia of guardiasData) {
        try {
          const created = await storage.createGuardia(guardia);
          guardiasCreadas.push(created);
        } catch (error) {
          if (!error.message.includes('unique')) {
            throw error;
          }
        }
      }

      // 5. Crear sortidas
      const sortidasCreadas = [];
      for (const sortida of sortidasData) {
        try {
          const created = await storage.createSortida(sortida);
          sortidasCreadas.push(created);
        } catch (error) {
          if (!error.message.includes('unique')) {
            throw error;
          }
        }
      }

      // 6. Crear horarios para cada profesor (con G para indicar disponibilidad de guardia)
      const allProfessors = await storage.getProfessors();
      const allGroups = await storage.getGrups();
      const allAulas = await storage.getAules();
      let totalHorarios = 0;

      for (const professor of allProfessors) {
        const horariosProfesor = [
          // Lunes
          { professorId: professor.id, grupId: allGroups[0]?.id || null, aulaId: allAulas[0]?.id || null, diaSemana: "Dilluns", horaInici: "08:00", horaFi: "09:00", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: null, aulaId: null, diaSemana: "Dilluns", horaInici: "09:00", horaFi: "10:00", assignatura: "G", observacions: "Disponible per guardia" },
          { professorId: professor.id, grupId: null, aulaId: null, diaSemana: "Dilluns", horaInici: "10:00", horaFi: "10:30", assignatura: "G", observacions: "Disponible per guardia - Pati" },
          { professorId: professor.id, grupId: allGroups[1]?.id || null, aulaId: allAulas[1]?.id || null, diaSemana: "Dilluns", horaInici: "10:30", horaFi: "11:30", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: allGroups[2]?.id || null, aulaId: allAulas[2]?.id || null, diaSemana: "Dilluns", horaInici: "11:30", horaFi: "12:30", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: null, aulaId: null, diaSemana: "Dilluns", horaInici: "12:30", horaFi: "13:30", assignatura: "G", observacions: "Disponible per guardia - Passadís" },
          { professorId: professor.id, grupId: allGroups[3]?.id || null, aulaId: allAulas[3]?.id || null, diaSemana: "Dilluns", horaInici: "13:30", horaFi: "14:30", assignatura: "Classe", observacions: null },
          
          // Martes
          { professorId: professor.id, grupId: null, aulaId: null, diaSemana: "Dimarts", horaInici: "08:00", horaFi: "09:00", assignatura: "G", observacions: "Disponible per guardia - Entrada" },
          { professorId: professor.id, grupId: allGroups[4]?.id || null, aulaId: allAulas[4]?.id || null, diaSemana: "Dimarts", horaInici: "09:00", horaFi: "10:00", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: null, aulaId: null, diaSemana: "Dimarts", horaInici: "10:00", horaFi: "10:30", assignatura: "G", observacions: "Disponible per guardia - Pati" },
          { professorId: professor.id, grupId: allGroups[5]?.id || null, aulaId: allAulas[5]?.id || null, diaSemana: "Dimarts", horaInici: "10:30", horaFi: "11:30", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: allGroups[6]?.id || null, aulaId: allAulas[6]?.id || null, diaSemana: "Dimarts", horaInici: "11:30", horaFi: "12:30", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: allGroups[7]?.id || null, aulaId: allAulas[7]?.id || null, diaSemana: "Dimarts", horaInici: "12:30", horaFi: "13:30", assignatura: "Classe", observacions: null },
          { professorId: professor.id, grupId: null, aulaId: null, diaSemana: "Dimarts", horaInici: "13:30", horaFi: "14:30", assignatura: "G", observacions: "Disponible per guardia - Cantina" }
        ];

        for (const horario of horariosProfesor) {
          try {
            await storage.createHorari(horario);
            totalHorarios++;
          } catch (error) {
            // Ignore duplicates
          }
        }
      }

      res.json({
        success: true,
        data: {
          profesores: profesoresCreados.length,
          grupos: gruposCreados.length,
          aulas: aulasCreadas.length,
          guardias: guardiasCreadas.length,
          sortidas: sortidasCreadas.length,
          horarios: totalHorarios
        },
        message: "Datos del centro educativo creados exitosamente"
      });

    } catch (error) {
      console.error("Error populating school data:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error creando datos del centro educativo",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
