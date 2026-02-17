# GitHub Copilot Instructions for Virtual Card Management System

This file guides GitHub Copilot on code patterns, naming conventions, and best practices for the Virtual Card Management System.

---

## General Principles

- **Priority 1**: Security and compliance - every decision should prioritize data protection
- **Priority 2**: Audit trail - all operations must be logged
- **Priority 3**: Performance - meet SLAs (<200ms for card operations)
- **Priority 4**: Code quality - follow PEP 8, type hints required

---

## Patterns to ALWAYS Follow

### 1. Use Decimal for Money

**Pattern**: All monetary values use `from decimal import Decimal`

```python
# ✅ CORRECT - Copilot should generate this
amount = Decimal("100.50")
limit = Decimal("1000.00")

# ❌ AVOID - Copilot should never suggest this
amount = 100.50
limit = 1000.00
```

### 2. Async/Await for All I/O

**Pattern**: All database, cache, API calls are async

```python
# ✅ CORRECT
async def get_card(card_id: UUID) -> CardResponse:
    card = await db.query(VirtualCard).filter_by(id=card_id).first()
    return card

# ❌ AVOID
def get_card(card_id: UUID) -> CardResponse:
    card = db.query(VirtualCard).filter_by(id=card_id).first()
    return card
```

### 3. Type Hints on All Functions

**Pattern**: Complete type hints for all parameters and returns

```python
# ✅ CORRECT
async def create_card(
    request: CardCreateRequest,
    user: User
) -> CardResponse:
    ...

# ❌ AVOID
async def create_card(request, user):
    ...
```

### 4. Audit Logging for State Changes

**Pattern**: Every card operation creates audit log

```python
# ✅ CORRECT
async def freeze_card(card_id: UUID, user: User) -> CardResponse:
    card = await CardService.get_card(card_id)
    card.status = CardStatus.FROZEN
    await db.commit()
    
    await AuditLogService.create(
        action="card_freeze",
        card_id=card_id,
        user_id=user.id,
        ip_address=request.client.host
    )
    return card
```

### 5. Input Validation with Pydantic

**Pattern**: Always validate input with Pydantic models

```python
# ✅ CORRECT
class CardCreateRequest(BaseModel):
    spending_limit_daily: Decimal = Field(..., ge=Decimal("1.00"), le=Decimal("50000.00"))
    spending_limit_monthly: Decimal = Field(..., ge=Decimal("1.00"))
    currency: str = Field(..., regex="^[A-Z]{3}$")  # ISO 4217

    @field_validator("spending_limit_monthly")
    def validate_monthly(cls, v, values):
        if "spending_limit_daily" in values:
            if v < values["spending_limit_daily"]:
                raise ValueError("monthly must be >= daily")
        return v
```

### 6. Error Handling with Specific Exceptions

**Pattern**: Specific exception types for different errors

```python
# ✅ CORRECT
try:
    card = await CardService.get_card(card_id)
except CardNotFoundError:
    raise HTTPException(status_code=404, detail="Card not found")
except KYCNotVerifiedError:
    raise HTTPException(status_code=403, detail="KYC verification required")
except RateLimitError:
    raise HTTPException(status_code=429, detail="Too many requests")
```

### 7. Database Transactions for Consistency

**Pattern**: Use transactions for multi-step operations

```python
# ✅ CORRECT
async with db.begin():
    card.status = CardStatus.FROZEN
    await db.flush()  # Ensure card is updated before logging
    await AuditLogService.create(...)
    # Auto-commit on context exit
```

### 8. Caching for Performance

**Pattern**: Cache frequently accessed data

```python
# ✅ CORRECT - Cache card with 5 min TTL
@cached(redis, ttl=300, key=f"card:{card_id}")
async def get_card(card_id: UUID) -> VirtualCard:
    return await db.query(VirtualCard).filter_by(id=card_id).first()
```

---

## Patterns to NEVER Use

### ❌ Forbidden Patterns

1. **Float for money**
   ```python
   # FORBIDDEN
   amount = 100.50
   ```

2. **Plaintext PAN in logs**
   ```python
   # FORBIDDEN
   logger.info(f"Card: {card_number}")
   ```

3. **Unprotected endpoints**
   ```python
   # FORBIDDEN
   @router.get("/cards")
   async def get_cards():
       ...
   ```

4. **No error handling**
   ```python
   # FORBIDDEN
   card = db.query(Card).first()
   ```

5. **Synchronous database calls**
   ```python
   # FORBIDDEN
   card = db.query(Card).filter_by(id=id).first()
   ```

6. **No type hints**
   ```python
   # FORBIDDEN
   def create_card(request, user):
       ...
   ```

7. **State change without audit log**
   ```python
   # FORBIDDEN
   card.status = CardStatus.FROZEN
   await db.commit()
   # Missing audit log!
   ```

---

## Naming Conventions

### Database Tables
- ✅ `virtual_cards`
- ✅ `card_transactions`
- ✅ `card_audit_log`
- ❌ `cards` (too generic)
- ❌ `Card_Table` (mixed case)

