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
      
      // First try without OpenAI to isolate the problem
      const result = { response: "Hola! El sistema està funcionant. La teva pregunta era: " + message };
      console.log("Sending JSON response:", result);
      
      res.json(result);
    } catch (error: any) {
      console.error("Simple chat error details:", error);
      console.error("Error stack:", error.stack);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to process chat message", error: error.message });
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
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_professor',
        detalls: { professorId: professor.id },
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
        timestamp: new Date(),
        usuariId: (req as any).user.claims.sub,
        accio: 'crear_tasca',
        detalls: { tascaId: tasca.id },
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
      await storage.createMetric({
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
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
