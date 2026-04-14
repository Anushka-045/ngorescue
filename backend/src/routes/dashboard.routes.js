const express = require('express');
const { getDB } = require('../config/database');
const moment = require('moment');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Admin dashboard stats panel.
 */
router.get('/stats', (req, res) => {
  const db = getDB();

  const reports   = db.get('reports').value();
  const tasks     = db.get('tasks').value();
  const volunteers = db.get('volunteers').value();

  const today = moment().startOf('day');

  const stats = {
    // Totals
    total_requests:         reports.length,
    critical_cases:         reports.filter(r => r.priority_level === 'Critical').length,
    high_cases:             reports.filter(r => r.priority_level === 'High').length,
    pending_cases:          reports.filter(r => r.status === 'pending').length,
    resolved_cases:         reports.filter(r => r.status === 'resolved').length,

    // Volunteers
    volunteers_total:       volunteers.length,
    volunteers_active:      volunteers.filter(v => v.status !== 'inactive').length,
    volunteers_on_duty:     volunteers.filter(v => v.status === 'on_duty').length,
    volunteers_available:   volunteers.filter(v => v.status === 'available').length,

    // Tasks
    tasks_total:            tasks.length,
    tasks_completed_today:  tasks.filter(t =>
      t.completed_at && moment(t.completed_at).isAfter(today)
    ).length,
    tasks_in_progress:      tasks.filter(t => t.status === 'in_progress').length,
    tasks_assigned:         tasks.filter(t => t.status === 'assigned').length,

    // Recent reports
    recent_reports: reports
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(r => ({
        id:             r.id,
        location:       r.location,
        issue_type:     r.issue_type,
        priority_level: r.priority_level,
        urgency_score:  r.urgency_score,
        status:         r.status,
        created_at:     r.created_at
      })),

    computed_at: new Date().toISOString()
  };

  res.json(stats);
});

/**
 * GET /api/dashboard/map
 * Map data: all active locations with priority markers.
 */
router.get('/map', (req, res) => {
  const db = getDB();

  const activeReports = db.get('reports')
    .filter(r => r.status !== 'resolved')
    .value();

  const mapData = activeReports.map(r => ({
    report_id:      r.id,
    location:       r.location,
    issue_type:     r.issue_type,
    priority_level: r.priority_level,
    urgency_score:  r.urgency_score,
    people_affected: r.people_affected,
    status:         r.status,
    map_query:      encodeURIComponent(r.location),
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.location)}`
  }));

  // Group by priority for layered map rendering
  const grouped = {
    Critical: mapData.filter(m => m.priority_level === 'Critical'),
    High:     mapData.filter(m => m.priority_level === 'High'),
    Medium:   mapData.filter(m => m.priority_level === 'Medium'),
    Low:      mapData.filter(m => m.priority_level === 'Low')
  };

  res.json({ total: mapData.length, locations: mapData, grouped_by_priority: grouped });
});

/**
 * GET /api/dashboard/needs
 * Needs list table data for admin view.
 */
router.get('/needs', (req, res) => {
  const db = getDB();

  const needsList = db.get('reports')
    .filter(r => r.status !== 'resolved')
    .value()
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .map(r => {
      const task = r.task_id
        ? db.get('tasks').find({ id: r.task_id }).value()
        : null;

      return {
        location:        r.location,
        issue_type:      r.issue_type,
        priority_level:  r.priority_level,
        urgency_score:   r.urgency_score,
        people_affected: r.people_affected,
        status:          r.status,
        assigned_to:     task?.assigned_to || '—',
        eta:             task?.eta || '—',
        reported_at:     r.created_at
      };
    });

  res.json({ total: needsList.length, needs: needsList });
});

module.exports = router;
