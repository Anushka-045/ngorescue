/**
 * Seed Script
 * Populates the database with demo data for presentations and testing.
 * Run: node src/utils/seed.js
 */

require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

process.env.DB_PATH = './data/db.json';
const db = require('../config/database');
db.initialize();
const { getDB } = db;

async function seed() {
  console.log('🌱 Seeding database with demo data...\n');
  const database = getDB();

  // Clear existing data
  database.set('users', []).write();
  database.set('volunteers', []).write();
  database.set('reports', []).write();
  database.set('tasks', []).write();
  database.set('impact_logs', []).write();
  database.set('notifications', []).write();

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const volPassword   = await bcrypt.hash('vol123', 10);

  const users = [
    { id: uuidv4(), name: 'Admin User', email: 'admin@ngo.org', password: adminPassword, role: 'admin', created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Rohit Sharma', email: 'rohit@volunteer.org', password: volPassword, role: 'volunteer', created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Anjali Verma', email: 'anjali@volunteer.org', password: volPassword, role: 'volunteer', created_at: new Date().toISOString() }
  ];
  users.forEach(u => database.get('users').push(u).write());
  console.log(`✅ Created ${users.length} users`);
  console.log('   Admin: admin@ngo.org / admin123');
  console.log('   Volunteer: rohit@volunteer.org / vol123\n');

  // ── Volunteers ─────────────────────────────────────────────────────────────
  const v1id = uuidv4();
  const v2id = uuidv4();
  const v3id = uuidv4();
  const v4id = uuidv4();

  const volunteers = [
    {
      id: v1id, name: 'Rohit Sharma', email: 'rohit@volunteer.org',
      phone: '+91-9876543210', location: 'Rampur',
      skills: ['Food Distribution', 'Logistics'],
      availability: 'Immediate', status: 'available',
      active_tasks: 0, tasks_completed: 8,
      joined_at: new Date().toISOString()
    },
    {
      id: v2id, name: 'Anjali Verma', email: 'anjali@volunteer.org',
      phone: '+91-9876543211', location: 'Nearby Village',
      skills: ['Medical Aid', 'First Aid', 'Nursing'],
      availability: '2 hours', status: 'available',
      active_tasks: 0, tasks_completed: 12,
      joined_at: new Date().toISOString()
    },
    {
      id: v3id, name: 'Suresh Kumar', email: 'suresh@volunteer.org',
      phone: '+91-9876543212', location: 'Lakshmi Nagar',
      skills: ['Rescue', 'Logistics', 'Food Distribution'],
      availability: 'Immediate', status: 'available',
      active_tasks: 0, tasks_completed: 5,
      joined_at: new Date().toISOString()
    },
    {
      id: v4id, name: 'Priya Singh', email: 'priya@volunteer.org',
      phone: '+91-9876543213', location: 'Rampur',
      skills: ['Child Care', 'Counseling', 'Education'],
      availability: 'Immediate', status: 'on_duty',
      active_tasks: 1, tasks_completed: 3,
      joined_at: new Date().toISOString()
    },
    {
      id: uuidv4(), name: 'Amit Patel', email: 'amit@volunteer.org',
      phone: '+91-9876543214', location: 'District HQ',
      skills: ['Construction', 'Logistics', 'Administration'],
      availability: '4 hours', status: 'available',
      active_tasks: 0, tasks_completed: 6,
      joined_at: new Date().toISOString()
    }
  ];
  volunteers.forEach(v => database.get('volunteers').push(v).write());
  console.log(`✅ Created ${volunteers.length} volunteers\n`);

  // ── Reports + Tasks ────────────────────────────────────────────────────────
  const r1id = uuidv4();
  const r2id = uuidv4();
  const r3id = uuidv4();
  const t1id = uuidv4();
  const t2id = uuidv4();

  const now = new Date();
  const twoHoursAgo = new Date(now - 2 * 3600 * 1000).toISOString();
  const oneDayAgo   = new Date(now - 24 * 3600 * 1000).toISOString();

  const reports = [
    {
      id: r1id, location: 'Rampur, Near Govt School',
      issue_type: 'Food Shortage', people_affected: 50, individuals_affected: 200,
      severity: 'High', days_without_supply: 3,
      keywords: ['food shortage', 'malnourished', 'children'],
      vulnerable_groups: ['children'],
      urgency_score: 92, priority_level: 'Critical',
      action_required: 'Immediate Action Required',
      urgency_reasons: ['High number of people affected', 'Children involved', 'No food for 3 days'],
      status: 'resolved', task_id: t1id,
      raw_text: 'Village: Rampur. Issue: Severe food shortage affecting 50 families. Children are malnourished. No food supply for last 3 days.',
      submitted_by: 'demo',
      created_at: twoHoursAgo
    },
    {
      id: r2id, location: 'Lakshmi Nagar',
      issue_type: 'Medical Aid', people_affected: 20, individuals_affected: 80,
      severity: 'High', days_without_supply: 1,
      keywords: ['medical', 'sick', 'elderly'],
      vulnerable_groups: ['elderly'],
      urgency_score: 74, priority_level: 'High',
      action_required: 'Action Required Within 2 Hours',
      urgency_reasons: ['Medical emergency', 'Elderly affected'],
      status: 'assigned', task_id: t2id,
      raw_text: 'Location: Lakshmi Nagar. Medical emergency - 20 families, elderly residents sick. Need doctor immediately.',
      submitted_by: 'demo',
      created_at: oneDayAgo
    },
    {
      id: r3id, location: 'Shyam Nagar',
      issue_type: 'Flood Relief', people_affected: 15, individuals_affected: 60,
      severity: 'Medium', days_without_supply: 0,
      keywords: ['flood', 'water', 'shelter'],
      vulnerable_groups: [],
      urgency_score: 55, priority_level: 'Medium',
      action_required: 'Action Required Today',
      urgency_reasons: ['Flood damage to homes'],
      status: 'pending', task_id: null,
      raw_text: 'Location: Shyam Nagar. Flood water entered homes, 15 families displaced.',
      submitted_by: 'demo',
      created_at: new Date().toISOString()
    }
  ];
  reports.forEach(r => database.get('reports').push(r).write());
  console.log(`✅ Created ${reports.length} reports\n`);

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const completedTime = new Date(now - 1.5 * 3600 * 1000).toISOString();

  const tasks = [
    {
      id: t1id, report_id: r1id, volunteer_id: v1id,
      assigned_to: 'Rohit Sharma',
      description: 'Deliver food supplies to 50 families',
      location: 'Rampur, Near Govt School',
      issue_type: 'Food Shortage', priority_level: 'Critical', urgency_score: 92,
      eta: '15 minutes', families_helped: 50, individuals_helped: 200,
      meals_delivered: 200, completion_notes: 'All families received ration kits',
      status: 'completed', assigned_at: twoHoursAgo, completed_at: completedTime
    },
    {
      id: t2id, report_id: r2id, volunteer_id: v2id,
      assigned_to: 'Anjali Verma',
      description: 'Provide medical assistance to elderly residents',
      location: 'Lakshmi Nagar',
      issue_type: 'Medical Aid', priority_level: 'High', urgency_score: 74,
      eta: '2 hours', families_helped: 0, individuals_helped: 0,
      meals_delivered: 0, completion_notes: '',
      status: 'assigned', assigned_at: oneDayAgo, completed_at: null
    }
  ];
  tasks.forEach(t => database.get('tasks').push(t).write());
  console.log(`✅ Created ${tasks.length} tasks\n`);

  // ── Impact Logs ────────────────────────────────────────────────────────────
  database.get('impact_logs').push({
    id: uuidv4(), type: 'task_completed', task_id: t1id, report_id: r1id,
    volunteer_id: v1id, issue_type: 'Food Shortage',
    families_helped: 50, individuals_helped: 200, meals_delivered: 200,
    logged_at: completedTime
  }).write();

  console.log('✅ Seeded impact logs\n');
  console.log('─'.repeat(50));
  console.log('🎉 Seed complete! Start server: npm start');
  console.log('─'.repeat(50));
  console.log('\nDemo credentials:');
  console.log('  Admin:     admin@ngo.org     | admin123');
  console.log('  Volunteer: rohit@volunteer.org | vol123');
  console.log('\nSample report to POST /api/reports/upload:');
  console.log('  raw_text: "Village: Rampur. Issue: Severe food shortage affecting 50 families. Children malnourished. No food for 3 days. Urgency: High"');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
