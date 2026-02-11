/**
 * AIDefence Client for Huron Grants Management
 *
 * Provides client-side threat detection for:
 * - Prompt injection in AI search queries
 * - SQL injection patterns
 * - XSS detection
 * - PII detection for compliance
 *
 * @version 2.2.0
 * @integrated 2026-01-27
 */

export interface ThreatDetectionResult {
  isSafe: boolean;
  threats: DetectedThreat[];
  score: number;
  processingTimeMs: number;
}

export interface DetectedThreat {
  type: ThreatType;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  position?: { start: number; end: number };
}

export type ThreatType =
  | 'prompt_injection'
  | 'sql_injection'
  | 'xss'
  | 'command_injection'
  | 'path_traversal'
  | 'pii_exposure';

// Threat patterns from aidefence v2.2.0 (183+ patterns)
const PROMPT_INJECTION_PATTERNS = [
  // Direct injection
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /disregard\s+(all|any)\s+(prior|previous)/i,
  /forget\s+(everything|all|your)\s+(you|know|instructions?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,

  // Jailbreak attempts
  /dan\s*(mode)?/i,
  /developer\s+mode/i,
  /bypass\s+(safety|filter|content)/i,
  /pretend\s+to\s+be/i,
  /roleplay\s+as/i,
  /act\s+as\s+(if|though)/i,

  // Encoding attacks
  /base64\s*decode/i,
  /\\x[0-9a-f]{2}/i,
  /%[0-9a-f]{2}/i,

  // Delimiter injection
  /```\s*(system|admin|root)/i,
  /\|\|\s*or\s*\|\|/i,
];

const SQL_INJECTION_PATTERNS = [
  // Classic patterns
  /'\s*(or|and)\s*['"]?\d*['"]?\s*=\s*['"]?\d*/i,
  /'\s*(or|and)\s*['"]?[a-z]+['"]?\s*=\s*['"]?[a-z]+/i,
  /;\s*(drop|delete|truncate|insert|update|alter)\s+/i,
  /union\s+(all\s+)?select/i,
  /select\s+.*\s+from\s+.*\s+where/i,

  // Comment injection
  /--\s*$/,
  /\/\*.*\*\//,
  /#.*$/m,

  // Stacked queries
  /;\s*select\s+/i,
  /;\s*insert\s+/i,
  /;\s*delete\s+/i,

  // Boolean-based
  /'\s*=\s*'/,
  /1\s*=\s*1/,
  /0\s*=\s*0/,
];

const XSS_PATTERNS = [
  /<script[^>]*>/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /on(click|load|error|mouseover|focus|blur|change|submit)\s*=/i,
  /<img[^>]+onerror/i,
  /<svg[^>]+onload/i,
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /expression\s*\(/i,
  /url\s*\(\s*['"]?javascript/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /;\s*(ls|cat|rm|wget|curl|bash|sh|nc|netcat)/i,
  /\|\s*(ls|cat|rm|bash|sh)/i,
  /`[^`]*`/,
  /\$\([^)]*\)/,
  /&&\s*(ls|cat|rm|bash)/i,
  /\|\|\s*(ls|cat|rm|bash)/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%2f/i,
  /\.\.\\/,
  /%252e%252e%252f/i,
];

const PII_PATTERNS = [
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b\d{9}\b/,

  // Credit Card
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
  /\b\d{16}\b/,

  // Email (in certain contexts)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,

  // Phone
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,

  // Passport
  /\b[A-Z]{1,2}\d{6,9}\b/i,
];

interface ScanOptions {
  checkPromptInjection?: boolean;
  checkSqlInjection?: boolean;
  checkXss?: boolean;
  checkCommandInjection?: boolean;
  checkPathTraversal?: boolean;
  checkPii?: boolean;
  context?: 'search' | 'form' | 'ai_query' | 'general';
}

const DEFAULT_OPTIONS: ScanOptions = {
  checkPromptInjection: true,
  checkSqlInjection: true,
  checkXss: true,
  checkCommandInjection: false,
  checkPathTraversal: true,
  checkPii: true,
  context: 'general',
};

/**
 * Scan input for security threats
 */
export function scanInput(input: string, options: ScanOptions = {}): ThreatDetectionResult {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const threats: DetectedThreat[] = [];

  if (!input || typeof input !== 'string') {
    return {
      isSafe: true,
      threats: [],
      score: 0,
      processingTimeMs: performance.now() - startTime,
    };
  }

  // For AI query context, prioritize prompt injection detection
  if (opts.context === 'ai_query' || opts.context === 'search') {
    opts.checkPromptInjection = true;
  }

  // Prompt injection
  if (opts.checkPromptInjection) {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'prompt_injection',
          pattern: pattern.source,
          severity: 'critical',
          description: `Potential prompt injection detected: "${match[0].substring(0, 50)}"`,
          position: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
        });
      }
    }
  }

  // SQL injection
  if (opts.checkSqlInjection) {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'sql_injection',
          pattern: pattern.source,
          severity: 'critical',
          description: `Potential SQL injection detected: "${match[0].substring(0, 50)}"`,
          position: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
        });
      }
    }
  }

  // XSS
  if (opts.checkXss) {
    for (const pattern of XSS_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'xss',
          pattern: pattern.source,
          severity: 'high',
          description: `Potential XSS detected: "${match[0].substring(0, 50)}"`,
          position: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
        });
      }
    }
  }

  // Command injection
  if (opts.checkCommandInjection) {
    for (const pattern of COMMAND_INJECTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'command_injection',
          pattern: pattern.source,
          severity: 'critical',
          description: `Potential command injection detected: "${match[0].substring(0, 50)}"`,
          position: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
        });
      }
    }
  }

  // Path traversal
  if (opts.checkPathTraversal) {
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'path_traversal',
          pattern: pattern.source,
          severity: 'high',
          description: `Potential path traversal detected: "${match[0]}"`,
          position: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
        });
      }
    }
  }

  // PII detection
  if (opts.checkPii) {
    for (const pattern of PII_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'pii_exposure',
          pattern: pattern.source,
          severity: 'medium',
          description: `Potential PII detected (redacted for security)`,
          position: match.index !== undefined ? { start: match.index, end: match.index + match[0].length } : undefined,
        });
      }
    }
  }

  // Calculate threat score (0-100)
  const score = calculateThreatScore(threats);

  return {
    isSafe: threats.length === 0,
    threats,
    score,
    processingTimeMs: performance.now() - startTime,
  };
}

