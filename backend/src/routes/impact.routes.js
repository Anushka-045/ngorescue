const express = require('express');
const {
  getImpactSummary,
  getImpactTimeSeries,
  getImpactByIssueType
} = require('../services/impact.service');

const router = express.Router();

/**
 * GET /api/impact/summary
 * Overall impact metrics — THE JUDGES' PAGE.
 */
router.get('/summary', (req, res) => {
  const summary = getImpactSummary();
  res.json({
    title: 'NGO Relief System – Impact Summary',
    metrics: summary,
    highlight_cards: [
      { label: 'Families Helped',      value: summary.total_families_helped,     icon: '🏠' },
      { label: 'Meals Delivered',      value: summary.total_meals_delivered,     icon: '🍱' },
      { label: 'Volunteers Deployed',  value: summary.volunteers_deployed,       icon: '🙋' },
      { label: 'Avg Response (mins)',  value: summary.avg_response_time_minutes, icon: '⚡' },
      { label: 'Critical Cases Resolved', value: summary.critical_cases_resolved, icon: '✅' }
    ]
  });
});

/**
 * GET /api/impact/metrics?days=7
 * Time-series data for charts.
 */
router.get('/metrics', (req, res) => {
  const days   = parseInt(req.query.days) || 7;
  const series = getImpactTimeSeries(days);
  const byType = getImpactByIssueType();

  res.json({
    time_series:      series,
    by_issue_type:    byType,
    period_days:      days
  });
});

module.exports = router;
