/**
 * Safar AI - Complaint Assistant Service (Stage 5)
 *
 * Helps passengers prepare a structured transport complaint draft.
 * CRITICAL DATA SAFETY RULES:
 * - Safar AI is ONLY an assistant; it never submits, registers, or files complaints.
 * - NEVER generate tracking IDs, complaint IDs, registration numbers, or case numbers.
 * - Every response MUST include the mandatory draft disclaimer:
 *   "This is a draft complaint summary. It has not been automatically filed with any authority."
 * - Do NOT make legal accusations or claim a fare is illegal without authoritative verification.
 */

export const COMPLAINT_ISSUES = {
  OVERCHARGE: {
    key: 'OVERCHARGE',
    displayName: 'Overcharge',
    label: 'Overcharge / Excessive Fare'
  },
  REFUSED_SERVICE: {
    key: 'REFUSED_SERVICE',
    displayName: 'Refused Service',
    label: 'Refusal to Carry Passenger'
  },
  OVERLOADING: {
    key: 'OVERLOADING',
    displayName: 'Overloading',
    label: 'Overcrowding / Overloading'
  },
  RUDE_BEHAVIOR: {
    key: 'RUDE_BEHAVIOR',
    displayName: 'Rude Behavior',
    label: 'Driver / Staff Misbehavior'
  },
  DANGEROUS_DRIVING: {
    key: 'DANGEROUS_DRIVING',
    displayName: 'Dangerous Driving',
    label: 'Reckless / Dangerous Driving'
  },
  OTHER: {
    key: 'OTHER',
    displayName: 'Other Issue',
    label: 'General Transport Problem'
  }
};

const DRAFT_DISCLAIMER = 'This is a draft complaint summary. It has not been automatically filed with any authority.';
const DRAFT_SUBMIT_ADVISORY = 'You can copy, download, or share this text to submit it to the relevant authority.';

/**
 * Normalizes user-entered issue string or raw query into a standard category
 */
export function classifyComplaintIssue(input) {
  if (!input) return COMPLAINT_ISSUES.OTHER.key;
  const clean = String(input).toLowerCase().trim();

  // OVERCHARGE patterns
  if (
    clean.includes('overcharge') ||
    clean.includes('overcharged') ||
    clean.includes('charged too much') ||
    clean.includes('charged me too much') ||
    clean.includes('charged more') ||
    clean.includes('more than the listed fare') ||
    clean.includes('more than expected') ||
    clean.includes('extra fare') ||
    clean.includes('extra money') ||
    clean.includes('zyada paisay') ||
    clean.includes('zyada paise') ||
    clean.includes('zyada kiraya') ||
    clean.includes('زیادہ پیسے') ||
    clean.includes('زیادہ کرایہ') ||
    clean.includes('ज्यादा किराया') ||
    clean.includes('ज्यादा पैसे') ||
    clean.includes('loot') ||
    clean.includes('excessive fare') ||
    /(?:charged?\s+(?:me\s+)?(?:too\s+much|more|extra))/i.test(clean)
  ) {
    return COMPLAINT_ISSUES.OVERCHARGE.key;
  }

  // REFUSED_SERVICE patterns
  if (
    clean.includes('refuse') ||
    clean.includes('refused') ||
    clean.includes('denied') ||
    clean.includes('mana kiya') ||
    clean.includes('nahi bithaya') ||
    clean.includes('انکار') ||
    clean.includes('मना कर दिया') ||
    clean.includes('नहीं बैठाया')
  ) {
    return COMPLAINT_ISSUES.REFUSED_SERVICE.key;
  }

  // OVERLOADING patterns
  if (
    clean.includes('overcrowd') ||
    clean.includes('crowded') ||
    clean.includes('crowd') ||
    clean.includes('overloading') ||
    clean.includes('overloaded') ||
    clean.includes('too many people') ||
    clean.includes('bheed') ||
    clean.includes('rush') ||
    clean.includes('بھیڑ') ||
    clean.includes('भीड़') ||
    clean.includes('over filled')
  ) {
    return COMPLAINT_ISSUES.OVERLOADING.key;
  }

  // RUDE_BEHAVIOR patterns
  if (
    clean.includes('rude') ||
    clean.includes('abused') ||
    clean.includes('abusive') ||
    clean.includes('misbehaved') ||
    clean.includes('behaved badly') ||
    clean.includes('bad behavior') ||
    clean.includes('badtamiz') ||
    clean.includes('badtameez') ||
    clean.includes('بدتمیزی') ||
    clean.includes('बदतमीजी') ||
    clean.includes('गाली') ||
    clean.includes('misbehavior')
  ) {
    return COMPLAINT_ISSUES.RUDE_BEHAVIOR.key;
  }

  // DANGEROUS_DRIVING patterns
  if (
    clean.includes('dangerous') ||
    clean.includes('dangerously') ||
    clean.includes('rash') ||
    clean.includes('reckless') ||
    clean.includes('speeding') ||
    clean.includes('overspeeding') ||
    clean.includes('khatarnak') ||
    clean.includes('خطرناک') ||
    clean.includes('खतरनाक') ||
    clean.includes('fast driving')
  ) {
    return COMPLAINT_ISSUES.DANGEROUS_DRIVING.key;
  }

  return COMPLAINT_ISSUES.OTHER.key;
}

