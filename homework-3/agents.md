# AI Agent Guidelines for Virtual Card Management System

## Overview

This document defines how an AI coding partner (GitHub Copilot, Claude Code, etc.) should approach development of the Virtual Card Management System. It ensures consistency, security, and regulatory compliance across all generated code.

---

## Tech Stack Requirements

### Backend Framework
- **Language**: TypeScript 5.0+ (strict mode required)
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.18+ with async middleware
- **Package Manager**: npm or pnpm with package-lock.json

### Database & Storage
- **Primary Database**: PostgreSQL 15+ with pgcrypto extension
- **ORM**: Prisma 5+ for type-safe database access
- **Cache Layer**: Redis 7+ (ioredis for async operations)
- **File Storage**: AWS S3 or MinIO for compliance document retention

### Message Queue & Events
- **Queue System**: BullMQ 4+ (Redis-based) or AWS SQS
- **Worker Framework**: BullMQ workers or custom async processors
- **Event Publishing**: Use webhookService for all business events

### Testing & Quality
- **Unit Testing**: Jest 29+ with ts-jest
- **Integration Testing**: Jest with Supertest + PostgreSQL testcontainers
- **API Testing**: Supertest for HTTP endpoint testing
- **Code Quality**: ESLint + Prettier (formatting), TypeScript strict mode
- **Coverage**: Jest coverage with minimum 90% requirement

### Monitoring & Logging
- **Logging**: Winston for structured logging
- **Metrics**: prom-client for Prometheus integration
- **Tracing**: OpenTelemetry with Jaeger for distributed tracing
- **Alerting**: Prometheus Alertmanager for critical alerts

---

## Domain Rules - FinTech/Banking Specific

### 1. Monetary Value Handling

**RULE**: Never use native Number for money. Always use `decimal.js`.

```typescript
// CORRECT
import Decimal from 'decimal.js';

const spendingLimit = new Decimal('1000.00');  // 2 decimal places
const total = new Decimal('100.50').plus('50.25');

// WRONG - Never do this
const spendingLimit = 1000.00;  // native Number
const total = 100.50 + 50.25;
```

**RULE**: All monetary values must have exactly 2 decimal places.

```typescript
// CORRECT
const amount = new Decimal('99.99');
const price = new Decimal('0.01');

// WRONG
const amount = new Decimal('99.9');  // Only 1 decimal place
const price = new Decimal('1');  // No decimal places
```

### 2. Card Data Security

**RULE**: Never store, log, or transmit full Primary Account Number (PAN).

```typescript
// CORRECT - Store encrypted and masked
const cardNumberEncrypted = await encryptPii(fullPan);  // Stored encrypted
const cardLastFour = fullPan.slice(-4);  // Store only last 4 digits for display

// WRONG - Never log sensitive data
logger.info(`Processing card ${cardNumber}`);  // VIOLATION
await db.card.create({ data: { cardNumber } });  // VIOLATION - store plaintext
```

**RULE**: Use field-level encryption for sensitive data.

```sql
-- CORRECT - Use pgcrypto for database encryption
CREATE TABLE virtual_cards (
    id UUID PRIMARY KEY,
    card_number_encrypted bytea,  -- Encrypted with pgcrypto
    card_last_four VARCHAR(4),
    cvv_encrypted bytea  -- Never store CVV in plaintext
);
```

```typescript
// In Prisma schema
model VirtualCard {
  id                    String   @id @default(uuid())
  cardNumberEncrypted   Bytes    // Encrypted with pgcrypto
  cardLastFour          String   @db.VarChar(4)
  // CVV should never be stored, even encrypted
}
```

### 3. Authentication & Authorization

**RULE**: All endpoints require authentication. Use JWT + OAuth 2.0.

```typescript
// CORRECT - Every endpoint protected
router.get('/api/v1/cards/:cardId',
  authenticate,  // Required middleware
  async (req: AuthenticatedRequest, res: Response) => {
    const card = await cardService.getCard(req.params.cardId);

    // Verify user owns this card
    if (card.userId !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    return res.json(card);
  }
);

// WRONG - Unprotected endpoint
router.get('/api/v1/cards/:cardId', async (req, res) => {
  const card = await cardService.getCard(req.params.cardId);
  return res.json(card);
});
```

**RULE**: Implement role-based access control (RBAC).

