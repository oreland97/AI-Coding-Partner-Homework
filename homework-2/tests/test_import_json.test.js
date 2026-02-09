const request = require('supertest');
const app = require('../src/index');
const Ticket = require('../src/models/ticket');

describe('JSON Import', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Import valid JSON array
  test('should import valid JSON array', async () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'CUST-001',
        customer_email: 'test1@example.com',
        customer_name: 'User One',
        subject: 'Issue One',
        description: 'This is the first issue description.',
      },
      {
        customer_id: 'CUST-002',
        customer_email: 'test2@example.com',
        customer_name: 'User Two',
        subject: 'Issue Two',
        description: 'This is the second issue description.',
      },
    ]);

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/json')
      .send(jsonContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.total).toBe(2);
    expect(res.body.summary.successful).toBe(2);
    expect(res.body.summary.failed).toBe(0);
  });

  // Test 2: Import single JSON object
  test('should import single JSON object', async () => {
    const jsonContent = JSON.stringify({
      customer_id: 'CUST-001',
      customer_email: 'test@example.com',
      customer_name: 'User One',
      subject: 'Issue One',
      description: 'This is the issue description.',
    });

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/json')
      .send(jsonContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.total).toBe(1);
    expect(res.body.summary.successful).toBe(1);
  });

  // Test 3: Import JSON with invalid email
  test('should handle JSON with invalid email', async () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'CUST-001',
        customer_email: 'valid@example.com',
        customer_name: 'User One',
        subject: 'Issue',
        description: 'This is a valid issue description.',
      },
      {
        customer_id: 'CUST-002',
        customer_email: 'invalid-email',
        customer_name: 'User Two',
        subject: 'Issue Two',
        description: 'This is the second issue description.',
      },
    ]);

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/json')
      .send(jsonContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.successful).toBe(1);
    expect(res.body.summary.failed).toBe(1);
  });

  // Test 4: Import malformed JSON
  test('should handle malformed JSON', async () => {
    const malformedJson = '{ invalid json content ]';

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/json')
      .send(malformedJson);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Test 5: Import JSON with short description
  test('should reject JSON with description too short', async () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'CUST-001',
        customer_email: 'test@example.com',
        customer_name: 'User One',
        subject: 'Issue',
        description: 'Too short',
      },
    ]);

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/json')
      .send(jsonContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.failed).toBe(1);
  });
});

