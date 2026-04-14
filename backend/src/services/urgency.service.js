/**
 * Urgency Scoring Engine
 * Computes a 0–100 urgency score and assigns priority level.
 *
 * Scoring Factors:
 *  - Severity level from NLP           (0–30 pts)
 *  - Children/vulnerable groups        (0–20 pts)
 *  - Days without supply               (0–25 pts)
 *  - Number of people affected         (0–15 pts)
 *  - High-risk keywords                (0–10 pts)
 */

const PRIORITY_LEVELS = [
  { min: 85, label: 'Critical',  color: '#FF0000', action: 'Immediate Action Required' },
  { min: 65, label: 'High',      color: '#FF8C00', action: 'Action Required Within 2 Hours' },
  { min: 40, label: 'Medium',    color: '#FFD700', action: 'Action Required Today' },
  { min: 0,  label: 'Low',       color: '#28A745', action: 'Schedule for Next Available Slot' }
];

const HIGH_RISK_KEYWORDS = [
  'death', 'dead', 'dying', 'critical', 'emergency', 'severe',
  'malnourish', 'starving', 'cholera', 'epidemic', 'outbreak', 'collapse'
];

/**
 * Score contribution from severity field.
 */
function scoreSeverity(severity) {
  switch (severity?.toLowerCase()) {
    case 'high':   return 30;
    case 'medium': return 15;
    case 'low':    return 5;
    default:       return 10;
  }
}

/**
 * Score contribution from vulnerable groups present.
 */
function scoreVulnerableGroups(groups = []) {
  let score = 0;
  if (groups.includes('children'))          score += 12;
  if (groups.includes('pregnant_women'))    score += 8;
  if (groups.includes('elderly'))           score += 6;
  if (groups.includes('differently_abled')) score += 6;
  return Math.min(score, 20);
}

/**
 * Score contribution from days without supply.
 */
function scoreDaysWithout(days) {
  if (days === 0)  return 0;
  if (days === 1)  return 8;
  if (days === 2)  return 15;
  if (days === 3)  return 20;
  return Math.min(25, 20 + (days - 3) * 2);
}

/**
 * Score contribution from number of people affected.
 */
function scorePeopleAffected(count) {
  if (count >= 200) return 15;
  if (count >= 100) return 12;
  if (count >= 50)  return 10;
  if (count >= 20)  return 7;
  if (count >= 5)   return 4;
  return 2;
}

/**
 * Score contribution from high-risk keywords found.
 */
function scoreKeywords(keywords = [], rawText = '') {
  const lower = rawText.toLowerCase();
  const found = HIGH_RISK_KEYWORDS.filter(kw =>
    keywords.includes(kw) || lower.includes(kw)
  );
  return Math.min(10, found.length * 3);
}

/**
 * Build human-readable reasons list.
 */
function buildReasons(data, scores) {
  const reasons = [];

  if (scores.severity >= 25)
    reasons.push(`Severity classified as ${data.severity}`);

  if (data.vulnerable_groups?.includes('children'))
    reasons.push('Children are among the affected population');

  if (data.days_without_supply >= 2)
    reasons.push(`No supply for ${data.days_without_supply} days`);

  if (data.people_affected >= 50)
    reasons.push(`High number of people affected (${data.people_affected} families)`);

  if (scores.keywords > 0)
    reasons.push('High-risk keywords detected in report');

  if (data.issue_type === 'Medical Aid')
    reasons.push('Medical emergency requires immediate professional response');

  if (reasons.length === 0)
    reasons.push('Moderate crisis situation requiring monitoring');

  return reasons;
}

/**
 * Main urgency scoring function.
 * @param {Object} reportData - Structured data from NLP service
 * @returns {Object} Urgency score result
 */
function computeUrgencyScore(reportData) {
  const scores = {
    severity:  scoreSeverity(reportData.severity),
    vulnerable: scoreVulnerableGroups(reportData.vulnerable_groups),
    days:      scoreDaysWithout(reportData.days_without_supply || 0),
    people:    scorePeopleAffected(reportData.people_affected || 0),
    keywords:  scoreKeywords(reportData.keywords, reportData.raw_text || '')
  };

  const total = Math.min(100,
    scores.severity + scores.vulnerable + scores.days + scores.people + scores.keywords
  );

  const priority = PRIORITY_LEVELS.find(p => total >= p.min);
  const reasons  = buildReasons(reportData, scores);

  return {
    urgency_score:    Math.round(total),
    priority_level:   priority.label,
    priority_color:   priority.color,
    action_required:  priority.action,
    score_breakdown: {
      severity_score:         scores.severity,
      vulnerable_group_score: scores.vulnerable,
      days_without_score:     scores.days,
      people_affected_score:  scores.people,
      keyword_score:          scores.keywords
    },
    reason:           reasons,
    computed_at:      new Date().toISOString()
  };
}

module.exports = { computeUrgencyScore };
