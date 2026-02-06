const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://localhost:5432/ascending_fitness',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Initialize database tables
async function initDb() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'client',
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        age VARCHAR(10),
        height VARCHAR(20),
        weight VARCHAR(20),
        gender VARCHAR(50),
        emergencyName VARCHAR(255),
        emergencyPhone VARCHAR(20),
        emergencyRelationship VARCHAR(100),
        medicalConditions TEXT,
        medications TEXT,
        injuriesSurgeries TEXT,
        allergies TEXT,
        fitnessLevel VARCHAR(100),
        workedOutBefore TEXT,
        exerciseTypes TEXT,
        equipmentAccess TEXT,
        primaryGoal TEXT,
        secondaryGoals TEXT,
        targetTimeline VARCHAR(100),
        sessionsPerWeek VARCHAR(50),
        favoriteExercises TEXT,
        exercisesToAvoid TEXT,
        preferredSchedule TEXT,
        dietaryRestrictions TEXT,
        activityLevel VARCHAR(100),
        sleepAverage VARCHAR(20),
        daysPerWeek VARCHAR(50),
        sessionsPerMonth VARCHAR(50)
      )
    `);
    
    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)');
    
    console.log('Users table ready');
    console.log('Profiles table ready');
    console.log('Indexes created');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize the database
initDb();

// JWT token verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Register a new client
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, role = 'client' } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at',
      [name, email, hashedPassword, role, phone]
    );

    // Create empty profile for the user
    await pool.query(
      'INSERT INTO profiles (user_id) VALUES ($1)',
      [newUser.rows[0].id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: newUser.rows[0].role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token: token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role,
        createdAt: newUser.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, role, phone, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const profile = profileResult.rows[0] || {};
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      profile: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { user: userData, profile: profileData } = req.body;

  try {
    // Update user data if provided
    if (userData) {
      const { name, email, phone } = userData;
      
      // Check if email is being changed and if it's already taken by another user
      if (email && email !== req.user.email) {
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Email already in use by another account' });
        }
      }
      
      await pool.query(
        'UPDATE users SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [name, email, phone, userId]
      );
    }

    // Update profile data if provided
    if (profileData) {
      // Build dynamic query based on provided fields
      const fields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(profileData)) {
        if (typeof value !== 'undefined' && value !== null) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (fields.length > 0) {
        values.push(userId); // For WHERE clause
        const query = `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${paramCount}`;
        await pool.query(query, values);
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Ascending Fitness v3.0.0 server is running on port ${PORT}`);
  console.log('Database: PostgreSQL');
  console.log('Ready for persistent user authentication');
});

module.exports = app;