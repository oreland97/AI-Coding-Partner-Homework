# GitHub Copilot Instructions for Virtual Card Management System

This file guides GitHub Copilot on code patterns, naming conventions, and best practices for the Virtual Card Management System.

---

## General Principles

- **Priority 1**: Security and compliance - every decision should prioritize data protection
- **Priority 2**: Audit trail - all operations must be logged
- **Priority 3**: Performance - meet SLAs (<200ms for card operations)
- **Priority 4**: Code quality - follow ESLint rules, TypeScript strict mode required

---

## Patterns to ALWAYS Follow

### 1. Use decimal.js for Money

**Pattern**: All monetary values use `decimal.js` library

```typescript
// CORRECT - Copilot should generate this
import Decimal from 'decimal.js';

const amount = new Decimal('100.50');
const limit = new Decimal('1000.00');

// AVOID - Copilot should never suggest this
const amount = 100.50;
const limit = 1000.00;
```

### 2. Async/Await for All I/O

**Pattern**: All database, cache, API calls are async

```typescript
// CORRECT
async function getCard(cardId: string): Promise<CardResponse> {
  const card = await prisma.virtualCard.findUnique({
    where: { id: cardId }
  });
  return card;
}

// AVOID
function getCard(cardId: string): CardResponse {
  const card = prisma.virtualCard.findUnique({  // Missing await
    where: { id: cardId }
  });
  return card;
}
```

### 3. TypeScript Types on All Functions

**Pattern**: Complete type annotations for all parameters and returns

```typescript
// CORRECT
async function createCard(
  request: CardCreateRequest,
  user: User
): Promise<CardResponse> {
  // ...
}

// AVOID
async function createCard(request: any, user: any) {
  // ...
}
```

### 4. Audit Logging for State Changes

**Pattern**: Every card operation creates audit log

```typescript
// CORRECT
async function freezeCard(cardId: string, user: User): Promise<CardResponse> {
  const card = await cardService.getCard(cardId);

  const updatedCard = await prisma.virtualCard.update({
    where: { id: cardId },
    data: { status: CardStatus.FROZEN }
  });

  await auditLogService.create({
    action: 'card_freeze',
    cardId: cardId,
    userId: user.id,
    ipAddress: req.ip
  });

  return updatedCard;
}
```

### 5. Input Validation with Zod

**Pattern**: Always validate input with Zod schemas

```typescript
// CORRECT
import { z } from 'zod';
import Decimal from 'decimal.js';

const CardCreateRequestSchema = z.object({
  spendingLimitDaily: z.string().refine(
    (val) => new Decimal(val).gte('1.00') && new Decimal(val).lte('50000.00'),
    { message: 'Daily limit must be between 1.00 and 50000.00' }
  ),
  spendingLimitMonthly: z.string().refine(
    (val) => new Decimal(val).gte('1.00'),
    { message: 'Monthly limit must be at least 1.00' }
  ),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Must be ISO 4217 currency code')
}).refine(
  (data) => new Decimal(data.spendingLimitMonthly).gte(data.spendingLimitDaily),
  { message: 'Monthly limit must be >= daily limit' }
);

type CardCreateRequest = z.infer<typeof CardCreateRequestSchema>;
```

### 6. Error Handling with Specific Exceptions

**Pattern**: Specific exception types for different errors

```typescript
// CORRECT
try {
  const card = await cardService.getCard(cardId);
} catch (error) {
  if (error instanceof CardNotFoundError) {
    throw new HttpError(404, 'Card not found');
  }
  if (error instanceof KYCNotVerifiedError) {
    throw new HttpError(403, 'KYC verification required');
  }
  if (error instanceof RateLimitError) {
    throw new HttpError(429, 'Too many requests');
  }
  throw error;
}
```

### 7. Database Transactions for Consistency

**Pattern**: Use Prisma transactions for multi-step operations

