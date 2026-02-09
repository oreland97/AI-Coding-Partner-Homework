const request = require('supertest');
const app = require('../src/index');
const Ticket = require('../src/models/ticket');

describe('Performance Tests', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Bulk create performance
  test('should handle creating 100 tickets in reasonable time', async () => {
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .post('/tickets')
          .send({
            customer_id: `CUST-${i}`,
            customer_email: `user${i}@example.com`,
            customer_name: `User ${i}`,
            subject: `Issue ${i}`,
            description: `This is a test description for issue number ${i}.`,
          })
      );
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`Created 100 tickets in ${duration}ms`);
    expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
  });

  // Test 2: List performance
  test('should list 100 tickets efficiently', async () => {
    // Create 100 tickets
    for (let i = 0; i < 100; i++) {
      Ticket.create({
        customer_id: `CUST-${i}`,
        customer_email: `user${i}@example.com`,
        customer_name: `User ${i}`,
        subject: `Issue ${i}`,
        description: `This is a test description for issue ${i}.`,
      });
    }

    const startTime = Date.now();
    const res = await request(app).get('/tickets?page=1&limit=50');
    const duration = Date.now() - startTime;

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(50);
    console.log(`Listed 50 of 100 tickets in ${duration}ms`);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  // Test 3: Filtering performance
  test('should filter 100 tickets efficiently', async () => {
    // Create tickets with mixed categories
    for (let i = 0; i < 100; i++) {
      const categories = ['account_access', 'technical_issue', 'billing_question', 'feature_request', 'bug_report'];
      Ticket.create({
        customer_id: `CUST-${i}`,
        customer_email: `user${i}@example.com`,
        customer_name: `User ${i}`,
        subject: `Issue ${i}`,
        description: `This is a test description for issue ${i}.`,
        category: categories[i % categories.length],
      });
    }

    const startTime = Date.now();
    const res = await request(app).get('/tickets?category=technical_issue');
    const duration = Date.now() - startTime;

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    console.log(`Filtered 100 tickets in ${duration}ms`);
    expect(duration).toBeLessThan(500); // Should complete within 500ms
  });

  // Test 4: Search performance
  test('should search 100 tickets efficiently', async () => {
    // Create tickets with searchable content
    for (let i = 0; i < 100; i++) {
      Ticket.create({
        customer_id: `CUST-${i}`,
        customer_email: `user${i}@example.com`,
        customer_name: i % 2 === 0 ? 'John Doe' : 'Jane Smith',
        subject: `Issue ${i}`,
        description: `This is a test description for issue ${i}.`,
      });
    }

    const startTime = Date.now();
    const res = await request(app).get('/tickets?search=john');
    const duration = Date.now() - startTime;

    expect(res.statusCode).toBe(200);
    console.log(`Searched 100 tickets in ${duration}ms`);
    expect(duration).toBeLessThan(500); // Should complete within 500ms
  });

  // Test 5: Pagination performance
  test('should paginate through 100 tickets efficiently', async () => {
    // Create 100 tickets
    for (let i = 0; i < 100; i++) {
      Ticket.create({
        customer_id: `CUST-${i}`,
        customer_email: `user${i}@example.com`,
        customer_name: `User ${i}`,
        subject: `Issue ${i}`,
        description: `This is a test description for issue ${i}.`,
      });
    }

    const startTime = Date.now();
    const res1 = await request(app).get('/tickets?page=1&limit=20');
    const res2 = await request(app).get('/tickets?page=2&limit=20');
    const res3 = await request(app).get('/tickets?page=5&limit=20');
    const duration = Date.now() - startTime;

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(res3.statusCode).toBe(200);
    console.log(`Paginated through 100 tickets (3 requests) in ${duration}ms`);
    expect(duration).toBeLessThan(1000); // All 3 requests should complete within 1 second
  });
});

