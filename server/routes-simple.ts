import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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
      const professor = await storage.createProfessor(req.body);
      res.json(professor);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create professor" });
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

  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req, res) => {
    try {
      const groups = await storage.getGrups();
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  // Guards routes
  app.get('/api/guards', isAuthenticated, async (req, res) => {
    try {
      const guards = await storage.getGuardies();
      res.json(guards);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch guards" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}