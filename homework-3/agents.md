# AI Agent Guidelines for Virtual Card Management System

## Overview

This document defines how an AI coding partner (GitHub Copilot, Claude Code, etc.) should approach development of the Virtual Card Management System. It ensures consistency, security, and regulatory compliance across all generated code.

---

## Tech Stack Requirements

### Backend Framework
- **Language**: Python 3.11+ (strict requirement)
- **Framework**: FastAPI 0.104+ with async/await
- **Package Manager**: Poetry or pip with requirements.txt
- **Virtual Environment**: Python venv or Poetry

### Database & Storage
- **Primary Database**: PostgreSQL 15+ with pgcrypto extension
- **ORM**: SQLAlchemy 2.0+ with Alembic for migrations
- **Cache Layer**: Redis 7+ (ioredis or aioredis for async)
- **File Storage**: AWS S3 or MinIO for compliance document retention

### Message Queue & Events
- **Queue System**: RabbitMQ 3.12+ or AWS SQS
- **Worker Framework**: Celery 5.3+ or asyncio tasks
- **Event Publishing**: Use webhook_service for all business events

### Testing & Quality
- **Unit Testing**: pytest 7.4+
- **Integration Testing**: pytest with fixtures + PostgreSQL testcontainers
- **API Testing**: FastAPI TestClient + Starlette test utilities
- **Code Quality**: Black (formatting), flake8 (linting), mypy (type checking)
- **Coverage**: pytest-cov with minimum 90% coverage requirement

### Monitoring & Logging
- **Logging**: Python logging module + structlog for structured logs
- **Metrics**: prometheus-client for Prometheus integration
- **Tracing**: OpenTelemetry with Jaeger for distributed tracing
- **Alerting**: Prometheus Alertmanager for critical alerts

---

## Domain Rules - FinTech/Banking Specific

### 1. Monetary Value Handling

**RULE**: Never use float for money. Always use `Decimal`.

```python
# ✅ CORRECT
from decimal import Decimal

spending_limit = Decimal("1000.00")  # 2 decimal places
total = Decimal("100.50") + Decimal("50.25")

# ❌ WRONG - Never do this
spending_limit = 1000.00  # float
total = 100.50 + 50.25
```

**RULE**: All monetary values must have exactly 2 decimal places.

```python
# ✅ CORRECT
amount = Decimal("99.99")
price = Decimal("0.01")

# ❌ WRONG
amount = Decimal("99.9")  # Only 1 decimal place
price = Decimal("1")  # No decimal places
```

### 2. Card Data Security

**RULE**: Never store, log, or transmit full Primary Account Number (PAN).

```python
# ✅ CORRECT - Store encrypted and masked
card_number_encrypted = encrypt_pii(pii_value=full_pan)  # Stored encrypted
card_last_four = full_pan[-4:]  # Store only last 4 digits for display

# ❌ WRONG - Never log sensitive data
logger.info(f"Processing card {card_number}")  # VIOLATION
db.save(card_number)  # VIOLATION - store plaintext
```

**RULE**: Use field-level encryption for sensitive data.

```python
# ✅ CORRECT - Use pgcrypto for database encryption
CREATE TABLE virtual_cards (
    id UUID PRIMARY KEY,
    card_number_encrypted bytea,  -- Encrypted with pgcrypto
    card_last_four VARCHAR(4),
    cvv_encrypted bytea  -- Never store CVV in plaintext
);

# In Python ORM
class VirtualCard(Base):
    __tablename__ = "virtual_cards"
    card_number_encrypted: Mapped[bytes] = mapped_column(BYTEA)
```

### 3. Authentication & Authorization

**RULE**: All endpoints require authentication. Use JWT + OAuth 2.0.

```python
# ✅ CORRECT - Every endpoint protected
@router.get("/api/v1/cards/{card_id}")
async def get_card(
    card_id: UUID,
    current_user: User = Depends(get_current_user)  # Required
) -> CardResponse:
    # Verify user owns this card
    card = await CardService.get_card(card_id)
    if card.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return card

# ❌ WRONG - Unprotected endpoint
@router.get("/api/v1/cards/{card_id}")
async def get_card(card_id: UUID) -> CardResponse:
    return CardService.get_card(card_id)
```

**RULE**: Implement role-based access control (RBAC).

```python
# ✅ CORRECT - Role-based access
@router.get("/api/v1/compliance/reports")
async def get_compliance_reports(
    current_user: User = Depends(require_role("COMPLIANCE_OFFICER"))
) -> List[ComplianceReport]:
    return ComplianceService.get_reports()

# ❌ WRONG - No role checking
@router.get("/api/v1/compliance/reports")
async def get_compliance_reports(
    current_user: User = Depends(get_current_user)
) -> List[ComplianceReport]:
    return ComplianceService.get_reports()
```

