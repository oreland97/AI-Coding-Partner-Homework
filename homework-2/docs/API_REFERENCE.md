# 📚 API Reference

Complete REST API documentation for the Intelligent Customer Support System.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication required. For production, implement JWT or OAuth2.

## Common Response Format

### Success Response
```json
{
  "id": "uuid",
  "customer_id": "string",
  "customer_email": "email@example.com",
  "customer_name": "string",
  "subject": "string",
  "description": "string",
  "category": "account_access | technical_issue | billing_question | feature_request | bug_report | other",
  "priority": "urgent | high | medium | low",
  "status": "new | in_progress | waiting_customer | resolved | closed",
  "created_at": "ISO-8601 datetime",
  "updated_at": "ISO-8601 datetime",
  "classification": {
    "category": "string",
    "priority": "string",
    "category_confidence": 0.95,
    "priority_confidence": 0.85,
    "overall_confidence": 0.90,
    "reasoning": { "category_reasoning": "...", "priority_reasoning": "..." },
    "keywords_found": ["array"]
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [{ "field": "fieldName", "message": "Validation message" }]
}
```

## Endpoints

### 1. Create Ticket

```http
POST /tickets?autoClassify=true
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": "CUST-001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I've been locked out after 3 failed login attempts",
  "status": "new",
  "tags": ["urgent"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  }
}
```

**Response:** `201 Created` - Returns created ticket with auto-classification

**cURL:**
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST-001","customer_email":"john@example.com","customer_name":"John Doe","subject":"Cannot login","description":"Locked out of account","status":"new"}'
```

---

### 2. Get All Tickets

```http
GET /tickets?category=account_access&priority=urgent&page=1&limit=20&search=login
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category |
| `priority` | string | - | Filter by priority |
| `status` | string | - | Filter by status |
| `customer_id` | string | - | Filter by customer |
| `search` | string | - | Search in subject/description/name |
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Records per page (1-100) |

**Response:** `200 OK`
```json
{
  "data": [/* array of tickets */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/tickets?category=bug_report&priority=high&limit=10"
```

---

### 3. Get Ticket by ID

```http
GET /tickets/:id
```

**Response:** `200 OK` - Returns single ticket  
**Error:** `404 Not Found`

**cURL:**
```bash
curl -X GET http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. Update Ticket

```http
PUT /tickets/:id
Content-Type: application/json
```

**Request Body** (partial update allowed):
```json
{
  "status": "in_progress",
  "assigned_to": "support-agent-1",
  "priority": "high"
}
```

**Response:** `200 OK` - Returns updated ticket

**cURL:**
```bash
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","assigned_to":"support-agent-1"}'
```

---

### 5. Delete Ticket

```http
DELETE /tickets/:id
```

**Response:** `204 No Content`  
**Error:** `404 Not Found`

**cURL:**
```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### 6. Bulk Import Tickets

```http
POST /tickets/import?autoClassify=true
Content-Type: text/csv | application/json | application/xml
```

**Supported Formats:**
- **CSV** - `Content-Type: text/csv`
- **JSON** - `Content-Type: application/json`
- **XML** - `Content-Type: application/xml`

**CSV Format:**
```csv
customer_id,customer_email,customer_name,subject,description,status
CUST-001,john@example.com,John Doe,Cannot login,Locked out,new
CUST-002,jane@example.com,Jane Smith,Payment failed,Card declined,new
```

**JSON Format:**
```json
[
  {
    "customer_id": "CUST-001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login",
    "description": "Locked out of account",
    "status": "new"
  }
]
```

**XML Format:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST-001</customer_id>
    <customer_email>john@example.com</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Cannot login</subject>
    <description>Locked out of account</description>
    <status>new</status>
  </ticket>
</tickets>
```

**Response:** `201 Created`
```json
{
  "summary": {
    "total": 50,
    "successful": 48,
    "failed": 2
  },
  "tickets": [/* array of created tickets */],
  "errors": [
    {
      "row": 3,
      "data": {...},
      "errors": ["Email is invalid"]
    }
  ]
}
```

**cURL Examples:**
```bash
# CSV Import
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: text/csv" \
  --data-binary @sample_tickets.csv

# JSON Import
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: application/json" \
  -d @sample_tickets.json

# XML Import
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: application/xml" \
  --data-binary @sample_tickets.xml
```

---

### 7. Auto-Classify Ticket

```http
POST /tickets/:id/auto-classify
```

Manually trigger automatic classification for an existing ticket.

**Response:** `200 OK` - Returns ticket with updated classification

**cURL:**
```bash
curl -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

---

## Data Validation Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `customer_id` | string | ✅ | Non-empty |
| `customer_email` | string | ✅ | Valid email format |
| `customer_name` | string | ✅ | Non-empty |
| `subject` | string | ✅ | 1-200 characters |
| `description` | string | ✅ | 10-2000 characters |
| `category` | enum | ❌ | account_access \| technical_issue \| billing_question \| feature_request \| bug_report \| other |
| `priority` | enum | ❌ | urgent \| high \| medium \| low |
| `status` | enum | ❌ | new \| in_progress \| waiting_customer \| resolved \| closed |
| `tags` | array | ❌ | Array of strings |
| `metadata.source` | enum | ❌ | web_form \| email \| api \| chat \| phone |
| `metadata.device_type` | enum | ❌ | desktop \| mobile \| tablet |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK - Request successful |
| `201` | Created - Resource created |
| `204` | No Content - Successful DELETE |
| `400` | Bad Request - Validation error |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error |

---

## Classification System

**Categories:**
- `account_access` - Login, password, 2FA issues
- `technical_issue` - Bugs, errors, crashes
- `billing_question` - Payments, invoices, refunds
- `feature_request` - Enhancement suggestions
- `bug_report` - Defects with reproduction steps
- `other` - Uncategorizable issues

**Priorities:**
- `urgent` - Production issues, security concerns
- `high` - Blocking issues, time-sensitive
- `medium` - Standard issues (default)
- `low` - Minor issues, suggestions

Each classification includes confidence score (0-1) and reasoning.

---

## Examples by Use Case

### Support Dashboard
```bash
# Get all urgent tickets in progress
curl -X GET "http://localhost:3000/tickets?priority=urgent&status=in_progress"
```

### Batch Import from CRM
```bash
# Import tickets from CSV export
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: text/csv" \
  --data-binary @crm_export.csv
```

### Find Similar Issues
```bash
# Search for login problems
curl -X GET "http://localhost:3000/tickets?search=login&category=account_access"
```

### Escalation Process
```bash
# Update priority and assign
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"priority":"high","assigned_to":"senior-agent","status":"in_progress"}'
```

---

## Best Practices

1. ✅ Always validate email addresses before creating tickets
2. ✅ Use meaningful customer IDs for tracking
3. ✅ Include metadata for better context analysis
4. ✅ Leverage auto-classification to reduce manual work
5. ✅ Monitor confidence scores for borderline classifications
6. ✅ Use appropriate statuses to track ticket lifecycle

---

## Rate Limiting (Production Recommendation)

- 100 requests per minute per IP
- 10 bulk imports per hour per IP

---

**Last Updated**: February 2026