```typescript
// CORRECT - Role-based access
router.get('/api/v1/compliance/reports',
  authenticate,
  requireRole('COMPLIANCE_OFFICER'),  // Role check
  async (req: AuthenticatedRequest, res: Response) => {
    const reports = await complianceService.getReports();
    return res.json(reports);
  }
);

// WRONG - No role checking
router.get('/api/v1/compliance/reports',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const reports = await complianceService.getReports();
    return res.json(reports);
  }
);
```

### 4. Audit Logging

**RULE**: Every card operation must create an immutable audit log entry.

```typescript
// CORRECT - Always log operations
async function freezeCard(cardId: string, user: User): Promise<CardResponse> {
  const card = await cardService.getCard(cardId);

  const updatedCard = await prisma.virtualCard.update({
    where: { id: cardId },
    data: { status: CardStatus.FROZEN }
  });

  // Create immutable audit log
  await auditLogService.create({
    action: 'card_freeze',
    userId: user.id,
    cardId: cardId,
    ipAddress: req.ip,
    reason: 'User initiated freeze'
  });

  return updatedCard;
}

// WRONG - No audit trail
async function freezeCard(cardId: string): Promise<CardResponse> {
  return prisma.virtualCard.update({
    where: { id: cardId },
    data: { status: CardStatus.FROZEN }
  });
}
```

**RULE**: Audit logs must never be deleted (soft delete only, with retention).

```typescript
// CORRECT - 7 year retention
interface CardAuditLog {
  id: string;
  action: string;
  userId?: string;
  cardId: string;
  createdAt: Date;
  retentionUntil: Date;  // 7 years from creation
  // No delete method - audit logs are permanent
}
```

### 5. State Machine Validation

**RULE**: All card status changes must follow defined state machine.

```typescript
// CORRECT - Validate transitions
const CARD_STATE_TRANSITIONS: Record<CardStatus, Set<CardStatus>> = {
  [CardStatus.ACTIVE]: new Set([CardStatus.FROZEN, CardStatus.CANCELLED]),
  [CardStatus.FROZEN]: new Set([CardStatus.ACTIVE, CardStatus.CANCELLED]),
  [CardStatus.CANCELLED]: new Set(),  // No transitions from CANCELLED
  [CardStatus.EXPIRED]: new Set(),  // No transitions from EXPIRED
};

async function updateCardStatus(
  card: VirtualCard,
  newStatus: CardStatus
): Promise<VirtualCard> {
  const allowedTransitions = CARD_STATE_TRANSITIONS[card.status];

  if (!allowedTransitions.has(newStatus)) {
    throw new ConflictError(
      `Cannot transition from ${card.status} to ${newStatus}`
    );
  }

  return prisma.virtualCard.update({
    where: { id: card.id },
    data: { status: newStatus }
  });
}

// WRONG - No validation
async function updateCardStatus(
  card: VirtualCard,
  newStatus: CardStatus
): Promise<VirtualCard> {
  return prisma.virtualCard.update({
    where: { id: card.id },
    data: { status: newStatus }  // Allow any transition
  });
}
```

### 6. Fraud Detection Standards

**RULE**: Implement real-time fraud detection for all transactions.

```typescript
// CORRECT - Fraud checks before authorization
async function authorizeTransaction(
  request: TransactionAuthRequest
): Promise<AuthorizationResponse> {
  const card = await cardService.getCard(request.cardId);

  // Check fraud score
  const fraudScore = await fraudDetectionService.evaluate({
    card,
    amount: request.amount,
    merchant: request.merchant,
    ipAddress: request.ipAddress
  });

  if (fraudScore >= 70) {
    // Auto-freeze card
    await prisma.virtualCard.update({
      where: { id: card.id },
      data: { status: CardStatus.FROZEN }
    });

    return { decision: 'DECLINE', reason: 'Fraud detected' };
  }

  // Continue with authorization
  return { decision: 'APPROVE' };
}

// WRONG - No fraud detection
async function authorizeTransaction(
  request: TransactionAuthRequest
): Promise<AuthorizationResponse> {
  const card = await cardService.getCard(request.cardId);

  if (request.amount.lte(card.spendingLimit)) {
    return { decision: 'APPROVE' };
  }
  return { decision: 'DECLINE' };
}
```

### 7. Rate Limiting

**RULE**: Implement rate limiting on all sensitive endpoints.

