import { Router } from 'express';
import { loginUser, createInitialUsers, authenticateToken, AuthUser } from './auth';

const router = Router();

// Login endpoint
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email i contrasenya són obligatoris' 
      });
    }

    const result = await loginUser(email, password);
    
    if (!result) {
      return res.status(401).json({ 
        message: 'Credencials incorrectes' 
      });
    }

    const { user, token } = result;

    res.json({
      message: 'Login correcte',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        cognoms: user.cognoms,
        rol: user.rol,
        anyAcademicId: user.anyAcademicId
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error intern del servidor' 
    });
  }
});

// Get current user endpoint
router.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = req.user as AuthUser;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      cognoms: user.cognoms,
      rol: user.rol,
      anyAcademicId: user.anyAcademicId
    }
  });
});

// Logout endpoint (client-side JWT deletion)
router.post('/api/auth/logout', (req, res) => {
  res.json({ 
    message: 'Logout correcte. Elimina el token del client.' 
  });
});

// Initialize users endpoint (for development)
router.post('/api/auth/init-users', async (req, res) => {
  try {
    await createInitialUsers();
    res.json({ 
      message: 'Usuaris inicials creats correctament' 
    });
  } catch (error) {
    console.error('Error creant usuaris inicials:', error);
    res.status(500).json({ 
      message: 'Error creant usuaris inicials' 
    });
  }
});

export default router;