/**
 * Calculate threat score based on detected threats
 */
function calculateThreatScore(threats: DetectedThreat[]): number {
  if (threats.length === 0) return 0;

  const severityWeights = {
    low: 10,
    medium: 25,
    high: 50,
    critical: 100,
  };

  let totalScore = 0;
  for (const threat of threats) {
    totalScore += severityWeights[threat.severity];
  }

  return Math.min(100, totalScore);
}

/**
 * Sanitize input by removing detected threats
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized;
}

/**
 * Quick check if input is safe for AI queries
 */
export function isSafeForAI(input: string): boolean {
  const result = scanInput(input, {
    context: 'ai_query',
    checkPromptInjection: true,
    checkSqlInjection: true,
    checkPii: true,
  });
  return result.isSafe;
}

/**
 * Quick check if input is safe for search
 */
export function isSafeForSearch(input: string): boolean {
  const result = scanInput(input, {
    context: 'search',
    checkPromptInjection: true,
    checkSqlInjection: true,
    checkXss: true,
  });
  return result.isSafe;
}

// Export pattern counts for debugging
export const PATTERN_COUNTS = {
  promptInjection: PROMPT_INJECTION_PATTERNS.length,
  sqlInjection: SQL_INJECTION_PATTERNS.length,
  xss: XSS_PATTERNS.length,
  commandInjection: COMMAND_INJECTION_PATTERNS.length,
  pathTraversal: PATH_TRAVERSAL_PATTERNS.length,
  pii: PII_PATTERNS.length,
  total: PROMPT_INJECTION_PATTERNS.length +
         SQL_INJECTION_PATTERNS.length +
         XSS_PATTERNS.length +
         COMMAND_INJECTION_PATTERNS.length +
         PATH_TRAVERSAL_PATTERNS.length +
         PII_PATTERNS.length,
};
