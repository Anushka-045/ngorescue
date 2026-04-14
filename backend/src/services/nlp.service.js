/**
 * OCR + NLP Service
 * Simulates OCR extraction and NLP processing of raw NGO field reports.
 * In production, replace parseOCR() with Tesseract.js / Google Vision API,
 * and enhanceWithNLP() with a real NLP pipeline or Claude API call.
 */

const ISSUE_KEYWORDS = {
  'Food Shortage':    ['food', 'hunger', 'malnourish', 'starv', 'meal', 'ration', 'supply'],
  'Medical Aid':      ['medical', 'health', 'sick', 'disease', 'injur', 'hospital', 'medicine', 'doctor'],
  'Flood Relief':     ['flood', 'water', 'inundated', 'submerged', 'drain', 'rain', 'deluge'],
  'Shelter':          ['shelter', 'homeless', 'house', 'roof', 'displacement', 'camp'],
  'Child Welfare':    ['child', 'minor', 'school', 'orphan', 'student', 'kid'],
  'Disaster Relief':  ['earthquake', 'cyclone', 'fire', 'disaster', 'calamity', 'accident'],
  'Water Shortage':   ['water', 'drinking', 'sanitation', 'toilet', 'hygiene']
};

const SEVERITY_WORDS = {
  High:     ['urgent', 'critical', 'severe', 'emergency', 'immediate', 'serious', 'high'],
  Medium:   ['moderate', 'medium', 'concerning', 'significant'],
  Low:      ['minor', 'low', 'small', 'manageable']
};

/**
 * Simulates OCR parsing of uploaded text/image file content.
 * Returns raw extracted text.
 */
function parseOCR(rawText) {
  // In production: await Tesseract.recognize(imageBuffer, 'eng')
  // Here we just clean and normalize the raw text input
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
}

/**
 * Extracts location from text using pattern matching.
 */
function extractLocation(text) {
  const patterns = [
    /(?:location|village|area|place|address)[:\s]+([^\n,\.]+(?:,\s*[^\n,\.]+)?)/i,
    /(?:near|at|in)\s+([A-Z][a-zA-Z\s]+(?:Village|Town|City|Nagar|Pur|Gram)?)/,
    /^([A-Z][a-zA-Z\s]+),?\s+(?:Village|Town|District)/m
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  // Fallback: find capitalized place-like words
  const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
  return words[0] || 'Unknown Location';
}

/**
 * Extracts issue type using keyword matching.
 */
function extractIssueType(text) {
  const lower = text.toLowerCase();
  let bestMatch = 'General';
  let bestScore = 0;

  for (const [issueType, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = issueType;
    }
  }

  return bestMatch;
}

/**
 * Extracts number of people affected.
 */
function extractPeopleAffected(text) {
  const patterns = [
    /(\d+)\s*(?:families|family)/i,
    /affecting\s+(\d+)/i,
    /(\d+)\s*(?:people|persons|individuals|villagers|residents)/i,
    /population\s+of\s+(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      // If families, multiply by avg family size of 4
      if (match[0].toLowerCase().includes('famil')) {
        return { families: num, individuals: num * 4 };
      }
      return { families: Math.ceil(num / 4), individuals: num };
    }
  }

  return { families: 0, individuals: 0 };
}

/**
 * Extracts severity level.
 */
function extractSeverity(text) {
  const lower = text.toLowerCase();

  // Check for explicit urgency field
  const urgencyMatch = text.match(/urgency[:\s]+(\w+)/i);
  if (urgencyMatch) {
    const val = urgencyMatch[1].toLowerCase();
    if (['high', 'critical', 'severe'].includes(val)) return 'High';
    if (['medium', 'moderate'].includes(val)) return 'Medium';
    if (['low', 'minor'].includes(val)) return 'Low';
  }

  for (const [severity, words] of Object.entries(SEVERITY_WORDS)) {
    if (words.some(w => lower.includes(w))) return severity;
  }

  return 'Medium';
}

/**
 * Extracts days without supply/service.
 */
function extractDaysWithout(text) {
  const patterns = [
    /(?:no|without)[^\d]*(\d+)\s*days?/i,
    /(\d+)\s*days?\s*(?:without|no)/i,
    /last\s+(\d+)\s*days?/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }

  return 0;
}

/**
 * Extracts relevant crisis keywords.
 */
function extractKeywords(text) {
  const lower = text.toLowerCase();
  const allKeywords = Object.values(ISSUE_KEYWORDS).flat();
  const extraKeywords = ['children', 'elderly', 'pregnant', 'disabled', 'dead', 'death', 'critical', 'emergency'];

  return [...new Set([...allKeywords, ...extraKeywords])]
    .filter(kw => lower.includes(kw))
    .slice(0, 8);
}

/**
 * Detects presence of vulnerable groups.
 */
function detectVulnerableGroups(text) {
  const lower = text.toLowerCase();
  const groups = [];
  if (lower.match(/child|children|minor|kid|student/)) groups.push('children');
  if (lower.match(/elder|old|aged|senior/)) groups.push('elderly');
  if (lower.match(/pregnant|maternal|mother/)) groups.push('pregnant_women');
  if (lower.match(/disabled|handicap|special need/)) groups.push('differently_abled');
  return groups;
}

/**
 * Main NLP processing function.
 * Takes raw OCR text and returns structured report data.
 */
function processReport(rawText) {
  const cleaned = parseOCR(rawText);

  const location       = extractLocation(cleaned);
  const issueType      = extractIssueType(cleaned);
  const affected       = extractPeopleAffected(cleaned);
  const severity       = extractSeverity(cleaned);
  const daysWithout    = extractDaysWithout(cleaned);
  const keywords       = extractKeywords(cleaned);
  const vulnerables    = detectVulnerableGroups(cleaned);

  return {
    location,
    issue_type:        issueType,
    people_affected:   affected.families,
    individuals_affected: affected.individuals,
    severity,
    days_without_supply: daysWithout,
    keywords,
    vulnerable_groups: vulnerables,
    raw_text:          cleaned,
    timestamp:         new Date().toISOString(),
    ocr_confidence:    0.94  // Would come from real OCR engine
  };
}

module.exports = { processReport, parseOCR };