```typescript
// CORRECT
await prisma.$transaction(async (tx) => {
  const card = await tx.virtualCard.update({
    where: { id: cardId },
    data: { status: CardStatus.FROZEN }
  });

  await tx.cardAuditLog.create({
    data: {
      action: 'card_freeze',
      cardId: cardId,
      userId: user.id,
      createdAt: new Date()
    }
  });

  return card;
});
```

### 8. Caching for Performance

**Pattern**: Cache frequently accessed data with ioredis

```typescript
// CORRECT - Cache card with 5 min TTL
async function getCard(cardId: string): Promise<VirtualCard> {
  const cacheKey = `card:${cardId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback to database
  const card = await prisma.virtualCard.findUnique({
    where: { id: cardId }
  });

  if (card) {
    await redis.setex(cacheKey, 300, JSON.stringify(card));  // 5 min TTL
  }

  return card;
}
```

---

## Patterns to NEVER Use

### Forbidden Patterns

1. **Native Number for money**
   ```typescript
   // FORBIDDEN
   const amount = 100.50;
   ```

2. **Plaintext PAN in logs**
   ```typescript
   // FORBIDDEN
   logger.info(`Card: ${cardNumber}`);
   ```

3. **Unprotected endpoints**
   ```typescript
   // FORBIDDEN
   router.get('/cards', async (req, res) => {
     // No authentication middleware!
   });
   ```

4. **No error handling**
   ```typescript
   // FORBIDDEN
   const card = await prisma.virtualCard.findFirst();  // No try-catch
   ```

5. **Missing await**
   ```typescript
   // FORBIDDEN
   prisma.virtualCard.findUnique({ where: { id } });  // Missing await
   ```

6. **Using any type**
   ```typescript
   // FORBIDDEN
   function createCard(request: any, user: any) {
     // ...
   }
   ```

7. **State change without audit log**
   ```typescript
   // FORBIDDEN
   await prisma.virtualCard.update({
     where: { id: cardId },
     data: { status: CardStatus.FROZEN }
   });
   // Missing audit log!
   ```

---

## Naming Conventions

### Database Tables (Prisma models use PascalCase, map to snake_case)
- Model: `VirtualCard` → Table: `virtual_cards`
- Model: `CardTransaction` → Table: `card_transactions`
- Model: `CardAuditLog` → Table: `card_audit_log`
- `cards` (too generic)
- `Card_Table` (mixed case)

### Functions (camelCase)
- `createCardForUser()`
- `freezeCardWithReason()`
- `create_card_for_user()` (snake_case - wrong for TypeScript)
- `makecard()` (no verb separation)

### Constants (UPPER_SNAKE_CASE)
- `const MAX_SPENDING_LIMIT = new Decimal('50000.00');`
- `const CARD_STATE_TRANSITIONS = { ... };`
- `const maxSpendingLimit` (should be UPPER_SNAKE_CASE)

### API Endpoints (kebab-case with params)
- `/api/v1/cards` (kebab-case, plural for collections)
- `/api/v1/cards/:cardId/freeze` (param with colon prefix)
- `/api/v1/card` (singular for collection - wrong)
- `/api/v1/createCard` (verb in URL - wrong)

### Enums (PascalCase with string values)
- `enum CardStatus { ACTIVE = 'active', FROZEN = 'frozen' }`
- `enum TransactionType { PURCHASE = 'purchase' }`
- `const cardStatus = 'active'` (should be enum)

---

## API Response Format

### Success Response (TypeScript interfaces)

```typescript
// CORRECT
interface CardResponse {
  id: string;
  userId: string;
  cardLastFour: string;  // Only last 4 digits
  status: CardStatus;
  spendingLimitDaily: string;  // Decimal as string for JSON
  spendingLimitMonthly: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;
  // Never include: cardNumberEncrypted, cvvEncrypted
}
```

### Error Response (Consistent format)

```typescript
// CORRECT
interface ErrorResponse {
  error: string;
  detail?: string;
  requestId: string;  // For tracing
  timestamp: string;  // ISO 8601
}

