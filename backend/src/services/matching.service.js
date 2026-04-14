/**
 * Volunteer Matching Service
 * Matches crisis reports to the best available volunteers
 * based on: skills, location proximity, availability, and current workload.
 */

const { getDB } = require('../config/database');
const logger = require('../utils/logger');

// Skill requirements per issue type
const SKILL_MAP = {
  'Food Shortage':   ['Food Distribution', 'Logistics', 'Supply Chain'],
  'Medical Aid':     ['Medical Aid', 'First Aid', 'Nursing', 'Doctor'],
  'Flood Relief':    ['Rescue', 'Logistics', 'Food Distribution'],
  'Shelter':         ['Construction', 'Logistics', 'Administration'],
  'Child Welfare':   ['Child Care', 'Education', 'Counseling'],
  'Disaster Relief': ['Rescue', 'First Aid', 'Logistics'],
  'Water Shortage':  ['Plumbing', 'Logistics', 'Sanitation'],
  'General':         ['Logistics', 'Volunteer']
};

// Simple location proximity score (in production, use haversine with GPS)
function proximityScore(volunteerLocation, reportLocation) {
  if (!volunteerLocation || !reportLocation) return 0;

  const vLoc = volunteerLocation.toLowerCase().trim();
  const rLoc = reportLocation.toLowerCase().trim();

  // Exact match
  if (vLoc === rLoc) return 100;

  // Partial match (same city/district name appears)
  const rWords = rLoc.split(/[\s,]+/).filter(w => w.length > 3);
  const vWords = vLoc.split(/[\s,]+/).filter(w => w.length > 3);
  const commonWords = rWords.filter(w => vWords.includes(w));

  if (commonWords.length > 0) return 70;

  // Nearby (just assign a base score in demo)
  return 30;
}

// Availability score
function availabilityScore(availability) {
  const a = (availability || '').toLowerCase();
  if (a === 'immediate' || a === 'available now') return 100;
  if (a.includes('hour')) {
    const hrs = parseInt(a) || 2;
    return Math.max(10, 100 - (hrs * 20));
  }
  if (a === 'today') return 50;
  return 20;
}

// Skills match score
function skillMatchScore(volunteerSkills = [], requiredSkills = []) {
  if (!volunteerSkills.length || !requiredSkills.length) return 0;
  const vSkills = volunteerSkills.map(s => s.toLowerCase());
  const rSkills = requiredSkills.map(s => s.toLowerCase());
  const matched = vSkills.filter(s => rSkills.some(r => s.includes(r) || r.includes(s)));
  return (matched.length / rSkills.length) * 100;
}

// Workload score (fewer active tasks = better)
function workloadScore(activeTasks = 0) {
  if (activeTasks === 0) return 100;
  if (activeTasks === 1) return 70;
  if (activeTasks === 2) return 40;
  return 10;
}

/**
 * Score a single volunteer for a given report.
 */
function scoreVolunteer(volunteer, report) {
  const requiredSkills = SKILL_MAP[report.issue_type] || SKILL_MAP['General'];

  const proximity  = proximityScore(volunteer.location, report.location);
  const avail      = availabilityScore(volunteer.availability);
  const skills     = skillMatchScore(volunteer.skills, requiredSkills);
  const workload   = workloadScore(volunteer.active_tasks || 0);

  const total = (
    (proximity * 0.30) +
    (avail     * 0.30) +
    (skills    * 0.25) +
    (workload  * 0.15)
  );

  return {
    volunteer_id:  volunteer.id,
    name:          volunteer.name,
    skills:        volunteer.skills,
    location:      volunteer.location,
    availability:  volunteer.availability,
    phone:         volunteer.phone,
    match_score:   Math.round(total),
    score_detail: {
      proximity_score:  Math.round(proximity),
      availability_score: Math.round(avail),
      skill_score:      Math.round(skills),
      workload_score:   Math.round(workload)
    }
  };
}

/**
 * Generate task description from report.
 */
function generateTaskDescription(report, priority) {
  const typeMap = {
    'Food Shortage':   `Deliver food supplies to ${report.people_affected || 'affected'} families`,
    'Medical Aid':     `Provide medical assistance to ${report.individuals_affected || 'affected'} individuals`,
    'Flood Relief':    `Assist flood-affected families with evacuation and supplies`,
    'Shelter':         `Help displaced families find temporary shelter`,
    'Child Welfare':   `Support and care for affected children`,
    'Disaster Relief': `Emergency disaster relief and rescue operations`,
    'Water Shortage':  `Provide clean drinking water to affected community`
  };

  return typeMap[report.issue_type] || `Respond to ${report.issue_type} emergency`;
}

/**
 * Estimate ETA based on proximity and availability.
 */
function estimateETA(volunteerLocation, reportLocation, availability) {
  const proximity = proximityScore(volunteerLocation, reportLocation);
  const a = (availability || '').toLowerCase();

  if (proximity >= 100) {
    if (a === 'immediate') return '10–15 minutes';
    if (a.includes('1 hour') || a.includes('1hour')) return '1 hour';
    return '30 minutes';
  }

  if (proximity >= 70) {
    if (a === 'immediate') return '20–30 minutes';
    return '1–2 hours';
  }

  return '2–4 hours';
}

/**
 * Main matching function.
 * Finds and ranks available volunteers for a report.
 * Returns the top match as assigned, rest as backup.
 */
async function matchVolunteers(report) {
  const db = getDB();

  // Get available volunteers (not on another critical task)
  const availableVolunteers = db.get('volunteers')
    .filter(v => v.status === 'available' || v.status === 'on_duty')
    .value();

  if (availableVolunteers.length === 0) {
    logger.warn('No available volunteers found for matching');
    return { assigned: null, backup: [], all_scored: [] };
  }

  // Score all volunteers
  const scored = availableVolunteers
    .map(v => scoreVolunteer(v, report))
    .sort((a, b) => b.match_score - a.match_score);

  const best   = scored[0];
  const backup = scored.slice(1, 4); // Top 3 backups

  const assignment = best ? {
    assigned_to:   best.name,
    volunteer_id:  best.volunteer_id,
    task:          generateTaskDescription(report),
    location:      report.location,
    eta:           estimateETA(best.location, report.location, best.availability),
    status:        'Assigned',
    match_score:   best.match_score,
    assigned_at:   new Date().toISOString()
  } : null;

  return {
    assigned:    assignment,
    best_match:  best,
    backup:      backup,
    all_scored:  scored,
    total_considered: availableVolunteers.length
  };
}

module.exports = { matchVolunteers, SKILL_MAP };