### 4. Audit Logging

**RULE**: Every card operation must create an immutable audit log entry.

```python
# ✅ CORRECT - Always log operations
async def freeze_card(card_id: UUID, user: User) -> CardResponse:
    card = await CardService.get_card(card_id)
    card.status = CardStatus.FROZEN
    await db.commit()
    
    # Create immutable audit log
    await AuditLogService.create(
        action="card_freeze",
        user_id=user.id,
        card_id=card_id,
        ip_address=request.client.host,
        reason="User initiated freeze"
    )
    return card

# ❌ WRONG - No audit trail
async def freeze_card(card_id: UUID) -> CardResponse:
    card = await CardService.get_card(card_id)
    card.status = CardStatus.FROZEN
    await db.commit()
    return card
```

**RULE**: Audit logs must never be deleted (soft delete only, with retention).

```python
# ✅ CORRECT - 7 year retention
class AuditLog(Base):
    __tablename__ = "card_audit_log"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    action: Mapped[str]
    user_id: Mapped[Optional[UUID]]
    card_id: Mapped[UUID]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    retention_until: Mapped[datetime]  # 7 years from creation
    # No delete method - audit logs are permanent
```

### 5. State Machine Validation

**RULE**: All card status changes must follow defined state machine.

```python
# ✅ CORRECT - Validate transitions
CARD_STATE_TRANSITIONS = {
    CardStatus.ACTIVE: {CardStatus.FROZEN, CardStatus.CANCELLED},
    CardStatus.FROZEN: {CardStatus.ACTIVE, CardStatus.CANCELLED},
    CardStatus.CANCELLED: set(),  # No transitions from CANCELLED
    CardStatus.EXPIRED: set(),  # No transitions from EXPIRED
}

async def update_card_status(
    card: VirtualCard,
    new_status: CardStatus
) -> VirtualCard:
    allowed_transitions = CARD_STATE_TRANSITIONS.get(card.status, set())
    if new_status not in allowed_transitions:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot transition from {card.status} to {new_status}"
        )
    card.status = new_status
    await db.commit()
    return card

# ❌ WRONG - No validation
async def update_card_status(card: VirtualCard, new_status: CardStatus):
    card.status = new_status  # Allow any transition
    await db.commit()
```

### 6. Fraud Detection Standards

**RULE**: Implement real-time fraud detection for all transactions.

```python
# ✅ CORRECT - Fraud checks before authorization
async def authorize_transaction(
    request: TransactionAuthRequest
) -> AuthorizationResponse:
    card = await CardService.get_card(request.card_id)
    
    # Check fraud score
    fraud_score = await FraudDetectionService.evaluate(
        card=card,
        amount=request.amount,
        merchant=request.merchant,
        ip_address=request.ip_address
    )
    
    if fraud_score >= 70:
        # Auto-freeze card
        card.status = CardStatus.FROZEN
        await db.commit()
        return AuthorizationResponse(decision="DECLINE", reason="Fraud detected")
    
    # Continue with authorization
    return AuthorizationResponse(decision="APPROVE")

# ❌ WRONG - No fraud detection
async def authorize_transaction(request: TransactionAuthRequest):
    if request.amount <= card.spending_limit:
        return AuthorizationResponse(decision="APPROVE")
    return AuthorizationResponse(decision="DECLINE")
```

### 7. Rate Limiting

**RULE**: Implement rate limiting on all sensitive endpoints.

```python
# ✅ CORRECT - Rate limiting
@router.post("/api/v1/cards")
@rate_limit(
    limit=5,  # 5 requests
    period=3600,  # per hour
    key_func=lambda: get_current_user().id  # Per user
)
async def create_card(
    request: CardCreateRequest,
    current_user: User = Depends(get_current_user)
) -> CardResponse:
    return await CardService.create_card(request, current_user)

# ❌ WRONG - No rate limiting
@router.post("/api/v1/cards")
async def create_card(request: CardCreateRequest) -> CardResponse:
    return await CardService.create_card(request)
```

---

## Code Style & Patterns

### File Organization

