// Extract the "Prompt-Ready Brief" from router output
export function extractRouterBrief(text) {
  const match = text.match(/Prompt-Ready Brief[:\s*]+\[?([^\n\]]+(?:\n(?![*\-#\[])[^\n]+)*)\]?/i);
  if (match) return match[1].trim();

  // Fallback: grab everything after the label until next bold heading
  const fallback = text.match(/Prompt-Ready Brief[:\s]+(.+?)(?=\n\*\*|\n##|$)/is);
  return fallback ? fallback[1].trim() : null;
}

// Extract the canvas format / design type from router output for Canva API
export function extractDesignType(text) {
  const formatLine = text.match(/Canvas Format[:\s]+([^\n]+)/i);
  if (!formatLine) return 'instagram_post';

  const fmt = formatLine[1].toLowerCase();
  if (fmt.includes('instagram') && fmt.includes('story')) return 'your_story';
  if (fmt.includes('instagram')) return 'instagram_post';
  if (fmt.includes('facebook')) return 'facebook_post';
  if (fmt.includes('twitter') || fmt.includes('x post')) return 'twitter_post';
  if (fmt.includes('linkedin')) return 'facebook_post'; // closest match
  if (fmt.includes('poster')) return 'poster';
  if (fmt.includes('flyer')) return 'flyer';
  if (fmt.includes('presentation') || fmt.includes('16:9')) return 'presentation';
  if (fmt.includes('resume')) return 'resume';
  if (fmt.includes('infographic')) return 'infographic';
  if (fmt.includes('email')) return 'email';
  return 'instagram_post';
}

// Extract the "CANVA PROMPT READY" block from builder output
export function extractCanvaPrompt(text) {
  const match = text.match(/CANVA PROMPT READY[:\s*]*\n+([\s\S]+?)(?:\n\n\*\*|\n\n#|$)/i);
  if (match) return match[1].trim();

  // Fallback: everything after the label
  const fallback = text.match(/CANVA PROMPT READY[:\s*]*\n?([\s\S]+)/i);
  return fallback ? fallback[1].trim() : null;
}

// Parse pillar scores from evaluator output
export function parsePillarScores(text) {
  const PILLAR_NAMES = [
    'User Intent',
    'Visual Excellence',
    'Stylistic Integrity',
    'Diversity & Inclusion',
    'Usability',
    'Canva-Readiness',
  ];

  const pillars = [];

  for (const name of PILLAR_NAMES) {
    // Match: **Pillar Name**: 4/5 PASS\n*Diagnosis*: ...
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&');
    const regex = new RegExp(
      `\\*\\*${escapedName}\\*\\*[:\\s]+(\\d)\\/5\\s+(PASS|FLAG|FAIL)\\s*\\n\\*Diagnosis\\*[:\\s]+([^\\n]+(?:\\n(?!\\*\\*)[^\\n]+)*)`,
      'i'
    );
    const match = text.match(regex);
    if (match) {
      pillars.push({
        name,
        score: parseInt(match[1], 10),
        status: match[2].toUpperCase(),
        diagnosis: match[3].trim(),
      });
    }
  }

  const verdictMatch = text.match(/\*\*OVERALL VERDICT\*\*[:\s]+(PASS|REVISE|REJECT)/i);
  const scoreMatch = text.match(/\*\*Overall Score\*\*[:\s]+([\d.]+)\/5/i);
  const topFixMatch = text.match(/\*\*Top Fix\*\*[:\s]+([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
  const secondaryMatch = text.match(/\*\*Secondary Fixes\*\*[:\s]+([\s\S]+?)(?=\n\*\*|$)/i);
  const comparativeMatch = text.match(/\*\*COMPARATIVE RECOMMENDATION\*\*[\s\S]*?\n([\s\S]+?)(?=\n---|\n\*\*|$)/i);

  return {
    pillars,
    verdict: verdictMatch?.[1]?.toUpperCase() ?? null,
    overallScore: scoreMatch ? parseFloat(scoreMatch[1]) : null,
    topFix: topFixMatch?.[1]?.trim() ?? null,
    secondaryFixes: secondaryMatch?.[1]?.trim() ?? null,
    comparative: comparativeMatch?.[1]?.trim() ?? null,
  };
}

// Detect if a message contains a complete router package
export function isRouterComplete(text) {
  return /LOG ENTRY/i.test(text) && /Prompt-Ready Brief/i.test(text);
}

// Detect if a message contains a completed builder prompt
export function isBuilderComplete(text) {
  return /CANVA PROMPT READY/i.test(text);
}

// Detect if a message contains evaluation scores
export function isEvaluationComplete(text) {
  return /OVERALL VERDICT/i.test(text) && /Overall Score/i.test(text);
}
