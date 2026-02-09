# 📚 API Reference

Complete REST API documentation for the Intelligent Customer Support System.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication. In production, implement JWT or OAuth2.

## Common Response Format

### Success Response (2xx)
```json
{
  "id": "uuid",
  "customer_id": "string",
  "customer_email": "email@example.com",
  "customer_name": "string",
  "subject": "string",
  "description": "string",
  "category": "string",
  "priority": "string",
  "status": "string",
  "created_at": "ISO-8601 datetime",
  "updated_at": "ISO-8601 datetime",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["array"],
  "metadata": {
    "source": "string",
    "browser": "string",
    "device_type": "string"
  },
  "classification": {
    "category": "string",
    "priority": "string",
    "category_confidence": 0.95,
    "priority_confidence": 0.85,
    "overall_confidence": 0.90,
    "classified_at": "ISO-8601 datetime",
    "manual_override": false,
    "reasoning": {
      "category_reasoning": "string",
      "priority_reasoning": "string"
    },
    "keywords_found": ["array"]
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation message"
    }
  ]
}
```

## Endpoints

### 1. CREATE TICKET
Creates a new support ticket.

**Request**
```
POST /tickets?autoClassify=true
Content-Type: application/json
```

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `autoClassify` | boolean | true | Whether to auto-classify the ticket |

**Request Body**
```json
{
  "customer_id": "CUST-001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I've been locked out of my account after 3 failed login attempts. Password reset not working.",
  "status": "new",
  "tags": ["urgent", "account"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  }
}
```

**cURL Example**
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST-001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to my account",
    "description": "I have been locked out of my account",
    "status": "new"
  }'
```

**Response** (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST-001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I have been locked out of my account",
  "category": "account_access",
  "priority": "urgent",
  "status": "new",
  "created_at": "2026-02-09T14:32:18.373Z",
  "updated_at": "2026-02-09T14:32:18.373Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["urgent", "account"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  },
  "classification": {
    "category": "account_access",
    "priority": "urgent",
    "category_confidence": 0.98,
    "priority_confidence": 0.95,
    "overall_confidence": 0.96,
    "classified_at": "2026-02-09T14:32:18.373Z",
    "manual_override": false,
    "reasoning": {
      "category_reasoning": "Matched 3 keyword(s) for account_access",
      "priority_reasoning": "Found urgent/important keywords indicating urgent priority"
    },
    "keywords_found": ["login", "locked out", "password"]
  }
}
```

**Error Response** (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "customer_email",
      "message": "Invalid email format"
    }
  ]
}
```

---

### 2. GET ALL TICKETS
List all tickets with optional filtering and pagination.

**Request**
```
GET /tickets?category=account_access&priority=urgent&page=1&limit=20&search=login
```

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | (none) | Filter by category |
| `priority` | string | (none) | Filter by priority |
| `status` | string | (none) | Filter by status |
| `customer_id` | string | (none) | Filter by customer ID |
| `search` | string | (none) | Search in subject/description/customer name |
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Records per page (1-100) |

**cURL Example**
```bash
curl -X GET "http://localhost:3000/tickets?category=bug_report&priority=high&limit=10"
```

**Response** (200 OK)
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_id": "CUST-001",
      "customer_email": "john@example.com",
      "customer_name": "John Doe",
      "subject": "App crashes on startup",
      "description": "My app keeps crashing immediately after launch",
      "category": "bug_report",
      "priority": "high",
      "status": "new",
      "created_at": "2026-02-09T14:32:18.373Z",
      "updated_at": "2026-02-09T14:32:18.373Z",
      "resolved_at": null,
      "assigned_to": null,
      "tags": [],
      "metadata": {
        "source": "api",
        "browser": null,
        "device_type": null
      },
      "classification": {
        "category": "bug_report",
        "priority": "high",
        "category_confidence": 0.95,
        "priority_confidence": 0.85,
        "overall_confidence": 0.90,
        "classified_at": "2026-02-09T14:32:18.373Z",
        "manual_override": false,
        "reasoning": {
          "category_reasoning": "Matched 4 keyword(s) for bug_report",
          "priority_reasoning": "Found urgent/important keywords"
        },
        "keywords_found": ["crash", "bug", "issue"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 3. GET TICKET BY ID
Retrieve a specific ticket by its ID.

**Request**
```
GET /tickets/:id
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Ticket UUID |