```typescript
// CORRECT - Rate limiting
import rateLimit from 'express-rate-limit';

const cardCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,  // 5 requests per hour
  keyGenerator: (req) => req.user.id,  // Per user
  message: 'Too many card creation requests'
});

router.post('/api/v1/cards',
  authenticate,
  cardCreationLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const card = await cardService.createCard(req.body, req.user);
    return res.status(201).json(card);
  }
);

// WRONG - No rate limiting
router.post('/api/v1/cards',
  async (req: Request, res: Response) => {
    const card = await cardService.createCard(req.body);
    return res.status(201).json(card);
  }
);
```

---

## Code Style & Patterns

### File Organization

```
src/
├── routes/
│   ├── index.ts
│   ├── cards.ts
│   ├── transactions.ts
│   ├── cardLimits.ts
│   ├── fraudAlerts.ts
│   ├── compliance.ts
│   └── webhooks.ts
├── schemas/
│   ├── cardSchemas.ts
│   ├── transactionSchemas.ts
│   └── complianceSchemas.ts
├── types/
│   ├── index.ts
│   ├── card.ts
│   ├── transaction.ts
│   ├── fraudAlert.ts
│   └── auditLog.ts
├── services/
│   ├── cardService.ts
│   ├── authorizationService.ts
│   ├── fraudDetectionService.ts
│   ├── webhookService.ts
│   ├── complianceService.ts
│   └── encryptionService.ts
├── workers/
│   ├── webhookWorker.ts
│   └── complianceReporter.ts
├── middleware/
│   ├── authenticate.ts
│   ├── requireRole.ts
│   ├── errorHandler.ts
│   └── rateLimiter.ts
├── utils/
│   ├── validators.ts
│   └── constants.ts
├── prisma/
│   └── schema.prisma
└── config.ts
```

### Naming Conventions