// Return as: res.status(400).json({ error: '...', requestId, timestamp });
```

---

## Testing Patterns

### Unit Test Template (Jest)

```typescript
// CORRECT - Use this pattern
describe('CardService.createCard', () => {
  it('should create card with valid spending limits', async () => {
    // Arrange
    const user = createTestUser();
    const request: CardCreateRequest = {
      spendingLimitDaily: '1000.00',
      spendingLimitMonthly: '10000.00',
      currency: 'USD'
    };

    // Act
    const card = await cardService.createCard(request, user);

    // Assert
    expect(card.id).toBeDefined();
    expect(card.userId).toBe(user.id);
    expect(card.status).toBe(CardStatus.ACTIVE);
  });
});
```

### Mock External Services

```typescript
// CORRECT - Mock payment processor with Jest
describe('CardService.createCard', () => {
  it('should fail gracefully when processor unavailable', async () => {
    // Arrange
    jest.spyOn(paymentProcessor, 'issueCard').mockRejectedValue(
      new PaymentProcessorError('Service unavailable')
    );

    // Act & Assert
    await expect(cardService.createCard(request, user))
      .rejects.toThrow(PaymentProcessorError);
  });
});
```

---

## Security Checklist Before Suggesting Code

- [ ] Does endpoint require authentication middleware?
- [ ] Does endpoint check authorization (user owns resource)?
- [ ] Does operation create audit log entry?
- [ ] Are sensitive fields encrypted/masked?
- [ ] Is input validated with Zod?
- [ ] Are error messages generic (no internal details)?
- [ ] Is rate limiting applied if needed?
- [ ] Are database queries using Prisma (parameterized)?

---

## Performance Checklist

- [ ] Are slow queries using Prisma indexes?
- [ ] Is frequently accessed data cached in Redis?
- [ ] Are database operations using async/await?
- [ ] Is response pagination implemented for large datasets?
- [ ] Are N+1 queries avoided (use Prisma include)?
- [ ] Is operation within SLA target?

---

## Code Review Points

When reviewing generated code, verify:

1. **Security**: No plaintext PAN, all data encrypted, auth on all endpoints
2. **Compliance**: Audit logs created, GDPR compliance, PCI-DSS adherence
3. **Performance**: Async operations, caching, indexes, query optimization
4. **Testing**: Unit tests with >90% coverage, edge cases tested
5. **Type Safety**: All functions typed, no `any` type unless necessary
6. **Error Handling**: Specific exceptions, proper HTTP status codes
7. **Documentation**: JSDoc with security/compliance notes

---

## Approved Libraries & Versions

### Must Use
- Express.js 4.18+
- Prisma 5.0+
- Zod 3.22+
- Jest 29+ with ts-jest
- decimal.js 10+
- ioredis 5+

### Approved Optional
- axios for external HTTP (with interceptors)
- jose for JWT
- node-forge for encryption
- winston for structured logging
- prom-client for Prometheus metrics
- bullmq for job queues

### Forbidden
- `request` (deprecated, use axios)
- `mysql` (use PostgreSQL with Prisma)
- `moment` (use date-fns or native Date)
- Native `Number` for money (use decimal.js)

---

## Configuration Management

### Always Use Environment Variables

```typescript
// CORRECT
const DATABASE_URL = process.env.DATABASE_URL;
const ENCRYPTION_KEY_ID = process.env.ENCRYPTION_KEY_ID;
const JWT_SECRET = process.env.JWT_SECRET;

if (!DATABASE_URL || !JWT_SECRET) {
  throw new Error('Missing required environment variables');
}

// AVOID
const DATABASE_URL = 'postgresql://localhost/mydb';  // Hardcoded
```

### Never Commit Secrets

```
# Add to .gitignore
.env
.env.local
secrets/
*.key
*.pem
```

---

**Last Updated**: February 2026
**Copilot Version**: Compatible with GitHub Copilot for VS Code, IntelliJ, and CLI
**Language**: TypeScript 5.0+ with Node.js 18+