**cURL Example**
```bash
curl -X GET http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST-001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I have been locked out of my account",
  "category": "account_access",
  "priority": "urgent",
  "status": "new",
  "created_at": "2026-02-09T14:32:18.373Z",
  "updated_at": "2026-02-09T14:32:18.373Z",
  "resolved_at": null,
  "assigned_to": "support-agent-1",
  "tags": ["urgent", "account"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  },
  "classification": {
    "category": "account_access",
    "priority": "urgent",
    "category_confidence": 0.98,
    "priority_confidence": 0.95,
    "overall_confidence": 0.96,
    "classified_at": "2026-02-09T14:32:18.373Z",
    "manual_override": false,
    "reasoning": {
      "category_reasoning": "Matched 3 keyword(s) for account_access",
      "priority_reasoning": "Found urgent/important keywords indicating urgent priority"
    },
    "keywords_found": ["login", "locked out", "password"]
  }
}
```

**Error Response** (404 Not Found)
```json
{
  "error": "Ticket not found"
}
```

---

### 4. UPDATE TICKET
Update an existing ticket.

**Request**
```
PUT /tickets/:id
Content-Type: application/json
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Ticket UUID |

**Request Body** (partial update allowed)
```json
{
  "status": "in_progress",
  "assigned_to": "support-agent-1",
  "priority": "high"
}
```

**cURL Example**
```bash
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "support-agent-1"
  }'
```

**Response** (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST-001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I have been locked out of my account",
  "category": "account_access",
  "priority": "high",
  "status": "in_progress",
  "created_at": "2026-02-09T14:32:18.373Z",
  "updated_at": "2026-02-09T15:45:30.123Z",
  "resolved_at": null,
  "assigned_to": "support-agent-1",
  "tags": ["urgent", "account"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  },
  "classification": null
}
```

---

### 5. DELETE TICKET
Delete a specific ticket.

**Request**
```
DELETE /tickets/:id
```

**cURL Example**
```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

**Response** (204 No Content)
```
[Empty body]
```

**Error Response** (404 Not Found)
```json
{
  "error": "Ticket not found"
}
```

---

### 6. BULK IMPORT TICKETS
Import multiple tickets from CSV, JSON, or XML file.

**Request**
```
POST /tickets/import?autoClassify=true
Content-Type: text/csv
```

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `autoClassify` | boolean | true | Whether to auto-classify imported tickets |

**Supported Content Types**
- `text/csv` - CSV format
- `application/json` - JSON format
- `application/xml` - XML format

### 6.1 CSV Import
**cURL Example**
```bash
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: text/csv" \
  --data-binary @sample_tickets.csv
```

**CSV Format**
```csv
customer_id,customer_email,customer_name,subject,description,status
CUST-001,john@example.com,John Doe,Cannot login,Locked out of account,new
CUST-002,jane@example.com,Jane Smith,Payment failed,Credit card declined,new
```

### 6.2 JSON Import
**cURL Example**
```bash
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: application/json" \
  -d '[
    {
      "customer_id": "CUST-001",
      "customer_email": "john@example.com",
      "customer_name": "John Doe",
      "subject": "Cannot login",
      "description": "Locked out of account",
      "status": "new"
    }
  ]'
```

### 6.3 XML Import
**cURL Example**
```bash
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: application/xml" \
  --data-binary @sample_tickets.xml
```

**XML Format**
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

**Response** (201 Created)
```json
{
  "summary": {
    "total": 50,
    "successful": 48,
    "failed": 2
  },
  "tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_id": "CUST-001",
      "customer_email": "john@example.com",
      "customer_name": "John Doe",
      "subject": "Cannot login",
      "description": "Locked out of account",
      "category": "account_access",
      "priority": "urgent",
      "status": "new",
      "created_at": "2026-02-09T14:32:18.373Z",
      "updated_at": "2026-02-09T14:32:18.373Z",
      "resolved_at": null,
      "assigned_to": null,
      "tags": [],
      "metadata": {
        "source": "api",
        "browser": null,
        "device_type": null
      },
      "classification": {
        "category": "account_access",
        "priority": "urgent",
        "category_confidence": 0.98,
        "priority_confidence": 0.95,
        "overall_confidence": 0.96,
        "classified_at": "2026-02-09T14:32:18.373Z",
        "manual_override": false,
        "reasoning": {
          "category_reasoning": "Matched 3 keyword(s) for account_access",
          "priority_reasoning": "Found urgent/important keywords indicating urgent priority"
        },
        "keywords_found": ["login", "locked out"]
      }
    }
  ],
  "errors": [
    {
      "row": 3,
      "data": {...},
      "errors": ["Email is invalid"]
    }
  ]
}
```

---

### 7. AUTO-CLASSIFY TICKET
Manually trigger automatic classification for a ticket.

**Request**
```
POST /tickets/:id/auto-classify
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Ticket UUID |

