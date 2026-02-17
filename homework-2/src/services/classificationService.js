const Ticket = require('../models/ticket');

// Keyword-based classification rules
const CLASSIFICATION_RULES = {
  account_access: {
    keywords: ['login', 'password', '2fa', 'two factor', 'two-factor', 'access', 'locked', 'locked out', 'can\'t login', 'cannot login', 'reset password', 'account locked'],
    priority_boost: { urgent: 5, high: 3, medium: 0, low: 0 },
  },
  technical_issue: {
    keywords: ['error', 'crash', 'bug', 'broken', 'not working', 'doesn\'t work', 'fails', 'failure', 'issue', 'problem', 'glitch', 'malfunction'],
    priority_boost: { urgent: 3, high: 2, medium: 0, low: 0 },
  },
  billing_question: {
    keywords: ['payment', 'invoice', 'billing', 'refund', 'charge', 'subscription', 'pricing', 'cost', 'credit card', 'bill', 'discount'],
    priority_boost: { urgent: 2, high: 1, medium: 0, low: 0 },
  },
  feature_request: {
    keywords: ['feature', 'add', 'request', 'suggestion', 'idea', 'enhancement', 'would like', 'would be nice', 'could we', 'can we'],
    priority_boost: { urgent: 0, high: 0, medium: 0, low: 2 },
  },
  bug_report: {
    keywords: ['bug', 'defect', 'reproduction', 'steps to reproduce', 'repro', 'reproducible', 'consistently', 'happens every time'],
    priority_boost: { urgent: 4, high: 2, medium: 0, low: 0 },
  },
};

const PRIORITY_KEYWORDS = {
  urgent: ['can\'t access', 'critical', 'production down', 'production issue', 'security', 'breach', 'outage', 'down', 'offline', 'urgent', 'emergency'],
  high: ['important', 'blocking', 'asap', 'as soon as possible', 'stuck', 'cannot proceed', 'blocked'],
  medium: [],
  low: ['minor', 'cosmetic', 'suggestion', 'enhancement', 'nice to have', 'feature request'],
};

class ClassificationService {
  static classify(ticket) {
    const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

    const categoryScores = {};
    const foundKeywords = new Set();

    // Calculate category scores based on keywords
    Object.entries(CLASSIFICATION_RULES).forEach(([category, rules]) => {
      let score = 0;
      rules.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1;
          foundKeywords.add(keyword);
        }
      });
      categoryScores[category] = score;
    });

    // Determine category - find the key with the highest score
    let category = 'other';
    let maxScore = 0;
    Object.entries(categoryScores).forEach(([cat, score]) => {
      if (score > maxScore) {
        maxScore = score;
        category = cat;
      }
    });
    const categoryConfidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0.3; // Max confidence 1.0

    // Determine priority
    let priority = 'medium';
    let priorityScore = 0;

    Object.entries(PRIORITY_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          priorityScore = Math.max(priorityScore, Object.keys(PRIORITY_KEYWORDS).indexOf(level) + 1);
        }
      });
    });

    if (priorityScore > 0) {
      priority = Object.keys(PRIORITY_KEYWORDS)[Object.keys(PRIORITY_KEYWORDS).length - priorityScore];
    }

    const priorityConfidence = priorityScore > 0 ? Math.min(priorityScore / 3, 1) : 0.5;

    // Build reasoning
    const reasoning = {
      category_reasoning: maxScore > 0
        ? `Matched ${maxScore} keyword(s) for ${category}`
        : 'No keywords matched, assigned default category',
      priority_reasoning: priorityScore > 0
        ? `Found urgent/important keywords indicating ${priority} priority`
        : 'No priority indicators found, assigned default medium priority',
    };

    return {
      category,
      priority,
      category_confidence: parseFloat(categoryConfidence.toFixed(2)),
      priority_confidence: parseFloat(priorityConfidence.toFixed(2)),
      overall_confidence: parseFloat(((categoryConfidence + priorityConfidence) / 2).toFixed(2)),
      reasoning,
      keywords_found: Array.from(foundKeywords),
    };
  }

  static autoClassifyTicket(ticketId) {
    const ticket = Ticket.findById(ticketId);
    if (!ticket) {
      return { error: 'Ticket not found', status: 404 };
    }

    const classification = this.classify(ticket);

    // Update ticket with classification
    ticket.category = classification.category;
    ticket.priority = classification.priority;
    ticket.classification = {
      ...classification,
      classified_at: new Date().toISOString(),
      manual_override: false,
    };

    Ticket.update(ticketId, ticket.toJSON());

    return { success: true, classification: ticket.classification };
  }
}

module.exports = ClassificationService;

