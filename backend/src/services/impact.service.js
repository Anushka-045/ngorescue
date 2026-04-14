/**
 * Impact Tracking Service
 * Aggregates and computes real-time impact metrics for dashboard and reports.
 */

const { getDB } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Log an impact event (e.g., task completed, meals delivered).
 */
function logImpact(data) {
  const db = getDB();
  const log = {
    id:         uuidv4(),
    ...data,
    logged_at:  new Date().toISOString()
  };
  db.get('impact_logs').push(log).write();
  return log;
}

/**
 * Compute overall impact summary.
 */
function getImpactSummary() {
  const db = getDB();

  const completedTasks = db.get('tasks')
    .filter({ status: 'completed' })
    .value();

  const allReports = db.get('reports').value();
  const volunteers = db.get('volunteers').value();

  // Families/individuals helped
  const familiesHelped = completedTasks.reduce((sum, t) => sum + (t.families_helped || 0), 0);
  const individualsHelped = completedTasks.reduce((sum, t) => sum + (t.individuals_helped || 0), 0);

  // Meals delivered (Food Shortage tasks)
  const mealsDelivered = completedTasks
    .filter(t => t.issue_type === 'Food Shortage')
    .reduce((sum, t) => sum + (t.meals_delivered || (t.families_helped || 0) * 4), 0);

  // Volunteers deployed
  const volunteersDeployed = new Set(
    completedTasks.map(t => t.volunteer_id).filter(Boolean)
  ).size;

  // Average response time (minutes)
  const tasksWithTime = completedTasks.filter(t => t.assigned_at && t.completed_at);
  const avgResponseTime = tasksWithTime.length > 0
    ? Math.round(
        tasksWithTime.reduce((sum, t) => {
          const diff = moment(t.completed_at).diff(moment(t.assigned_at), 'minutes');
          return sum + diff;
        }, 0) / tasksWithTime.length
      )
    : 0;

  // Critical cases resolved
  const criticalResolved = completedTasks.filter(t => t.priority_level === 'Critical').length;

  // Today's stats
  const today = moment().startOf('day');
  const todayTasks = completedTasks.filter(t =>
    moment(t.completed_at).isAfter(today)
  );

  return {
    total_families_helped:      familiesHelped,
    total_individuals_helped:   individualsHelped,
    total_meals_delivered:      mealsDelivered,
    volunteers_deployed:        volunteersDeployed,
    avg_response_time_minutes:  avgResponseTime,
    critical_cases_resolved:    criticalResolved,
    total_reports_handled:      allReports.length,
    total_tasks_completed:      completedTasks.length,
    today: {
      tasks_completed:     todayTasks.length,
      families_helped:     todayTasks.reduce((s, t) => s + (t.families_helped || 0), 0),
      meals_delivered:     todayTasks.reduce((s, t) => s + (t.meals_delivered || 0), 0)
    },
    active_volunteers:     volunteers.filter(v => v.status !== 'inactive').length,
    computed_at:           new Date().toISOString()
  };
}

/**
 * Get time-series impact data for charts.
 */
function getImpactTimeSeries(days = 7) {
  const db = getDB();
  const tasks = db.get('tasks').filter({ status: 'completed' }).value();

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = moment().subtract(i, 'days');
    const dayStart = date.clone().startOf('day');
    const dayEnd   = date.clone().endOf('day');

    const dayTasks = tasks.filter(t =>
      t.completed_at &&
      moment(t.completed_at).isBetween(dayStart, dayEnd)
    );

    series.push({
      date:            date.format('YYYY-MM-DD'),
      label:           date.format('MMM D'),
      tasks_completed: dayTasks.length,
      families_helped: dayTasks.reduce((s, t) => s + (t.families_helped || 0), 0),
      meals_delivered: dayTasks.reduce((s, t) => s + (t.meals_delivered || 0), 0)
    });
  }

  return series;
}

/**
 * Get impact breakdown by issue type.
 */
function getImpactByIssueType() {
  const db = getDB();
  const tasks = db.get('tasks').filter({ status: 'completed' }).value();

  const breakdown = {};
  tasks.forEach(t => {
    const type = t.issue_type || 'General';
    if (!breakdown[type]) {
      breakdown[type] = { count: 0, families_helped: 0, individuals_helped: 0 };
    }
    breakdown[type].count++;
    breakdown[type].families_helped     += (t.families_helped || 0);
    breakdown[type].individuals_helped  += (t.individuals_helped || 0);
  });

  return Object.entries(breakdown).map(([issue_type, stats]) => ({
    issue_type,
    ...stats
  }));
}

module.exports = {
  logImpact,
  getImpactSummary,
  getImpactTimeSeries,
  getImpactByIssueType
};