- **Classes/Interfaces**: PascalCase (e.g., `VirtualCard`, `CardService`)
- **Functions/Methods**: camelCase (e.g., `createCard`, `validateAmount`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SPENDING_LIMIT`, `RETRY_ATTEMPTS`)
- **Database Tables**: snake_case (e.g., `virtual_cards`, `card_audit_log`)
- **API Endpoints**: kebab-case with params (e.g., `/api/v1/cards/:cardId/freeze`)
- **Enums**: PascalCase (e.g., `CardStatus.ACTIVE`)

### Error Handling

```typescript
// CORRECT - Explicit error handling
async function getCard(cardId: string, user: User): Promise<CardResponse> {
  try {
    const card = await cardService.getCard(cardId);

    if (card.userId !== user.id) {
      throw new ForbiddenError('Access denied');
    }

    return card;
  } catch (error) {
    if (error instanceof CardNotFoundError) {
      throw new NotFoundError('Card not found');
    }

    logger.error('Unexpected error', { error, cardId });
    throw new InternalServerError('Internal server error');
  }
}

// WRONG - Silent failures
async function getCard(cardId: string): Promise<CardResponse> {
  return cardService.getCard(cardId);  // No error handling
}
```

---

## Testing Standards

### Unit Test Coverage Minimum: 90%

```typescript
// CORRECT - Comprehensive unit tests
describe('CardService.createCard', () => {
  it('should create card with valid data', async () => {
    // Arrange
    const user = createTestUser();
    const request: CardCreateRequest = {
      spendingLimitDaily: new Decimal('1000.00'),
      spendingLimitMonthly: new Decimal('10000.00'),
      currency: 'USD'
    };

    // Act
    const card = await cardService.createCard(request, user);

    // Assert
    expect(card.id).toBeDefined();
    expect(card.userId).toBe(user.id);
    expect(card.status).toBe(CardStatus.ACTIVE);
    expect(card.spendingLimitDaily.toString()).toBe('1000.00');
  });

  it('should reject when daily limit exceeds monthly', async () => {
    // Arrange
    const user = createTestUser();
    const request: CardCreateRequest = {
      spendingLimitDaily: new Decimal('50000.00'),
      spendingLimitMonthly: new Decimal('1000.00'),  // Invalid
      currency: 'USD'
    };

    // Act & Assert
    await expect(cardService.createCard(request, user))
      .rejects.toThrow(ValidationError);
  });
});
```

### Integration Tests Required

```typescript
describe('Card Lifecycle', () => {
  it('should complete full lifecycle: create -> freeze -> unfreeze -> cancel', async () => {
    const user = await createTestUser();

    // Create card
    let card = await cardService.createCard(createCardRequest(), user);
    expect(card.status).toBe(CardStatus.ACTIVE);

    // Freeze card
    card = await cardService.freezeCard(card.id, user);
    expect(card.status).toBe(CardStatus.FROZEN);

    // Unfreeze card
    card = await cardService.unfreezeCard(card.id, user);
    expect(card.status).toBe(CardStatus.ACTIVE);

    // Cancel card
    card = await cardService.cancelCard(card.id, user);
    expect(card.status).toBe(CardStatus.CANCELLED);
  });
});
```

---

## Security & Compliance Constraints

### Security Checklist

- [ ] No sensitive data in logs (PAN, CVV, SSN)
- [ ] All endpoints require authentication
- [ ] All data endpoints require HTTPS (TLS 1.3)
- [ ] CORS enabled only for known domains
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] CSRF protection on state-changing endpoints
- [ ] Input validation on all endpoints (Zod)
- [ ] Output encoding for XSS prevention
- [ ] Secrets never committed to git
- [ ] Database connections encrypted (SSL)

### PCI-DSS Compliance Checklist

- [ ] No full PAN stored in plaintext
- [ ] Encrypt cardholder data at rest (AES-256)
- [ ] Encrypt data in transit (TLS 1.3)
- [ ] Audit trail for all card operations
- [ ] Access control (role-based)
- [ ] Regular security testing (penetration tests)
- [ ] Vulnerability scanning automated
- [ ] Incident response plan documented
- [ ] Annual compliance certification

### GDPR Compliance Checklist

- [ ] Right to access: data export endpoint implemented
- [ ] Right to deletion: hard delete after retention period
- [ ] Data minimization: only store necessary data
- [ ] Purpose limitation: clear use cases defined
- [ ] Consent management: opt-in for marketing
- [ ] Data retention policy: documented and enforced
- [ ] Privacy notice: available to users

---

## Performance Standards

### Latency Targets

- Card creation: < 200ms (p99)
- Card freeze/unfreeze: < 100ms (p99)
- Transaction authorization: < 100ms (p95)
- List transactions: < 500ms (p99) for 1000 records
- Fraud detection check: < 50ms (p95)

### Throughput Targets

- Support 10,000+ card operations per second
- Support 100,000+ transaction queries per second
- Webhook delivery: < 5 minute latency

### Database Optimization

```typescript
// CORRECT - Proper indexing in Prisma
model VirtualCard {
  id        String     @id @default(uuid())
  userId    String
  status    CardStatus
  createdAt DateTime   @default(now())

  @@index([userId, status])
  @@index([createdAt])
}
```

---

## Documentation Standards

### JSDoc Format

```typescript
// CORRECT - Detailed JSDoc
/**
 * Create a new virtual card for the authenticated user.
 *
 * This endpoint initiates card issuance through the payment processor,
 * encrypts sensitive card data, and creates an audit log entry.
 *
 * @param cardRequest - Card creation parameters including spending limits
 * @param currentUser - Authenticated user making the request
 * @returns Created card with masked card number (last 4 digits only)
 * @throws {ValidationError} If spending limits are invalid
 * @throws {KYCNotVerifiedError} If user's KYC verification is incomplete
 * @throws {RateLimitError} If user exceeds card creation rate limit
 *
 * @security Requires authenticated user
 * @security Card creation rate limited to 5/hour per user
 * @security Audit logged with user IP and timestamp
 *
 * @compliance PCI-DSS: Card number encrypted before storage
 * @compliance GDPR: Card linked to user consent record
 */
async function createCard(
  cardRequest: CardCreateRequest,
  currentUser: User
): Promise<CardResponse> {
  // Implementation
}
```

---

## Deployment & DevOps

### Environment Variables Required

```bash
# Node.js
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cardservice

# Redis
REDIS_URL=redis://localhost:6379/0

# Payment Processor
PAYMENT_PROCESSOR_API_KEY=sk_test_...
PAYMENT_PROCESSOR_SECRET=...

# Encryption
ENCRYPTION_KEY_ID=arn:aws:kms:us-east-1:...
ENCRYPTION_ALGORITHM=AES-256

# JWT
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY=file:///secrets/jwt_private_key
JWT_PUBLIC_KEY=file:///secrets/jwt_public_key

# Sentry (Error Tracking)
SENTRY_DSN=https://...

# Feature Flags
FRAUD_DETECTION_ENABLED=true
WEBHOOK_EVENTS_ENABLED=true
```

---

**Last Updated**: February 2026
**Version**: 1.0
**Language**: TypeScript 5.0+ with Node.js 18+
