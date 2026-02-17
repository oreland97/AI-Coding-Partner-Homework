# Virtual Card Management System Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

Build a secure, compliant virtual card management system that enables users to create, configure, and monitor virtual payment cards with real-time spending controls, fraud detection, and comprehensive audit trails for regulatory compliance.

---

## Mid-Level Objectives

1. **Regulatory Compliance & Data Protection**
   - Implement PCI-DSS Level 1 compliant card data handling
   - Ensure GDPR and CCPA compliance for user data processing
   - Maintain SOC 2 Type II audit trail requirements
   - Support customer data export and deletion (Right to be Forgotten)

2. **Security & Encryption**
   - Encrypt all card data at rest using AES-256
   - Use TLS 1.3 for all data in transit
   - Implement field-level encryption for PAN (Primary Account Number)
   - Secure key management with HSM or cloud KMS integration
   - Implement rate limiting and fraud detection mechanisms

3. **Audit & Logging**
   - Log all card operations with immutable audit trail
   - Track every card state change with user context
   - Implement real-time monitoring and alerting
   - Maintain audit logs for minimum 7 years (regulatory requirement)
   - Generate compliance reports on demand

4. **Performance & Scalability**
   - Support 10,000+ card operations per second
   - Card creation latency < 200ms (p99)
   - Transaction authorization < 100ms (p95)
   - Horizontal scalability for multi-region deployment
   - Cache frequently accessed card metadata

5. **Integration & API Design**
   - RESTful API with OpenAPI 3.0 specification
   - Webhook support for real-time event notifications
   - Idempotent operations with request deduplication
   - Backward-compatible API versioning
   - Support for batch operations

---

## Implementation Notes

### Technology Stack
- **Backend**: Python 3.11+ with FastAPI framework
- **Database**: PostgreSQL 15+ with pgcrypto extension
- **Cache**: Redis 7+ for session and metadata caching
- **Message Queue**: RabbitMQ or AWS SQS for async processing
- **Monitoring**: Prometheus + Grafana for metrics
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### Data Handling Standards
- **Monetary Values**: Use `Decimal` type with 2 decimal precision (never float)
- **Currency Codes**: ISO 4217 standard (USD, EUR, GBP, etc.)
- **Timestamps**: UTC timezone, ISO 8601 format
- **Card Numbers**: Store only last 4 digits + token reference
- **Sensitive Data**: Never log PAN, CVV, or full card numbers

### Security Requirements
- **Authentication**: OAuth 2.0 + JWT with RSA-256 signing
- **Authorization**: Role-based access control (RBAC) with least privilege
- **API Rate Limiting**: 100 requests/minute per user, 1000/minute per organization
- **Input Validation**: Strict schema validation with Pydantic models
- **SQL Injection Prevention**: Use parameterized queries exclusively
- **Secrets Management**: Store in AWS Secrets Manager or HashiCorp Vault

### Compliance Constraints
- **PCI-DSS**: Card data must never be stored in plaintext
- **GDPR**: Implement consent management and data portability
- **AML/KYC**: Integrate identity verification before card issuance
- **Transaction Monitoring**: Flag suspicious patterns (velocity checks, geographic anomalies)
- **Audit Trail**: Every operation must log: who, what, when, where, why

### Testing Standards
- **Unit Test Coverage**: Minimum 90%
- **Integration Tests**: All API endpoints with real database
- **Security Tests**: OWASP Top 10 vulnerability scanning
- **Performance Tests**: Load testing with 10k concurrent users
- **Compliance Tests**: Automated PCI-DSS requirement validation

---

## Context

### Beginning Context

**Existing Infrastructure:**
- PostgreSQL database cluster (primary + replicas)
- Redis cluster for caching
- Authentication service (OAuth 2.0 provider)
- User management system with KYC verification
- Payment processor integration (Stripe/Marqeta)
- Logging infrastructure (ELK stack)
- Monitoring tools (Prometheus, Grafana)

**Available Resources:**
- User profiles with verified identities
- Payment processor API credentials
- Card BIN ranges allocated to the platform
- Encryption keys in KMS
- API gateway with rate limiting

**Current System State:**
- Users can create accounts and verify identity
- Basic transaction processing exists
- No virtual card functionality yet
- Audit framework is in place but not used for cards

### Ending Context