```
src/
├── api/
│   ├── v1/
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── cards.py
│   │   │   ├── transactions.py
│   │   │   ├── card_limits.py
│   │   │   ├── fraud_alerts.py
│   │   │   ├── compliance.py
│   │   │   └── webhooks.py
│   │   └── schemas/
│   │       ├── card_schemas.py
│   │       ├── transaction_schemas.py
│   │       └── compliance_schemas.py
├── models/
│   ├── __init__.py
│   ├── card.py
│   ├── transaction.py
│   ├── fraud_alert.py
│   └── audit_log.py
├── services/
│   ├── card_service.py
│   ├── authorization_service.py
│   ├── fraud_detection_service.py
│   ├── webhook_service.py
│   ├── compliance_service.py
│   └── encryption_service.py
├── workers/
│   ├── webhook_worker.py
│   └── compliance_reporter.py
├── utils/
│   ├── decorators.py
│   ├── validators.py
│   └── constants.py
├── database/
│   ├── __init__.py
│   ├── connection.py
│   └── migrations/
└── config.py
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `VirtualCard`, `CardService`)
- **Functions/Methods**: snake_case (e.g., `create_card`, `validate_amount`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SPENDING_LIMIT`, `RETRY_ATTEMPTS`)
- **Database Tables**: snake_case (e.g., `virtual_cards`, `card_audit_log`)
- **API Endpoints**: kebab-case (e.g., `/api/v1/cards/{card_id}/freeze`)
- **Enums**: PascalCase (e.g., `CardStatus.ACTIVE`)

### Error Handling

```python
# ✅ CORRECT - Explicit error handling
async def get_card(card_id: UUID, user: User) -> CardResponse:
    try:
        card = await CardService.get_card(card_id)
        if card.user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return card
    except CardNotFoundError:
        raise HTTPException(status_code=404, detail="Card not found")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# ❌ WRONG - Silent failures
async def get_card(card_id: UUID) -> CardResponse:
    return CardService.get_card(card_id)  # No error handling
```

---

## Testing Standards

### Unit Test Coverage Minimum: 90%

```python
# ✅ CORRECT - Comprehensive unit tests
@pytest.mark.asyncio
async def test_create_card_success():
    """Test successful card creation with valid data."""
    user = create_test_user()
    request = CardCreateRequest(
        spending_limit_daily=Decimal("1000.00"),
        spending_limit_monthly=Decimal("10000.00"),
        currency="USD"
    )
    
    card = await CardService.create_card(request, user)
    
    assert card.id is not None
    assert card.user_id == user.id
    assert card.status == CardStatus.ACTIVE
    assert card.spending_limit_daily == Decimal("1000.00")


@pytest.mark.asyncio
async def test_create_card_exceeds_daily_limit():
    """Test card creation fails when daily > monthly."""
    user = create_test_user()
    request = CardCreateRequest(
        spending_limit_daily=Decimal("50000.00"),
        spending_limit_monthly=Decimal("1000.00"),  # Invalid
        currency="USD"
    )
    
    with pytest.raises(ValidationError):
        await CardService.create_card(request, user)
```

### Integration Tests Required

```python
@pytest.mark.asyncio
async def test_card_lifecycle():
    """Test complete card lifecycle: create -> freeze -> unfreeze -> cancel."""
    user = create_test_user()
    
    # Create card
    card = await CardService.create_card(..., user)
    assert card.status == CardStatus.ACTIVE
    
    # Freeze card
    card = await CardService.freeze_card(card.id, user)
    assert card.status == CardStatus.FROZEN
    
    # Unfreeze card
    card = await CardService.unfreeze_card(card.id, user)
    assert card.status == CardStatus.ACTIVE
    
    # Cancel card
    card = await CardService.cancel_card(card.id, user)
    assert card.status == CardStatus.CANCELLED
```

---

## Security & Compliance Constraints

### Security Checklist

- [ ] No sensitive data in logs (PAN, CVV, SSN)
- [ ] All endpoints require authentication
- [ ] All data endpoints require HTTPS (TLS 1.3)
- [ ] CORS enabled only for known domains
- [ ] SQL injection prevention (parameterized queries only)
- [ ] CSRF protection on state-changing endpoints
- [ ] Input validation on all endpoints
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

```python
# ✅ CORRECT - Proper indexing
class VirtualCard(Base):
    __tablename__ = "virtual_cards"
    __table_args__ = (
        Index("idx_user_id_status", "user_id", "status"),
        Index("idx_created_at", "created_at"),
    )
```

---

## Documentation Standards

### Docstring Format

```python
# ✅ CORRECT - Detailed docstrings
async def create_card(
    card_request: CardCreateRequest,
    current_user: User = Depends(get_current_user)
) -> CardResponse:
    """
    Create a new virtual card for the authenticated user.
    
    This endpoint initiates card issuance through the payment processor,
    encrypts sensitive card data, and creates an audit log entry.
    
    Args:
        card_request: Card creation parameters including spending limits
        current_user: Authenticated user making the request
    
    Returns:
        CardResponse: Created card with masked card number (last 4 digits only)
    
    Raises:
        ValidationError: If spending limits are invalid
        KYCNotVerifiedError: If user's KYC verification is incomplete
        RateLimitError: If user exceeds card creation rate limit
    
    Security:
        - Requires authenticated user
        - Card creation rate limited to 5/hour per user
        - Audit logged with user IP and timestamp
    
    Compliance:
        - PCI-DSS: Card number encrypted before storage
        - GDPR: Card linked to user consent record
    """
    # Implementation
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