### Functions
- ✅ `create_card_for_user()`
- ✅ `freeze_card_with_reason()`
- ❌ `createCardForUser()` (camelCase)
- ❌ `makecard()` (no verb prefix)

### Constants
- ✅ `MAX_SPENDING_LIMIT = Decimal("50000.00")`
- ✅ `CARD_STATE_TRANSITIONS = {...}`
- ❌ `maxSpendingLimit` (should be UPPER_SNAKE_CASE)
- ❌ `max_spending_limit` (should be UPPER_SNAKE_CASE for constants)

### API Endpoints
- ✅ `/api/v1/cards` (kebab-case, plural for collections)
- ✅ `/api/v1/cards/{card_id}/freeze` (kebab-case, POST method)
- ❌ `/api/v1/card` (singular for collection)
- ❌ `/api/v1/createCard` (camelCase)

### Enums
- ✅ `class CardStatus(str, Enum): ACTIVE = "active"`
- ✅ `class TransactionType(str, Enum): PURCHASE = "purchase"`
- ❌ `class cardStatus` (lowercase, non-enum)

---

## API Response Format

### Success Response (Always include these)

```python
# ✅ CORRECT
class CardResponse(BaseModel):
    id: UUID
    user_id: UUID
    card_last_four: str  # Only last 4 digits
    status: CardStatus
    spending_limit_daily: Decimal
    spending_limit_monthly: Decimal
    created_at: datetime
    updated_at: datetime
    # Never include: card_number_encrypted, cvv_encrypted
```

### Error Response (Consistent format)

```python
# ✅ CORRECT
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    request_id: str  # For tracing
    timestamp: datetime

# Return as: HTTPException(status_code=400, detail=ErrorResponse(...).model_dump())
```

---

## Testing Patterns

### Unit Test Template

```python
# ✅ CORRECT - Use this pattern
@pytest.mark.asyncio
async def test_create_card_with_valid_limits():
    """Test card creation succeeds with valid spending limits."""
    # Arrange
    user = factory.create_test_user()
    request = CardCreateRequest(
        spending_limit_daily=Decimal("1000.00"),
        spending_limit_monthly=Decimal("10000.00"),
        currency="USD"
    )
    
    # Act
    card = await CardService.create_card(request, user)
    
    # Assert
    assert card.id is not None
    assert card.user_id == user.id
    assert card.status == CardStatus.ACTIVE
```

### Mock External Services

```python
# ✅ CORRECT - Mock payment processor
@pytest.mark.asyncio
async def test_create_card_processor_failure(mocker):
    """Test card creation fails gracefully when processor unavailable."""
    mocker.patch(
        "src.services.payment_processor.issue_card",
        side_effect=PaymentProcessorError("Service unavailable")
    )
    
    with pytest.raises(PaymentProcessorError):
        await CardService.create_card(...)
```

---

## Security Checklist Before Suggesting Code

- [ ] Does endpoint require authentication?
- [ ] Does endpoint check authorization (user owns resource)?
- [ ] Does operation create audit log entry?
- [ ] Are sensitive fields encrypted/masked?
- [ ] Is input validated with Pydantic?
- [ ] Are error messages generic (no internal details)?
- [ ] Is rate limiting applied if needed?
- [ ] Are database queries parameterized (no SQL injection)?

---

## Performance Checklist

- [ ] Are slow queries using indexes?
- [ ] Is frequently accessed data cached?
- [ ] Are database operations async?
- [ ] Is response pagination implemented for large datasets?
- [ ] Are N+1 queries avoided (use eager loading)?
- [ ] Is operation within SLA target?

---

## Code Review Points

When reviewing generated code, verify:

1. **Security**: No plaintext PAN, all data encrypted, auth on all endpoints
2. **Compliance**: Audit logs created, GDPR compliance, PCI-DSS adherence
3. **Performance**: Async operations, caching, indexes, query optimization
4. **Testing**: Unit tests with >90% coverage, edge cases tested
5. **Type Safety**: All functions typed, no `Any` type unless necessary
6. **Error Handling**: Specific exceptions, proper HTTP status codes
7. **Documentation**: Docstrings with security/compliance notes

---

## Approved Libraries & Versions

### Must Use
- FastAPI 0.104+
- SQLAlchemy 2.0+
- Pydantic 2.0+
- pytest 7.4+
- asyncpg for database driver
- aioredis for Redis

### Approved Optional
- httpx for async HTTP
- python-jose for JWT
- cryptography for encryption
- structlog for structured logging
- prometheus-client for metrics

### Forbidden
- ❌ requests (use httpx instead)
- ❌ MySQLdb (use asyncpg for PostgreSQL)
- ❌ pytz (use zoneinfo for timezones)
- ❌ datetime (use datetime.datetime with UTC)

---

## Configuration Management

### Always Use Environment Variables

```python
# ✅ CORRECT
DATABASE_URL = os.getenv("DATABASE_URL")
ENCRYPTION_KEY_ID = os.getenv("ENCRYPTION_KEY_ID")
JWT_SECRET = os.getenv("JWT_SECRET")

# ❌ AVOID
DATABASE_URL = "postgresql://localhost/mydb"  # Hardcoded
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