**New Components:**
- Virtual card service API
- Card lifecycle management engine
- Transaction authorization service
- Fraud detection rules engine
- Webhook event notification system
- Admin dashboard for card operations
- Compliance reporting module

**Updated Data Models:**
- `virtual_cards` table with encrypted card data
- `card_transactions` table for transaction history
- `card_limits` table for spending controls
- `card_audit_log` table for compliance
- `fraud_alerts` table for suspicious activity

**Integration Points:**
- Payment processor for card issuance
- Card network (Visa/Mastercard) integration
- Fraud detection service hooks
- Real-time notification service
- Compliance reporting service

**Deliverables:**
- Complete REST API documentation (OpenAPI spec)
- Database migration scripts
- Security documentation (threat model, pen test results)
- Compliance documentation (PCI-DSS attestation)
- Operations runbook
- User and admin guides

---

## Low-Level Tasks

### 1. Database Schema Design

**What prompt would you run to complete this task?**
```
Create PostgreSQL database schema for virtual card management with tables:
virtual_cards, card_transactions, card_limits, card_audit_log, fraud_alerts.
Use pgcrypto for field-level encryption. Follow PCI-DSS: never store full PAN or CVV.
Add indexes for performance, foreign keys for integrity, triggers for audit logging.
```

**What file do you want to CREATE or UPDATE?**
- `src/database/migrations/001_create_virtual_cards_schema.sql`
- `src/models/card.py`

**What function do you want to CREATE or UPDATE?**
- `VirtualCard` model class
- `CardTransaction` model class
- `CardLimit` model class
- `CardAuditLog` model class

**What are details you want to add to drive the code changes?**
- Use UUID for primary keys
- Encrypt `card_number_encrypted` field using pgcrypto
- Store only last 4 digits in `card_last_four`
- Add `card_status` enum: ACTIVE, FROZEN, CANCELLED, EXPIRED
- Include `spending_limit_daily`, `spending_limit_monthly` as Decimal(12,2)
- Add merchant_category fields as JSONB
- Include audit trigger for state changes

---

### 2. Card Creation API Endpoint

**What prompt would you run to complete this task?**
```
Create FastAPI POST endpoint /api/v1/cards that creates virtual cards.
Workflow: Validate auth & KYC -> Check card limit -> Validate limits ->
Call processor API -> Encrypt & store card -> Create audit log -> Trigger webhook.
Include idempotency, comprehensive validation, rate limiting.
```

**What file do you want to CREATE or UPDATE?**
- `src/api/v1/endpoints/cards.py`
- `src/services/card_service.py`
- `src/schemas/card_schemas.py`

**What function do you want to CREATE or UPDATE?**
- `create_virtual_card()` endpoint
- `CardService.issue_card()` business logic
- `CardCreateRequest` and `CardResponse` Pydantic schemas

**What are details you want to add to drive the code changes?**
- Validate spending limits (daily >= 1.00, <= 50000.00)
- Validate ISO 4217 currency
- Check user KYC status (VERIFIED required)
- Generate idempotency key from headers
- Call payment processor with retry logic (max 3 attempts)
- Encrypt PAN before database insert
- Rate limit: max 5 card creations per hour per user

---

### 3. Card Freeze/Unfreeze Functionality

**What prompt would you run to complete this task?**
```
Create endpoints for freezing/unfreezing virtual cards:
POST /api/v1/cards/{card_id}/freeze
POST /api/v1/cards/{card_id}/unfreeze
Implement state machine: ACTIVE <-> FROZEN (CANCELLED, EXPIRED not allowed).
Include authorization, audit logging, webhook events, processor sync.
```

**What file do you want to CREATE or UPDATE?**
- `src/api/v1/endpoints/cards.py`
- `src/services/card_service.py`

**What function do you want to CREATE or UPDATE?**
- `freeze_card()` endpoint
- `unfreeze_card()` endpoint
- `CardService.update_card_status()` business logic

**What are details you want to add to drive the code changes?**
- Verify card ownership (prevent unauthorized access)
- Validate state machine transitions
- Call payment processor API to sync
- Handle concurrent updates with optimistic locking
- Return 409 Conflict if already in target state

---

### 4. Transaction Authorization Hook

