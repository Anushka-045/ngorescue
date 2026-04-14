const express = require('express');
const { getDB } = require('../config/database');
const { notifyTaskUpdate } = require('../services/notification.service');
const { logImpact } = require('../services/impact.service');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/tasks
 * List all tasks with optional filters.
 */
router.get('/', (req, res) => {
  const { status, priority, volunteer_id } = req.query;
  const db = getDB();

  let tasks = db.get('tasks').value();

  if (status)       tasks = tasks.filter(t => t.status === status);
  if (priority)     tasks = tasks.filter(t => t.priority_level === priority);
  if (volunteer_id) tasks = tasks.filter(t => t.volunteer_id === volunteer_id);

  tasks = tasks.sort((a, b) => b.urgency_score - a.urgency_score);

  res.json({ total: tasks.length, tasks });
});

/**
 * GET /api/tasks/:id
 * Get task details.
 */
router.get('/:id', (req, res) => {
  const db = getDB();
  const task = db.get('tasks').find({ id: req.params.id }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const report = task.report_id
    ? db.get('reports').find({ id: task.report_id }).value()
    : null;

  res.json({ task, report });
});

/**
 * PUT /api/tasks/:id/accept
 * Volunteer accepts the task.
 */
router.put('/:id/accept', (req, res) => {
  try {
    const io = req.app.get('io');
    const db = getDB();
    const task = db.get('tasks').find({ id: req.params.id }).value();

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'assigned') {
      return res.status(400).json({ error: `Cannot accept task with status: ${task.status}` });
    }

    db.get('tasks')
      .find({ id: req.params.id })
      .assign({ status: 'in_progress', accepted_at: new Date().toISOString() })
      .write();

    // Update report status
    if (task.report_id) {
      db.get('reports')
        .find({ id: task.report_id })
        .assign({ status: 'in_progress' })
        .write();
    }

    const updated = db.get('tasks').find({ id: req.params.id }).value();
    notifyTaskUpdate(io, updated, 'in_progress');
    logger.info(`Task accepted: ${task.id} by ${task.assigned_to}`);

    res.json({ message: 'Task accepted', task: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/tasks/:id/complete
 * Mark task as completed with impact data.
 */
router.put('/:id/complete', (req, res) => {
  try {
    const io = req.app.get('io');
    const { families_helped, individuals_helped, meals_delivered, notes } = req.body;

    const db = getDB();
    const task = db.get('tasks').find({ id: req.params.id }).value();

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!['assigned', 'in_progress'].includes(task.status)) {
      return res.status(400).json({ error: `Task already ${task.status}` });
    }

    const completionData = {
      status:              'completed',
      families_helped:     families_helped  || task.families_helped || 0,
      individuals_helped:  individuals_helped || task.individuals_helped || 0,
      meals_delivered:     meals_delivered  || 0,
      completion_notes:    notes || '',
      completed_at:        new Date().toISOString()
    };

    db.get('tasks')
      .find({ id: req.params.id })
      .assign(completionData)
      .write();

    // Update volunteer stats
    db.get('volunteers')
      .find({ id: task.volunteer_id })
      .assign({
        status:          'available',
        active_tasks:    0,
        tasks_completed: (db.get('volunteers').find({ id: task.volunteer_id }).value()?.tasks_completed || 0) + 1
      })
      .write();

    // Update report status
    if (task.report_id) {
      db.get('reports')
        .find({ id: task.report_id })
        .assign({ status: 'resolved' })
        .write();
    }

    // Log impact
    logImpact({
      type:               'task_completed',
      task_id:            task.id,
      report_id:          task.report_id,
      volunteer_id:       task.volunteer_id,
      issue_type:         task.issue_type,
      families_helped:    completionData.families_helped,
      individuals_helped: completionData.individuals_helped,
      meals_delivered:    completionData.meals_delivered
    });

    const updated = db.get('tasks').find({ id: req.params.id }).value();
    notifyTaskUpdate(io, updated, 'completed');
    logger.info(`Task completed: ${task.id} | Families helped: ${completionData.families_helped}`);

    res.json({
      message: 'Task completed successfully',
      task:    updated,
      impact: {
        families_helped:    completionData.families_helped,
        individuals_helped: completionData.individuals_helped,
        meals_delivered:    completionData.meals_delivered
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/tasks/:id/decline
 * Volunteer declines; trigger re-matching.
 */
router.put('/:id/decline', async (req, res) => {
  try {
    const db = getDB();
    const task = db.get('tasks').find({ id: req.params.id }).value();
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.get('tasks')
      .find({ id: req.params.id })
      .assign({ status: 'declined', declined_at: new Date().toISOString() })
      .write();

    // Free up volunteer
    db.get('volunteers')
      .find({ id: task.volunteer_id })
      .assign({ status: 'available', active_tasks: 0 })
      .write();

    res.json({ message: 'Task declined. Admin notified for re-assignment.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
