const Ticket = require('../src/models/ticket');

describe('Ticket Model - Data Validation', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Create ticket with minimal required fields
  test('should create ticket with only required fields', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Test subject',
      description: 'This is a test description.',
    });

    expect(ticket).toBeDefined();
    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe('new');
    expect(ticket.category).toBe('other');
    expect(ticket.priority).toBe('medium');
  });

  // Test 2: Create ticket with all fields
  test('should create ticket with all fields', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Test subject',
      description: 'This is a test description.',
      category: 'account_access',
      priority: 'urgent',
      status: 'in_progress',
      tags: ['tag1', 'tag2'],
      assigned_to: 'John Doe',
      metadata: {
        source: 'email',
        browser: 'Chrome',
        device_type: 'desktop',
      },
    });

    expect(ticket.category).toBe('account_access');
    expect(ticket.priority).toBe('urgent');
    expect(ticket.tags.length).toBe(2);
    expect(ticket.assigned_to).toBe('John Doe');
  });

  // Test 3: UUID generation
  test('should generate unique IDs for each ticket', () => {
    const ticket1 = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test1@example.com',
      customer_name: 'User 1',
      subject: 'Subject 1',
      description: 'Description 1.',
    });

    const ticket2 = Ticket.create({
      customer_id: 'CUST-002',
      customer_email: 'test2@example.com',
      customer_name: 'User 2',
      subject: 'Subject 2',
      description: 'Description 2.',
    });

    expect(ticket1.id).not.toBe(ticket2.id);
    expect(ticket1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  // Test 4: Timestamp generation
  test('should set created_at timestamp', () => {
    const before = new Date();
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Subject',
      description: 'Description.',
    });
    const after = new Date();

    const createdAt = new Date(ticket.created_at);
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // Test 5: Find by ID
  test('should find ticket by ID', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Subject',
      description: 'Description.',
    });

    const found = Ticket.findById(ticket.id);

    expect(found).toBeDefined();
    expect(found.id).toBe(ticket.id);
    expect(found.customer_email).toBe('test@example.com');
  });

  // Test 6: Find all tickets
  test('should find all tickets', () => {
    Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test1@example.com',
      customer_name: 'User 1',
      subject: 'Subject 1',
      description: 'Description 1.',
    });

    Ticket.create({
      customer_id: 'CUST-002',
      customer_email: 'test2@example.com',
      customer_name: 'User 2',
      subject: 'Subject 2',
      description: 'Description 2.',
    });

    const tickets = Ticket.findAll();

    expect(tickets.length).toBe(2);
  });

  // Test 7: Update ticket
  test('should update ticket and preserve created_at', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Original subject',
      description: 'Description.',
    });

    const originalCreatedAt = ticket.created_at;

    const updated = Ticket.update(ticket.id, {
      subject: 'Updated subject',
      status: 'resolved',
    });

    expect(updated.subject).toBe('Updated subject');
    expect(updated.status).toBe('resolved');
    expect(updated.created_at).toBe(originalCreatedAt);
    expect(updated.updated_at).not.toBe(originalCreatedAt);
  });

  // Test 8: Delete ticket
  test('should delete ticket', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Subject',
      description: 'Description.',
    });

    Ticket.delete(ticket.id);

    const found = Ticket.findById(ticket.id);
    expect(found).toBeNull();
  });

  // Test 9: toJSON serialization
  test('should serialize ticket to JSON correctly', () => {
    const ticket = Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Subject',
      description: 'Description.',
      category: 'account_access',
      priority: 'high',
    });

    const json = ticket.toJSON();

    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('customer_id');
    expect(json).toHaveProperty('customer_email');
    expect(json).toHaveProperty('customer_name');
    expect(json).toHaveProperty('subject');
    expect(json).toHaveProperty('description');
    expect(json).toHaveProperty('category');
    expect(json).toHaveProperty('priority');
    expect(json).toHaveProperty('created_at');
    expect(json).toHaveProperty('updated_at');
    expect(typeof json).toBe('object');
  });
});

