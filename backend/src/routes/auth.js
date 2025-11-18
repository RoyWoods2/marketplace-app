const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/auth - Info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Authentication API',
    endpoints: {
      login: {
        method: 'POST',
        path: '/api/auth/login',
        body: {
          email: 'string (required)',
          password: 'string (required)'
        },
        response: {
          message: 'Login successful',
          user: 'User object',
          token: 'JWT token'
        }
      },
      register: {
        method: 'POST',
        path: '/api/auth/register',
        body: {
          email: 'string (required)',
          username: 'string (required)',
          password: 'string (required)',
          firstName: 'string (required)',
          lastName: 'string (required)',
          userType: 'CLIENT | SELLER | ADMIN (optional, defaults to CLIENT)'
        },
        response: {
          message: 'User created successfully',
          user: 'User object',
          token: 'JWT token'
        }
      },
      me: {
        method: 'GET',
        path: '/api/auth/me',
        headers: {
          Authorization: 'Bearer <token>'
        },
        response: {
          user: 'Current user object'
        }
      }
    },
    note: 'Use POST method for login and register endpoints. Cannot be tested directly in browser (GET requests only). Use curl, Postman, or your mobile app.'
  });
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, userType } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Validate userType
    const validUserTypes = ['CLIENT', 'SELLER', 'ADMIN'];
    const finalUserType = validUserTypes.includes(userType) ? userType : 'CLIENT';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        userType: finalUserType // Use provided userType or default to CLIENT
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        userType: true,
        avatar: true,
        bio: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response and include userType
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        userType: true,
        avatar: true,
        bio: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

module.exports = router;

