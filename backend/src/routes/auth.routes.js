const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (admin or volunteer account).
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'volunteer', phone, location, skills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const db = getDB();
    const exists = db.get('users').find({ email }).value();
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id:         uuidv4(),
      name,
      email,
      password:   hashedPassword,
      role,       // 'admin' | 'volunteer' | 'ngo'
      phone:      phone || null,
      location:   location || null,
      skills:     skills || [],
      created_at: new Date().toISOString()
    };

    db.get('users').push(user).write();

    // If volunteer role, also create volunteer profile
    if (role === 'volunteer') {
      const volunteerProfile = {
        id:           uuidv4(),
        user_id:      user.id,
        name,
        email,
        phone:        phone || null,
        location:     location || null,
        skills:       skills || [],
        status:       'available',
        active_tasks: 0,
        tasks_completed: 0,
        joined_at:    new Date().toISOString()
      };
      db.get('volunteers').push(volunteerProfile).write();
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...safeUser } = user;
    res.status(201).json({ message: 'Registered successfully', token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const db = getDB();
    const user = db.get('users').find({ email }).value();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...safeUser } = user;
    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
