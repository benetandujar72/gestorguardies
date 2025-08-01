import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: number;
  email: string;
  nom: string;
  cognoms: string;
  rol: string;
  anyAcademicId: number;
}

export interface JWTPayload {
  userId: number;
  email: string;
  rol: string;
  anyAcademicId: number;
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password utility
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accés requerit' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Token no vàlid o caducat' });
  }

  // Get full user info
  try {
    const professor = await storage.getProfessor(payload.userId);
    if (!professor) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    // Add user info to request
    req.user = {
      id: professor.id,
      email: professor.email,
      nom: professor.nom,
      cognoms: professor.cognoms,
      rol: professor.rol,
      anyAcademicId: professor.anyAcademicId
    } as AuthUser;

    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    return res.status(500).json({ message: 'Error intern del servidor' });
  }
}

// Authorization middleware
export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser;
    
    if (!user) {
      return res.status(401).json({ message: 'No autenticat' });
    }

    if (!roles.includes(user.rol)) {
      return res.status(403).json({ message: 'Accés denegat - Permisos insuficients' });
    }

    next();
  };
}

// Login function
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  try {
    // Get professor by email
    const professor = await storage.getProfessorByEmail(email);
    if (!professor || !professor.passwordHash) {
      return null;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, professor.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Generate token
    const payload: JWTPayload = {
      userId: professor.id,
      email: professor.email,
      rol: professor.rol,
      anyAcademicId: professor.anyAcademicId
    };

    const token = generateToken(payload);

    const user: AuthUser = {
      id: professor.id,
      email: professor.email,
      nom: professor.nom,
      cognoms: professor.cognoms,
      rol: professor.rol,
      anyAcademicId: professor.anyAcademicId
    };

    return { user, token };
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
}

// Create initial admin user
export async function createInitialUsers(): Promise<void> {
  try {
    const activeYear = await storage.getActiveAcademicYearFull();
    if (!activeYear) {
      console.log('⚠️  No hi ha any acadèmic actiu per crear usuaris inicials');
      return;
    }

    // Define initial users for different roles and institutions
    const initialUsers = [
      {
        nom: 'Administrador',
        cognoms: 'del Sistema',
        email: 'admin@insbitacola.cat',
        password: 'admin123',
        rol: 'administrador',
        codiProfessor: 'ADMIN001'
      },
      {
        nom: 'Director',
        cognoms: 'de Centre',
        email: 'director@insbitacola.cat',
        password: 'director123',
        rol: 'director',
        codiProfessor: 'DIR001'
      },
      {
        nom: 'Coordinador',
        cognoms: 'Acadèmic',
        email: 'coordinador@insbitacola.cat',
        password: 'coord123',
        rol: 'coordinador',
        codiProfessor: 'COORD001'
      },
      {
        nom: 'Professor',
        cognoms: 'de Matemàtiques',
        email: 'professor@insbitacola.cat',
        password: 'prof123',
        rol: 'professor',
        codiProfessor: 'PROF001'
      },
      {
        nom: 'Secretari',
        cognoms: 'Acadèmic',
        email: 'secretari@insbitacola.cat',
        password: 'secr123',
        rol: 'secretari',
        codiProfessor: 'SECR001'
      }
    ];

    for (const userData of initialUsers) {
      try {
        // Check if user already exists
        const existingUser = await storage.getProfessorByEmail(userData.email);
        if (existingUser) {
          console.log(`✓ Usuari ${userData.email} ja existeix`);
          continue;
        }

        // Hash password
        const passwordHash = await hashPassword(userData.password);

        // Create user
        const newUser = await storage.createProfessor({
          anyAcademicId: activeYear.id,
          nom: userData.nom,
          cognoms: userData.cognoms,
          email: userData.email,
          passwordHash,
          rol: userData.rol,
          codiProfessor: userData.codiProfessor
        });

        console.log(`✓ Creat usuari ${userData.rol}: ${userData.email} (ID: ${newUser.id})`);
      } catch (error) {
        console.error(`❌ Error creant usuari ${userData.email}:`, error);
      }
    }

    console.log('\n🎯 Usuaris inicials creats:');
    console.log('📧 admin@insbitacola.cat - Contrasenya: admin123 (Administrador)');
    console.log('📧 director@insbitacola.cat - Contrasenya: director123 (Director)');
    console.log('📧 coordinador@insbitacola.cat - Contrasenya: coord123 (Coordinador)');
    console.log('📧 professor@insbitacola.cat - Contrasenya: prof123 (Professor)');
    console.log('📧 secretari@insbitacola.cat - Contrasenya: secr123 (Secretari)');
    console.log('\n⚠️  Canvia aquestes contrasenyes en producció!\n');

  } catch (error) {
    console.error('❌ Error creant usuaris inicials:', error);
  }
}

// Declare the user property on Express Request
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}