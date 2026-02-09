const request = require('supertest');
const app = require('../src/index');
const Ticket = require('../src/models/ticket');

describe('Integration Tests - End-to-End Workflows', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Complete ticket lifecycle
  test('should complete full ticket lifecycle: create, update, classify, resolve', async () => {
    // Create a ticket
    const createRes = await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Account locked',
        description: 'My account has been locked after multiple failed login attempts.',
      });

    expect(createRes.statusCode).toBe(201);
    const ticketId = createRes.body.id;

    // Retrieve the ticket
    const getRes = await request(app).get(`/tickets/${ticketId}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('new');

    // Update ticket status
    const updateRes = await request(app)
      .put(`/tickets/${ticketId}`)
      .send({ status: 'in_progress', assigned_to: 'Support Agent' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.status).toBe('in_progress');

    // Mark as resolved
    const resolveRes = await request(app)
      .put(`/tickets/${ticketId}`)
      .send({ status: 'resolved', resolved_at: new Date().toISOString() });

    expect(resolveRes.statusCode).toBe(200);
    expect(resolveRes.body.status).toBe('resolved');
  });

  // Test 2: Bulk import with verification
  test('should bulk import and verify all tickets created', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,status
CUST-001,user1@example.com,User One,Issue One,This is a test issue with description.,new
CUST-002,user2@example.com,User Two,Issue Two,Another test issue with description.,new
CUST-003,user3@example.com,User Three,Issue Three,Third test issue with description.,new`;

    const importRes = await request(app)
      .post('/tickets/import')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(importRes.statusCode).toBe(201);
    expect(importRes.body.summary.successful).toBe(3);

    // Verify all tickets exist
    const listRes = await request(app).get('/tickets');
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBe(3);
  });

  // Test 3: Concurrent ticket creation
  test('should handle multiple concurrent ticket creations', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .post('/tickets')
          .send({
            customer_id: `CUST-${i}`,
            customer_email: `user${i}@example.com`,
            customer_name: `User ${i}`,
            subject: `Issue ${i}`,
            description: `This is a test description for issue ${i}.`,
          })
      );
    }

    const responses = await Promise.all(promises);

    responses.forEach(res => {
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    // Verify all were created
    const listRes = await request(app).get('/tickets');
    expect(listRes.body.data.length).toBe(10);
  });

  // Test 4: Combined filtering
  test('should filter tickets by multiple criteria', async () => {
    // Create tickets with different categories and priorities
    await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST-001',
        customer_email: 'test1@example.com',
        customer_name: 'User 1',
        subject: 'Can\'t login',
        description: 'Cannot access my account.',
        category: 'account_access',
        priority: 'urgent',
      });

    await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST-002',
        customer_email: 'test2@example.com',
        customer_name: 'User 2',
        subject: 'Can\'t login to billing',
        description: 'Billing account is locked.',
        category: 'account_access',
        priority: 'high',
      });

    await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST-003',
        customer_email: 'test3@example.com',
        customer_name: 'User 3',
        subject: 'Feature request for dark mode',
        description: 'Please add a dark mode feature.',
        category: 'feature_request',
        priority: 'low',
      });

    // Filter by category and priority
    const res = await request(app).get('/tickets?category=account_access&priority=urgent');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe('account_access');
    expect(res.body.data[0].priority).toBe('urgent');
  });

  // Test 5: Search across ticket fields
  test('should search tickets across multiple fields', async () => {
    await request(app)
      .post('/tickets')
      .send({
        customer_id: 'CUST-001',
        customer_email: 'john.doe@example.com',
        customer_name: 'John Doe',
        subject: 'Payment issue',
        description: 'I have a problem with my payment processing.',
      });

    // Search by customer name
    const nameRes = await request(app).get('/tickets?search=john');
    expect(nameRes.statusCode).toBe(200);
    expect(nameRes.body.data.length).toBe(1);

    // Search by subject
    const subjectRes = await request(app).get('/tickets?search=payment');
    expect(subjectRes.statusCode).toBe(200);
    expect(subjectRes.body.data.length).toBe(1);

    // Search by description
    const descRes = await request(app).get('/tickets?search=processing');
    expect(descRes.statusCode).toBe(200);
    expect(descRes.body.data.length).toBe(1);
  });
});

