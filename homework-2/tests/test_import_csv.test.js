const request = require('supertest');
const app = require('../src/index');
const fs = require('fs');
const path = require('path');
const Ticket = require('../src/models/ticket');

describe('CSV Import', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Import valid CSV
  test('should import valid CSV file', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,status
CUST-001,test1@example.com,User One,Issue One,This is the first issue description.,new
CUST-002,test2@example.com,User Two,Issue Two,This is the second issue description.,new`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.total).toBe(2);
    expect(res.body.summary.successful).toBe(2);
    expect(res.body.summary.failed).toBe(0);
    expect(res.body.tickets.length).toBe(2);
  });

  // Test 2: Import CSV with invalid rows
  test('should handle invalid CSV rows gracefully', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,status
CUST-001,test1@example.com,User One,Issue One,This is the first issue description.,new
CUST-002,invalid-email,User Two,Issue Two,This is the second issue description.,new`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.successful).toBe(1);
    expect(res.body.summary.failed).toBe(1);
    expect(res.body.errors).toBeDefined();
  });

  // Test 3: Import CSV with auto-classification disabled
  test('should import CSV without auto-classification', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,status
CUST-001,test1@example.com,User One,Can't login to account,Cannot access my account.,new`;

    const res = await request(app)
      .post('/tickets/import?autoClassify=false')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.tickets[0].category).toBe('other');
  });

  // Test 4: Import empty CSV
  test('should handle empty CSV file', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,status`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.total).toBe(0);
  });

  // Test 5: Import CSV with missing required field
  test('should fail for CSV missing required fields', async () => {
    const csvContent = `customer_id,customer_name,subject,description
CUST-001,User One,Issue One,This is the first issue description.`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.failed).toBe(1);
  });

  // Test 6: Import CSV with auto-classification enabled (default)
  test('should auto-classify imported CSV data', async () => {
    const csvContent = `customer_id,customer_email,customer_name,subject,description,status
CUST-001,test@example.com,User One,Critical security breach,There is a security vulnerability in production.,new`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'text/csv')
      .send(csvContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.tickets[0].category).not.toBe('other');
  });
});

