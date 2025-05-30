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
      
      // Get guard details
      const guardia = await storage.getGuardiesByDate(req.body.date || new Date().toISOString().split('T')[0]);
      const professors = await storage.getProfessors();
      const sortides = await storage.getSortidesThisWeek();
      const currentAssignments = await storage.getAssignacionsGuardia();
      
      // Use AI to help with assignment analysis
      const context = {
        guardia: guardia.find(g => g.id === guardiaId),
        professors,
        sortides,
        currentAssignments,
      };
      
      const aiAnalysis = await analyzeGuardAssignments(context);
      
      // Implement priority logic:
      // 1. Professors freed by outings/activities
      // 2. Assigned guard professors  
      // 3. Professors with meetings/administrative duties
      // 4. Balance distribution based on previous assignments
      
      const workloadBalance = await storage.getProfessorWorkloadBalance();
      
      // Create prediction record
      await storage.createPrediction({
        data: new Date().toISOString().split('T')[0],
        context,
        resultat: aiAnalysis,
        confidence: aiAnalysis.confidence || 80,
        tipus: 'assignacio',
      });
      
      res.json(aiAnalysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to auto-assign guard" });
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

  const httpServer = createServer(app);
  return httpServer;
}