/**
 * Builds factual, ready-to-copy plain text complaint representation
 */
function buildComplaintText({
  date,
  location,
  route,
  vehicleType,
  issueLabel,
  amountCharged,
  expectedFare,
  description
}) {
  const lines = [
    'Subject: Transport Service Complaint',
    '',
    `Date: ${date || 'Not specified'}`,
    `Location: ${location || 'Not specified'}`,
    `Route: ${route || 'Not specified'}`,
    `Vehicle Type: ${vehicleType || 'Not specified'}`,
    `Issue: ${issueLabel}`
  ];

  if (amountCharged !== undefined && amountCharged !== null && amountCharged !== 'Not specified') {
    lines.push(`Amount Charged: ${amountCharged.toString().startsWith('₹') ? amountCharged : `₹${amountCharged}`}`);
  } else {
    lines.push('Amount Charged: Not specified');
  }

  if (expectedFare !== undefined && expectedFare !== null && expectedFare !== 'Not specified') {
    lines.push(`Expected Fare: ${expectedFare.toString().startsWith('₹') ? expectedFare : `₹${expectedFare}`}`);
  } else {
    lines.push('Expected Fare: Not specified');
  }

  lines.push('');
  lines.push('Description:');
  lines.push(description || 'Not specified');
  lines.push('');
  lines.push(DRAFT_DISCLAIMER);

  return lines.join('\n');
}

/**
 * Main complaint drafting service function
 *
 * @param {Object} params
 * @param {string} [params.date]
 * @param {string} [params.location]
 * @param {string} [params.route]
 * @param {string} [params.vehicleType]
 * @param {string} [params.issue]
 * @param {number|string} [params.amountCharged]
 * @param {number|string} [params.expectedFare]
 * @param {string} [params.description]
 * @returns {Object} Structured draft complaint
 */
export function draftComplaint(params = {}) {
  const {
    date,
    location,
    route,
    vehicleType,
    issue,
    amountCharged,
    expectedFare,
    description
  } = params;

  // Classify issue
  const issueKey = classifyComplaintIssue(issue || description || '');
  const issueDef = COMPLAINT_ISSUES[issueKey] || COMPLAINT_ISSUES.OTHER;

  // Normalize amounts without claiming illegality
  const formattedCharged = (amountCharged !== undefined && amountCharged !== null && amountCharged !== '')
    ? (String(amountCharged).startsWith('₹') ? String(amountCharged) : `₹${amountCharged}`)
    : 'Not specified';

  const formattedExpected = (expectedFare !== undefined && expectedFare !== null && expectedFare !== '')
    ? (String(expectedFare).startsWith('₹') ? String(expectedFare) : `₹${expectedFare}`)
    : 'Not specified';

  const normalizedFields = {
    date: date ? String(date).trim() : 'Not specified',
    location: location ? String(location).trim() : 'Not specified',
    route: route ? String(route).trim() : 'Not specified',
    vehicleType: vehicleType ? String(vehicleType).trim() : 'Not specified',
    issue: issueDef.key,
    issueLabel: issueDef.label,
    amountCharged: formattedCharged,
    expectedFare: formattedExpected,
    description: description ? String(description).trim() : 'Not specified'
  };

  const complaintText = buildComplaintText({
    date: normalizedFields.date,
    location: normalizedFields.location,
    route: normalizedFields.route,
    vehicleType: normalizedFields.vehicleType,
    issueLabel: issueDef.label,
    amountCharged: formattedCharged,
    expectedFare: formattedExpected,
    description: normalizedFields.description
  });

  return {
    success: true,
    type: 'COMPLAINT_DRAFT',
    issue: issueDef.key,
    issueLabel: issueDef.label,
    fields: normalizedFields,
    complaintText,
    source_type: 'DEMO',
    status: 'DRAFT — NOT SUBMITTED',
    disclaimer: DRAFT_DISCLAIMER,
    submitAdvisory: DRAFT_SUBMIT_ADVISORY
  };
}
