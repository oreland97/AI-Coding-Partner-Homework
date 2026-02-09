const request = require('supertest');
const app = require('../src/index');
const Ticket = require('../src/models/ticket');

describe('Ticket API Endpoints', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Create a ticket
  describe('POST /tickets', () => {
    test('should create a new ticket with valid data', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          customer_id: 'CUST-001',
          customer_email: 'test@example.com',
          customer_name: 'Test User',
          subject: 'Account access issue',
          description: 'I cannot access my account at all.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.category).toBe('account_access');
      expect(res.body.priority).toBe('urgent');
    });

    test('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          customer_id: 'CUST-001',
          customer_email: 'test@example.com',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          customer_id: 'CUST-001',
          customer_email: 'not-an-email',
          customer_name: 'Test User',
          subject: 'Test issue',
          description: 'This is a test description.',
        });

      expect(res.statusCode).toBe(400);
    });

    test('should disable auto-classification with query parameter', async () => {
      const res = await request(app)
        .post('/tickets?autoClassify=false')
        .send({
          customer_id: 'CUST-001',
          customer_email: 'test@example.com',
          customer_name: 'Test User',
          subject: 'Can\'t login to account',
          description: 'I cannot access my account.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.classification).toBeUndefined();
      expect(res.body.category).toBe('other');
    });
  });

  // Test 2: Get all tickets
  describe('GET /tickets', () => {
    test('should return empty array when no tickets exist', async () => {
      const res = await request(app).get('/tickets');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    test('should return list of all tickets', async () => {
      const ticket1 = Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test1@example.com',
        customer_name: 'User 1',
        subject: 'Issue 1',
        description: 'This is a description for issue 1.',
      });

      const ticket2 = Ticket.create({
        customer_id: 'CUST-002',
        customer_email: 'test2@example.com',
        customer_name: 'User 2',
        subject: 'Issue 2',
        description: 'This is a description for issue 2.',
      });

      const res = await request(app).get('/tickets');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    test('should filter tickets by category', async () => {
      Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'User',
        subject: 'Can\'t login',
        description: 'Cannot access my account.',
        category: 'account_access',
      });

      Ticket.create({
        customer_id: 'CUST-002',
        customer_email: 'test2@example.com',
        customer_name: 'User 2',
        subject: 'App bug',
        description: 'App crashes on startup.',
        category: 'technical_issue',
      });

      const res = await request(app).get('/tickets?category=account_access');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('account_access');
    });

    test('should filter tickets by priority', async () => {
      Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'User',
        subject: 'Critical issue',
        description: 'Critical production down.',
        priority: 'urgent',
      });

      Ticket.create({
        customer_id: 'CUST-002',
        customer_email: 'test2@example.com',
        customer_name: 'User 2',
        subject: 'Minor issue',
        description: 'Minor cosmetic issue.',
        priority: 'low',
      });

      const res = await request(app).get('/tickets?priority=urgent');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('urgent');
    });

    test('should support pagination', async () => {
      for (let i = 0; i < 25; i++) {
        Ticket.create({
          customer_id: `CUST-${i}`,
          customer_email: `user${i}@example.com`,
          customer_name: `User ${i}`,
          subject: `Issue ${i}`,
          description: `Description for issue ${i}.`,
        });
      }

      const res1 = await request(app).get('/tickets?page=1&limit=10');
      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.length).toBe(10);
      expect(res1.body.pagination.page).toBe(1);
      expect(res1.body.pagination.pages).toBe(3);

      const res2 = await request(app).get('/tickets?page=2&limit=10');
      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.length).toBe(10);
    });
  });

  // Test 3: Get specific ticket
  describe('GET /tickets/:id', () => {
    test('should return ticket by ID', async () => {
      const created = Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test issue',
        description: 'This is a test description.',
      });

      const res = await request(app).get(`/tickets/${created.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.customer_email).toBe('test@example.com');
    });

    test('should return 404 for non-existent ticket', async () => {
      const res = await request(app).get('/tickets/non-existent-id');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test 4: Update ticket
  describe('PUT /tickets/:id', () => {
    test('should update ticket successfully', async () => {
      const created = Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Original subject',
        description: 'This is a test description.',
      });

      const res = await request(app)
        .put(`/tickets/${created.id}`)
        .send({
          subject: 'Updated subject',
          status: 'in_progress',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.subject).toBe('Updated subject');
      expect(res.body.status).toBe('in_progress');
    });

    test('should return 404 when updating non-existent ticket', async () => {
      const res = await request(app)
        .put('/tickets/non-existent-id')
        .send({ subject: 'New subject' });

      expect(res.statusCode).toBe(404);
    });
  });

  // Test 5: Delete ticket
  describe('DELETE /tickets/:id', () => {
    test('should delete ticket successfully', async () => {
      const created = Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test issue',
        description: 'This is a test description.',
      });

      const res = await request(app).delete(`/tickets/${created.id}`);

      expect(res.statusCode).toBe(204);

      const verify = await request(app).get(`/tickets/${created.id}`);
      expect(verify.statusCode).toBe(404);
    });

    test('should return 404 when deleting non-existent ticket', async () => {
      const res = await request(app).delete('/tickets/non-existent-id');

      expect(res.statusCode).toBe(404);
    });
  });

  // Test 6: Auto-classify endpoint
  describe('POST /tickets/:id/auto-classify', () => {
    test('should auto-classify a ticket', async () => {
      const created = Ticket.create({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Can\'t access account',
        description: 'I cannot login to my account at all.',
      });

      const res = await request(app).post(`/tickets/${created.id}/auto-classify`);

      expect(res.statusCode).toBe(200);
      expect(res.body.classification).toBeDefined();
      expect(res.body.classification.category).toBe('account_access');
      expect(res.body.ticket.category).toBe('account_access');
    });

    test('should return 404 for non-existent ticket', async () => {
      const res = await request(app).post('/tickets/non-existent-id/auto-classify');

      expect(res.statusCode).toBe(404);
    });
  });

  // Test 7: Search functionality
  test('should search tickets by text', async () => {
    Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'John Doe',
      subject: 'Payment issue',
      description: 'I have a billing problem.',
    });

    Ticket.create({
      customer_id: 'CUST-002',
      customer_email: 'test2@example.com',
      customer_name: 'Jane Smith',
      subject: 'Feature request',
      description: 'Please add dark mode.',
    });

    const res = await request(app).get('/tickets?search=payment');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].subject).toContain('Payment');
  });

  // Test 8: Filter by status
  test('should filter tickets by status', async () => {
    Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Issue',
      description: 'Description.',
      status: 'new',
    });

    Ticket.create({
      customer_id: 'CUST-002',
      customer_email: 'test2@example.com',
      customer_name: 'User 2',
      subject: 'Issue 2',
      description: 'Description 2.',
      status: 'resolved',
    });

    const res = await request(app).get('/tickets?status=resolved');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('resolved');
  });

  // Test 9: Filter by customer_id
  test('should filter tickets by customer_id', async () => {
    Ticket.create({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'User',
      subject: 'Issue',
      description: 'Description.',
    });

    Ticket.create({
      customer_id: 'CUST-002',
      customer_email: 'test2@example.com',
      customer_name: 'User 2',
      subject: 'Issue 2',
      description: 'Description 2.',
    });

    const res = await request(app).get('/tickets?customer_id=CUST-001');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].customer_id).toBe('CUST-001');
  });

  // Test 10: Health check
  test('health check should return ok', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // Test 11: 404 handling
  test('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