**cURL Example**
```bash
curl -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

**Response** (200 OK)
```json
{
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "CUST-001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to my account",
    "description": "I have been locked out of my account",
    "category": "account_access",
    "priority": "urgent",
    "status": "new",
    "created_at": "2026-02-09T14:32:18.373Z",
    "updated_at": "2026-02-09T14:32:18.373Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": [],
    "metadata": {
      "source": "api",
      "browser": null,
      "device_type": null
    },
    "classification": {
      "category": "account_access",
      "priority": "urgent",
      "category_confidence": 0.98,
      "priority_confidence": 0.95,
      "overall_confidence": 0.96,
      "classified_at": "2026-02-09T14:32:18.373Z",
      "manual_override": false,
      "reasoning": {
        "category_reasoning": "Matched 3 keyword(s) for account_access",
        "priority_reasoning": "Found urgent/important keywords indicating urgent priority"
      },
      "keywords_found": ["login", "locked out", "password"]
    }
  },
  "classification": {
    "category": "account_access",
    "priority": "urgent",
    "category_confidence": 0.98,
    "priority_confidence": 0.95,
    "overall_confidence": 0.96,
    "classified_at": "2026-02-09T14:32:18.373Z",
    "manual_override": false,
    "reasoning": {
      "category_reasoning": "Matched 3 keyword(s) for account_access",
      "priority_reasoning": "Found urgent/important keywords indicating urgent priority"
    },
    "keywords_found": ["login", "locked out", "password"]
  }
}
```

---

## Data Validation Rules

### Ticket Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `customer_id` | string | Yes | Non-empty |
| `customer_email` | string | Yes | Valid email format |
| `customer_name` | string | Yes | Non-empty |
| `subject` | string | Yes | 1-200 characters |
| `description` | string | Yes | 10-2000 characters |
| `category` | enum | No | One of: account_access, technical_issue, billing_question, feature_request, bug_report, other |
| `priority` | enum | No | One of: urgent, high, medium, low |
| `status` | enum | No | One of: new, in_progress, waiting_customer, resolved, closed |
| `tags` | array | No | Array of strings |
| `metadata.source` | enum | No | One of: web_form, email, api, chat, phone |
| `metadata.device_type` | enum | No | One of: desktop, mobile, tablet |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| **200** | OK - Request successful |
| **201** | Created - Resource created successfully |
| **204** | No Content - Successful DELETE |
| **400** | Bad Request - Invalid input or validation error |
| **404** | Not Found - Resource not found |
| **500** | Internal Server Error - Server error |

---

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per IP
- 10 bulk imports per hour per IP

---

## Best Practices

1. **Always validate email addresses** before sending tickets
2. **Use meaningful customer IDs** for tracking
3. **Include metadata** for better context analysis
4. **Use appropriate statuses** to track ticket lifecycle
5. **Leverage auto-classification** to reduce manual work
6. **Monitor confidence scores** to identify borderline classifications

---

## Examples by Use Case

### Use Case: Support Dashboard
```bash
# Get all urgent tickets in progress
curl -X GET "http://localhost:3000/tickets?priority=urgent&status=in_progress"
```

### Use Case: Batch Import from CRM
```bash
# Import tickets from CSV export
curl -X POST http://localhost:3000/tickets/import \
  -H "Content-Type: text/csv" \
  --data-binary @crm_export.csv
```

### Use Case: Find Similar Issues
```bash
# Search for tickets about login problems
curl -X GET "http://localhost:3000/tickets?search=login&category=account_access"
```

### Use Case: Escalation Process
```bash
# Update ticket to high priority and assign
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "high",
    "assigned_to": "senior-support-agent",
    "status": "in_progress"
  }'
```

---

**Last Updated**: February 2026

