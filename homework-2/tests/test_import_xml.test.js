const request = require('supertest');
const app = require('../src/index');
const Ticket = require('../src/models/ticket');

describe('XML Import', () => {
  beforeEach(() => {
    Ticket.clear();
  });

  // Test 1: Import valid XML
  test('should import valid XML file', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST-001</customer_id>
    <customer_email>test1@example.com</customer_email>
    <customer_name>User One</customer_name>
    <subject>Issue One</subject>
    <description>This is the first issue description with enough content.</description>
  </ticket>
  <ticket>
    <customer_id>CUST-002</customer_id>
    <customer_email>test2@example.com</customer_email>
    <customer_name>User Two</customer_name>
    <subject>Issue Two</subject>
    <description>This is the second issue description with enough content.</description>
  </ticket>
</tickets>`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/xml')
      .send(xmlContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.total).toBe(2);
    expect(res.body.summary.successful).toBe(2);
    expect(res.body.summary.failed).toBe(0);
  });

  // Test 2: Import XML with invalid email
  test('should handle XML with invalid email', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST-001</customer_id>
    <customer_email>test1@example.com</customer_email>
    <customer_name>User One</customer_name>
    <subject>Issue One</subject>
    <description>This is the first issue description with enough content.</description>
  </ticket>
  <ticket>
    <customer_id>CUST-002</customer_id>
    <customer_email>invalid-email</customer_email>
    <customer_name>User Two</customer_name>
    <subject>Issue Two</subject>
    <description>This is the second issue description with enough content.</description>
  </ticket>
</tickets>`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/xml')
      .send(xmlContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.successful).toBe(1);
    expect(res.body.summary.failed).toBe(1);
  });

  // Test 3: Import malformed XML
  test('should handle malformed XML', async () => {
    const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST-001</customer_id>
    <!-- missing closing tag -->
  </tickets>`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/xml')
      .send(malformedXml);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Test 4: Import XML with missing required fields
  test('should fail for XML missing required fields', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST-001</customer_id>
    <customer_name>User One</customer_name>
    <subject>Issue One</subject>
    <description>This is the first issue description with enough content.</description>
  </ticket>
</tickets>`;

    const res = await request(app)
      .post('/tickets/import')
      .set('content-type', 'application/xml')
      .send(xmlContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.summary.failed).toBe(1);
  });

  // Test 5: Import XML with auto-classification disabled
  test('should import XML without auto-classification', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST-001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>User One</customer_name>
    <subject>Can't login to account</subject>
    <description>I cannot access my account. This is a critical issue for me.</description>
  </ticket>
</tickets>`;

    const res = await request(app)
      .post('/tickets/import?autoClassify=false')
      .set('content-type', 'application/xml')
      .send(xmlContent);

    expect(res.statusCode).toBe(201);
    expect(res.body.tickets[0].category).toBe('other');
  });
});

