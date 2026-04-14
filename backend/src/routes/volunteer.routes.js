const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');
const { SKILL_MAP } = require('../services/matching.service');

const router = express.Router();

/**
 * POST /api/volunteers
 * Register a new volunteer.
 */
router.post('/', (req, res) => {
  try {
    const { name, email, phone, location, skills, availability } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'name and location are required' });
    }

    const db = getDB();
    const volunteer = {
      id:               uuidv4(),
      name,
      email:            email || null,
      phone:            phone || null,
      location,
      skills:           skills || [],
      availability:     availability || 'available',
      status:           'available',
      active_tasks:     0,
      tasks_completed:  0,
      joined_at:        new Date().toISOString()
    };

    db.get('volunteers').push(volunteer).write();
    res.status(201).json({ message: 'Volunteer registered', volunteer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/volunteers
 * List all volunteers with optional status filter.
 */
router.get('/', (req, res) => {
  const { status, skill, location } = req.query;
  const db = getDB();

  let volunteers = db.get('volunteers').value();

  if (status)   volunteers = volunteers.filter(v => v.status === status);
  if (skill)    volunteers = volunteers.filter(v =>
    v.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  );
  if (location) volunteers = volunteers.filter(v =>
    v.location && v.location.toLowerCase().includes(location.toLowerCase())
  );

  res.json({
    total: volunteers.length,
    volunteers: volunteers.map(v => ({
      id:              v.id,
      name:            v.name,
      skills:          v.skills,
      location:        v.location,
      availability:    v.availability,
      status:          v.status,
      active_tasks:    v.active_tasks,
      tasks_completed: v.tasks_completed
    }))
  });
});

/**
 * GET /api/volunteers/:id
 * Get volunteer details.
 */
router.get('/:id', (req, res) => {
  const db = getDB();
  const volunteer = db.get('volunteers').find({ id: req.params.id }).value();
  if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

  // Get their assigned tasks
  const tasks = db.get('tasks')
    .filter({ volunteer_id: req.params.id })
    .value();

  res.json({ volunteer, tasks });
});

/**
 * PUT /api/volunteers/:id/status
 * Update volunteer status.
 */
router.put('/:id/status', (req, res) => {
  try {
    const { status, availability } = req.body;
    const validStatuses = ['available', 'on_duty', 'offline', 'inactive'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const db = getDB();
    const volunteer = db.get('volunteers').find({ id: req.params.id }).value();
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

    db.get('volunteers')
      .find({ id: req.params.id })
      .assign({ status, availability: availability || volunteer.availability, updated_at: new Date().toISOString() })
      .write();

    res.json({ message: 'Status updated', volunteer: db.get('volunteers').find({ id: req.params.id }).value() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/volunteers/skills/list
 * List all available skill categories.
 */
router.get('/skills/list', (req, res) => {
  const allSkills = [...new Set(Object.values(SKILL_MAP).flat())];
  res.json({ skills: allSkills });
});

module.exports = router;
