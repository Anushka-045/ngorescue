/**
 * Notification Service
 * Handles real-time WebSocket notifications and stores notification history.
 * In production, integrate with FCM (Firebase Cloud Messaging) for mobile push.
 */

const { getDB } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Send a WebSocket notification to a specific room or broadcast.
 */
function sendSocketNotification(io, room, event, payload) {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
  logger.info(`WebSocket notification sent → room: ${room || 'all'}, event: ${event}`);
}

/**
 * Persist notification to DB.
 */
function saveNotification(data) {
  const db = getDB();
  const notification = {
    id:         uuidv4(),
    ...data,
    read:       false,
    created_at: new Date().toISOString()
  };
  db.get('notifications').push(notification).write();
  return notification;
}

/**
 * Notify a volunteer about a new task assignment.
 */
function notifyVolunteer(io, volunteerId, task, report) {
  const payload = {
    type:      'NEW_TASK_ASSIGNED',
    title:     '🚨 URGENT TASK ASSIGNED',
    volunteer_id: volunteerId,
    task: {
      id:         task.id,
      location:   report.location,
      issue_type: report.issue_type,
      task_desc:  task.description,
      priority:   task.priority_level,
      eta:        task.eta,
      map_link:   `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.location)}`
    },
    message:   `New ${task.priority_level} priority task at ${report.location}`,
    timestamp: new Date().toISOString()
  };

  sendSocketNotification(io, `volunteer_${volunteerId}`, 'task_assigned', payload);
  sendSocketNotification(io, 'admin', 'task_update', payload);

  saveNotification({
    recipient_id:   volunteerId,
    recipient_type: 'volunteer',
    task_id:        task.id,
    report_id:      report.id,
    type:           'task_assigned',
    message:        payload.message
  });

  return payload;
}

/**
 * Notify admins about a new critical report.
 */
function notifyAdmins(io, report, urgencyResult) {
  const payload = {
    type:         'NEW_CRITICAL_REPORT',
    title:        `⚠️ ${urgencyResult.priority_level} Priority Report`,
    report_id:    report.id,
    location:     report.location,
    issue_type:   report.issue_type,
    urgency_score: urgencyResult.urgency_score,
    priority:     urgencyResult.priority_level,
    message:      `New ${urgencyResult.priority_level} report from ${report.location}: ${report.issue_type}`,
    timestamp:    new Date().toISOString()
  };

  sendSocketNotification(io, 'admin', 'new_report', payload);

  saveNotification({
    recipient_type: 'admin',
    report_id:      report.id,
    type:           'new_report',
    message:        payload.message
  });

  return payload;
}

/**
 * Broadcast task status update.
 */
function notifyTaskUpdate(io, task, status) {
  const payload = {
    type:      'TASK_STATUS_UPDATE',
    task_id:   task.id,
    status,
    location:  task.location,
    timestamp: new Date().toISOString()
  };

  sendSocketNotification(io, 'admin', 'task_update', payload);
  sendSocketNotification(io, `volunteer_${task.volunteer_id}`, 'task_update', payload);

  return payload;
}

/**
 * Get all notifications for a recipient.
 */
function getNotifications(recipientId, recipientType) {
  const db = getDB();
  return db.get('notifications')
    .filter(n =>
      (recipientType === 'admin' && n.recipient_type === 'admin') ||
      (n.recipient_id === recipientId)
    )
    .orderBy(['created_at'], ['desc'])
    .take(50)
    .value();
}

/**
 * Mark notification as read.
 */
function markRead(notificationId) {
  const db = getDB();
  db.get('notifications')
    .find({ id: notificationId })
    .assign({ read: true })
    .write();
}

module.exports = {
  notifyVolunteer,
  notifyAdmins,
  notifyTaskUpdate,
  getNotifications,
  markRead
};
