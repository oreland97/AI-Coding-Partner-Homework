const ClassificationService = require('../src/services/classificationService');
const Ticket = require('../src/models/ticket');

describe('Auto-Classification Service', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Classify account access issue
  test('should classify account access issues', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Can\'t access my account',
      description: 'I am unable to login to my account. The system keeps rejecting my password.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.category).toBe('account_access');
    expect(classification.category_confidence).toBeGreaterThan(0);
    expect(classification.keywords_found).toContain('login');
  });

  // Test 2: Classify technical issue
  test('should classify technical issues', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'App crashes on startup',
      description: 'The application crashes immediately when I launch it. I get an error and it closes.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.category).toBe('technical_issue');
    expect(classification.keywords_found).toContain('crash');
  });

  // Test 3: Classify billing question
  test('should classify billing questions', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Invoice issue',
      description: 'I have a question about my invoice. There seems to be a charge I don\'t recognize.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.category).toBe('billing_question');
  });

  // Test 4: Classify feature request
  test('should classify feature requests', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Feature request',
      description: 'It would be nice to have a dark mode feature in the application.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.category).toBe('feature_request');
  });

  // Test 5: Classify bug report
  test('should classify bug reports', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Bug report',
      description: 'There is a bug in the export function. Steps to reproduce: 1. Click export 2. Select PDF format.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.category).toBe('bug_report');
  });

  // Test 6: Classify as urgent priority
  test('should classify urgent priority', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Critical issue',
      description: 'Critical production down. Our service is currently offline.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.priority).toBe('urgent');
  });

  // Test 7: Classify as high priority
  test('should classify high priority', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Blocking issue',
      description: 'This is blocking our work. We cannot proceed without this being fixed asap.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.priority).toBe('high');
  });

  // Test 8: Classify as low priority
  test('should classify low priority', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Minor cosmetic issue',
      description: 'There is a minor cosmetic issue with the button styling.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.priority).toBe('low');
  });

  // Test 9: Auto-classify ticket
  test('should auto-classify and update ticket', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Can\'t login',
      description: 'I cannot access my account. This is critical for my business.',
    });

    const result = ClassificationService.autoClassifyTicket(ticket.id);

    expect(result.success).toBe(true);
    expect(result.classification).toBeDefined();
    expect(result.classification.manual_override).toBe(false);
    expect(result.classification.classified_at).toBeDefined();

    const updated = Ticket.findById(ticket.id);
    expect(updated.category).toBe('account_access');
    expect(updated.classification).toBeDefined();
  });

  // Test 10: Classification confidence score
  test('should calculate confidence scores', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Can\'t login and critical security breach',
      description: 'I cannot login and there is a critical security vulnerability in production.',
    });

    const classification = ClassificationService.classify(ticket);

    expect(classification.category_confidence).toBeGreaterThan(0);
    expect(classification.priority_confidence).toBeGreaterThan(0);
    expect(classification.overall_confidence).toBeGreaterThan(0);
    expect(classification.category_confidence).toBeLessThanOrEqual(1);
    expect(classification.priority_confidence).toBeLessThanOrEqual(1);
    expect(classification.overall_confidence).toBeLessThanOrEqual(1);
  });
});