**What prompt would you run to complete this task?**
```
Create webhook endpoint for real-time transaction authorization:
POST /api/v1/webhooks/authorize-transaction
Check: card status (ACTIVE), spending limits (daily/monthly/per-tx),
merchant restrictions, fraud detection rules.
Response: APPROVE or DECLINE within 100ms in <50ms target.
```

**What file do you want to CREATE or UPDATE?**
- `src/api/v1/webhooks/authorization.py`
- `src/services/authorization_service.py`
- `src/services/fraud_detection_service.py`

**What function do you want to CREATE or UPDATE?**
- `authorize_transaction()` webhook endpoint
- `AuthorizationService.evaluate()` business logic
- `FraudDetectionService.check_transaction()` fraud rules

**What are details you want to add to drive the code changes?**
- Verify webhook signature using HMAC-SHA256
- Fetch card details from Redis cache (fallback to database)
- Check card status == ACTIVE
- Validate amount <= per_transaction_limit
- Calculate daily/monthly spend and check limits
- Check merchant_category against whitelist/blacklist
- Run fraud rules: velocity check (max 5 tx/hour), geographic anomaly
- Cache authorization decisions for 5 minutes

---

### 5. Spending Limits Management

**What prompt would you run to complete this task?**
```
Create CRUD endpoints for card spending limits:
GET /api/v1/cards/{card_id}/limits
PUT /api/v1/cards/{card_id}/limits
Allow setting: daily, monthly, per-transaction limits + merchant restrictions.
Include validation, audit logging, real-time enforcement, processor sync.
```

**What file do you want to CREATE or UPDATE?**
- `src/api/v1/endpoints/card_limits.py`
- `src/services/card_service.py`

**What function do you want to CREATE or UPDATE?**
- `get_card_limits()` endpoint
- `update_card_limits()` endpoint
- `CardService.update_limits()` business logic

**What are details you want to add to drive the code changes?**
- Validate limits positive with 2 decimal places
- Validate daily_limit <= monthly_limit
- Validate per_transaction_limit <= daily_limit
- Update atomically (database transaction)
- Invalidate Redis cache for card metadata
- Create audit log with old/new values
- Sync with payment processor

---

### 6. Transaction History API

**What prompt would you run to complete this task?**
```
Create GET endpoint /api/v1/cards/{card_id}/transactions for transaction history.
Support: date range filters, status filters, merchant category filters,
cursor-based pagination, sorting by transaction_date DESC.
Include merchant enrichment, optimize for large datasets (millions of transactions).
```

**What file do you want to CREATE or UPDATE?**
- `src/api/v1/endpoints/transactions.py`
- `src/services/transaction_service.py`

**What function do you want to CREATE or UPDATE?**
- `get_card_transactions()` endpoint
- `TransactionService.list_transactions()` business logic

**What are details you want to add to drive the code changes?**
- Use cursor-based pagination (keyset pagination)
- Default page size: 50, max: 200 transactions
- Filter by date range using indexed columns
- Include merchant details (name, category, location)
- Mask sensitive merchant data per PCI-DSS
- Return pagination metadata (next_cursor, has_more)
- Support CSV export (separate endpoint)
- Cache frequent queries in Redis (5 min TTL)

---

### 7. Card Cancellation & Deletion

**What prompt would you run to complete this task?**
```
Create endpoint DELETE /api/v1/cards/{card_id} for card cancellation.
Workflow: Verify authorization -> Check pending transactions ->
Update status to CANCELLED -> Sync with processor -> Audit log.
Support soft delete (status change) and hard delete (GDPR right to be forgotten).
```

**What file do you want to CREATE or UPDATE?**
- `src/api/v1/endpoints/cards.py`
- `src/services/card_service.py`
- `src/services/deletion_service.py`

**What function do you want to CREATE or UPDATE?**
- `cancel_card()` endpoint
- `CardService.cancel()` business logic
- `DeletionService.delete_user_data()` GDPR compliance

**What are details you want to add to drive the code changes?**
- Verify user owns the card
- Check for pending transactions (decline if exists)
- Update status to CANCELLED (soft delete)
- Call payment processor API
- For GDPR deletion: schedule async job after 90-day retention
- Keep audit logs permanently (regulatory requirement)

---

### 8. Fraud Detection & Alerts

**What prompt would you run to complete this task?**
```
Create fraud detection service monitoring transactions in real-time.
Implement rules: velocity check (max 10 tx/hour), amount anomaly (>3x average),
geographic anomaly, merchant category anomaly, duplicate transaction (5 min window).
Auto-freeze cards when fraud_score >= 70, generate alerts, trigger webhooks.
```

