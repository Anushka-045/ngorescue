const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

const { getDB }              = require('../config/database');
const { authenticate }       = require('../middleware/auth.middleware');
const { processReport }      = require('../services/nlp.service');
const { computeUrgencyScore } = require('../services/urgency.service');
const { matchVolunteers }    = require('../services/matching.service');
const { notifyVolunteer, notifyAdmins } = require('../services/notification.service');
const { logImpact }          = require('../services/impact.service');
const logger                 = require('../utils/logger');

const router = express.Router();

// ─── Multer Config ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `report_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.pdf', '.jpg', '.jpeg', '.png', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not supported`));
  }
});

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/reports/upload
 * THE MAIN PIPELINE:
 * 1. Receive file or raw text
 * 2. OCR + NLP → Structured data
 * 3. Urgency Scoring
 * 4. Volunteer Matching
 * 5. Task Creation
 * 6. Notifications
 * Returns: complete pipeline result
 */
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    const io = req.app.get('io');

    // ── Step 1: Get raw text ──────────────────────────────────────────────────
    let rawText = req.body.raw_text || '';

    if (req.file) {
      // For .txt files, read content. For images/PDFs, you'd call OCR here.
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.txt') {
        rawText = fs.readFileSync(req.file.path, 'utf8');
      } else {
        // In production: run Tesseract OCR on the image/PDF
        // rawText = await tesseract.recognize(req.file.path, 'eng');
        rawText = rawText || `Report uploaded: ${req.file.originalname}`;
      }
      logger.info(`File uploaded: ${req.file.filename}`);
    }

    if (!rawText.trim()) {
      return res.status(400).json({ error: 'No report content provided. Send raw_text or upload a file.' });
    }

    // ── Step 2: NLP Processing ────────────────────────────────────────────────
    logger.info('Running NLP processing...');
    const nlpResult = processReport(rawText);

    // ── Step 3: Urgency Scoring ───────────────────────────────────────────────
    logger.info('Computing urgency score...');
    const urgencyResult = computeUrgencyScore(nlpResult);

    // ── Step 4: Save Report to DB ─────────────────────────────────────────────
    const db = getDB();
    const report = {
      id:                   uuidv4(),
      submitted_by:         req.user?.id || 'anonymous',
      file_name:            req.file?.filename || null,
      file_path:            req.file?.path || null,
      ...nlpResult,
      urgency_score:        urgencyResult.urgency_score,
      priority_level:       urgencyResult.priority_level,
      action_required:      urgencyResult.action_required,
      urgency_breakdown:    urgencyResult.score_breakdown,
      urgency_reasons:      urgencyResult.reason,
      status:               'pending',
      created_at:           new Date().toISOString()
    };

    db.get('reports').push(report).write();
    logger.info(`Report saved: ${report.id} | Priority: ${report.priority_level}`);

    // ── Step 5: Volunteer Matching ────────────────────────────────────────────
    logger.info('Matching volunteers...');
    const matchResult = await matchVolunteers(report);

    // ── Step 6: Create Task ───────────────────────────────────────────────────
    let task = null;
    if (matchResult.assigned && matchResult.best_match) {
      task = {
        id:               uuidv4(),
        report_id:        report.id,
        volunteer_id:     matchResult.best_match.volunteer_id,
        assigned_to:      matchResult.assigned.assigned_to,
        description:      matchResult.assigned.task,
        location:         report.location,
        issue_type:       report.issue_type,
        priority_level:   report.priority_level,
        urgency_score:    report.urgency_score,
        eta:              matchResult.assigned.eta,
        families_helped:  report.people_affected || 0,
        individuals_helped: report.individuals_affected || 0,
        meals_delivered:  0,
        status:           'assigned',
        assigned_at:      new Date().toISOString(),
        completed_at:     null
      };

      db.get('tasks').push(task).write();

      // Update volunteer status
      db.get('volunteers')
        .find({ id: matchResult.best_match.volunteer_id })
        .assign({ status: 'on_duty', active_tasks: 1 })
        .write();

      // Update report status
      db.get('reports')
        .find({ id: report.id })
        .assign({ status: 'assigned', task_id: task.id })
        .write();

      // ── Step 7: Notify Volunteer ────────────────────────────────────────────
      notifyVolunteer(io, matchResult.best_match.volunteer_id, task, report);
      logger.info(`Task assigned to volunteer: ${matchResult.assigned.assigned_to}`);
    }

    // ── Step 8: Notify Admins ─────────────────────────────────────────────────
    notifyAdmins(io, report, urgencyResult);

    // ── Log impact start ──────────────────────────────────────────────────────
    logImpact({
      type:       'report_received',
      report_id:  report.id,
      location:   report.location,
      issue_type: report.issue_type,
      priority:   report.priority_level
    });

    // ── Final Response ────────────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: `Report processed. Priority: ${report.priority_level}`,
      pipeline: {
        step1_ocr_nlp: {
          location:          nlpResult.location,
          issue_type:        nlpResult.issue_type,
          people_affected:   nlpResult.people_affected,
          severity:          nlpResult.severity,
          keywords:          nlpResult.keywords,
          vulnerable_groups: nlpResult.vulnerable_groups,
          timestamp:         nlpResult.timestamp
        },
        step2_urgency_score: {
          urgency_score:    urgencyResult.urgency_score,
          priority_level:   urgencyResult.priority_level,
          action_required:  urgencyResult.action_required,
          reason:           urgencyResult.reason,
          score_breakdown:  urgencyResult.score_breakdown
        },
        step3_volunteer_match: matchResult.assigned ? {
          assigned_to:   matchResult.assigned.assigned_to,
          task:          matchResult.assigned.task,
          eta:           matchResult.assigned.eta,
          status:        matchResult.assigned.status,
          match_score:   matchResult.assigned.match_score,
          backup_volunteers: matchResult.backup.map(v => ({
            name: v.name, match_score: v.match_score, availability: v.availability
          }))
        } : { message: 'No volunteers currently available', backup: [] },
        step4_task: task ? {
          task_id:   task.id,
          status:    task.status,
          eta:       task.eta
        } : null
      },
      report_id: report.id,
      task_id:   task?.id || null
    });

  } catch (err) {
    logger.error(`Report upload error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reports
 * List all reports with optional filters.
 */
router.get('/', (req, res) => {
  const { priority, status, issue_type, limit = 50 } = req.query;
  const db = getDB();

  let reports = db.get('reports').value();

  if (priority)   reports = reports.filter(r => r.priority_level === priority);
  if (status)     reports = reports.filter(r => r.status === status);
  if (issue_type) reports = reports.filter(r => r.issue_type === issue_type);

  reports = reports
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, parseInt(limit));

  res.json({
    total:   reports.length,
    reports: reports.map(r => ({
      id:             r.id,
      location:       r.location,
      issue_type:     r.issue_type,
      people_affected: r.people_affected,
      priority_level: r.priority_level,
      urgency_score:  r.urgency_score,
      status:         r.status,
      created_at:     r.created_at
    }))
  });
});

/**
 * GET /api/reports/:id
 * Get full report details.
 */
router.get('/:id', (req, res) => {
  const db = getDB();
  const report = db.get('reports').find({ id: req.params.id }).value();

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Get associated task
  const task = report.task_id
    ? db.get('tasks').find({ id: report.task_id }).value()
    : null;

  res.json({ report, task });
});

module.exports = router;