**What file do you want to CREATE or UPDATE?**
- `src/services/fraud_detection_service.py`
- `src/models/fraud_alert.py`
- `src/api/v1/endpoints/fraud_alerts.py`

**What function do you want to CREATE or UPDATE?**
- `FraudDetectionService.evaluate_transaction()` main fraud check
- `FraudDetectionService.calculate_risk_score()` scoring algorithm
- `get_fraud_alerts()` endpoint for user review

**What are details you want to add to drive the code changes?**
- Calculate fraud score as weighted sum (0-100 scale)
- Rule weights: velocity (20), amount anomaly (30), geographic (25), category (15), duplicate (10)
- Auto-freeze if fraud_score >= 70
- Create fraud_alert record with details and risk_score
- Send push notification to user
- Allow user to confirm fraud (keep frozen) or dispute (unfreeze)

---

### 9. Webhook Event System

**What prompt would you run to complete this task?**
```
Create webhook notification system for real-time events:
card.created, card.frozen, card.unfrozen, card.cancelled,
transaction.authorized, transaction.declined, card.limits_updated, card.fraud_detected.
Implement reliable delivery: retry with exponential backoff (max 5 retries),
HMAC-SHA256 signing, URL verification, subscription filtering.
```

**What file do you want to CREATE or UPDATE?**
- `src/services/webhook_service.py`
- `src/models/webhook_subscription.py`
- `src/api/v1/endpoints/webhooks.py`
- `src/workers/webhook_worker.py`

**What function do you want to CREATE or UPDATE?**
- `WebhookService.send_event()` main event sender
- `WebhookService.retry_failed()` retry logic
- `create_webhook_subscription()` endpoint
- `WebhookWorker.process_event_queue()` background worker

**What are details you want to add to drive the code changes?**
- Sign webhook: `HMAC-SHA256(secret, payload_json)`
- Retry schedule: 1 min, 5 min, 15 min, 1 hour, 6 hours
- Mark subscription inactive after 5 consecutive failures
- Rate limit: max 100 events/second per subscription

---

### 10. Compliance & Reporting

**What prompt would you run to complete this task?**
```
Create compliance reporting endpoints for auditors:
- Monthly transaction summary by card
- Card lifecycle report (created, frozen, cancelled)
- Fraud detection summary
- User data access log (GDPR)
- PCI-DSS compliance audit log
Export formats: CSV, JSON, PDF with digital signatures.
Require COMPLIANCE_OFFICER role, tamper-proof reports, 7-year retention.
```

**What file do you want to CREATE or UPDATE?**
- `src/routes/compliance.ts`
- `src/services/complianceService.ts`
- `src/services/reportGenerator.ts`

**What function do you want to CREATE or UPDATE?**
- `generateTransactionReport()` route handler
- `generateAuditLogExport()` route handler
- `ComplianceService.generatePciReport()` PCI-DSS
- `ReportGenerator.createPdf()` PDF generation (use PDFKit or Puppeteer)

**What are details you want to add to drive the code changes?**
- Require COMPLIANCE_OFFICER role for all endpoints
- Sign PDF reports with X.509 certificate (digital signature)
- Include report metadata (generation timestamp, report ID, data range)
- Mask sensitive data (only last 4 digits of card)
- Generate reports asynchronously for large datasets
- Store in S3 with 7-year retention
- Include data integrity hash (SHA-256) for tamper detection

---

## Success Criteria

Implementation is complete when an AI coding agent can:
1. Understand full scope of virtual card system
2. Implement each low-level task without ambiguity
3. Follow all security and compliance constraints
4. Generate code passing all validation rules
5. Produce system meeting regulatory requirements
6. Include comprehensive tests (>90% coverage)
7. Create proper documentation and OpenAPI specs

---

## Regulatory References

- **PCI-DSS v4.0**: Payment Card Industry Data Security Standard
- **GDPR Articles 15-22**: Data subject rights
- **CCPA Section 1798.100**: Consumer data access rights
- **SOC 2 Type II**: Audit trail and security controls
- **ISO 18245**: Merchant Category Codes (MCC)
- **ISO 4217**: Currency codes
- **FinCEN**: Anti-Money Laundering (AML) requirements

