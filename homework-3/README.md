# Virtual Card Management System - Specification Package

> **Author:** Andrii Orel  
> **Course:** AI as a Personalized Coding Partner  
> **Homework:** #3 - Specification-Driven Design  
> **Date:** February 17, 2026

---

## 📋 Project Summary

This homework delivers a **specification package** for a Virtual Card Management System - a FinTech application for creating, managing, and monitoring virtual payment cards with real-time spending controls and fraud detection. **No code implementation** - only comprehensive specifications and guidelines designed to guide AI coding partners.

The specification reflects industry best practices for banking and payments, with emphasis on security, compliance, and audit trails.

---

## 📦 Deliverables

### 1. specification.md (670+ lines)
Complete product specification including:
- **High-Level Objective**: Clear, singular goal statement
- **Mid-Level Objectives**: 5 concrete, measurable objectives (compliance, security, audit, performance, integration)
- **Implementation Notes**: Technology stack, data handling standards, security requirements, testing standards
- **Context**: Beginning/ending context defining project scope
- **Low-Level Tasks**: 10 detailed implementation tasks with AI prompts, file paths, functions, and constraints

### 2. agents.md (600+ lines)
AI agent guidelines defining:
- **Tech Stack Requirements**: TypeScript 5.0+, Node.js 18+, Express.js, Prisma, PostgreSQL, Redis, Jest
- **Domain Rules**: 7 critical banking domain rules (decimal.js for money, card security, auth, audit, state machine, fraud detection, rate limiting)
- **Code Style**: File organization, naming conventions, error handling patterns
- **Testing Standards**: Unit test coverage requirements, integration tests, test patterns
- **Security Checklist**: PCI-DSS and GDPR compliance requirements
- **Performance Standards**: Latency targets, throughput targets, database optimization
- **Deployment Requirements**: Environment variables, secrets management

### 3. .github/copilot-instructions.md (400+ lines)
GitHub Copilot-specific instructions:
- **8 Patterns to ALWAYS Follow**: decimal.js for money, async/await, TypeScript types, audit logging, input validation (Zod), error handling, Prisma transactions, caching
- **7 Patterns to NEVER Use**: Native Number for money, plaintext PAN, unprotected endpoints, missing error handling, missing await, no type annotations, missing audit logs
- **Naming Conventions**: Database tables (snake_case), functions (camelCase), constants, endpoints, enums
- **API Response Format**: Success/error response structures (TypeScript interfaces)
- **Testing Patterns**: Jest test templates, mock patterns
- **Security Checklist**: 8-point verification before code suggestion
- **Performance Checklist**: 6-point verification for performance
- **Approved Libraries**: Must-use (Express, Prisma, Zod, Jest, decimal.js), optional, forbidden libraries

### 4. README.md (This file)
Explains design choices, rationale, and industry best practices

---

## 🎯 Rationale: Why This Specification Was Written This Way

### 1. **Domain Selection: Virtual Card Lifecycle Management**

**Why Virtual Cards?**
- **Complexity**: Combines multiple FinTech concerns (issuance, authorization, lifecycle management, fraud detection)
- **Real-world relevance**: Increasingly popular in payments industry (Stripe, Marqeta, Revolut)
- **Regulation-rich**: Demonstrates PCI-DSS, GDPR, and AML/KYC compliance requirements
- **Scope clarity**: Well-defined feature set (create, freeze/unfreeze, limits, transactions, fraud alerts)

### 2. **Specification Structure: Detailed Task Definition**

**Why 10 Low-Level Tasks with AI Prompts?**
- **AI Operationalization**: Each task specifies exact prompt, file path, function name, and requirements
- **Reduction of ambiguity**: AI agents can implement without guessing
- **Traceability**: Each task maps to one or more mid-level objectives
- **Testability**: Each task includes success criteria and constraints

**Why Mid-Level Objectives grouped into 5 categories?**
- **Compliance**: Regulatory (PCI-DSS, GDPR) and audit requirements
- **Security**: Encryption, authentication, authorization at different layers
- **Audit**: Immutable logging and compliance reporting
- **Performance**: SLA targets and scalability requirements
- **Integration**: API design and webhook patterns

### 3. **Agent Guidelines: Banking Domain Rules**

**Why 7 Specific Rules?**

1. **decimal.js for Money** (Rule #1)
   - Critical: Prevents rounding errors in financial calculations
   - Alternative: Use integer cents, but decimal.js is more maintainable
   - Regulatory: PCI-DSS requires precise financial calculations

2. **Card Data Security** (Rule #2)
   - Critical: PCI-DSS Level 1 requirement for card number encryption
   - Standard: Use field-level encryption, never log full PAN
   - Compliance: Non-negotiable for banking apps

3. **Authentication & Authorization** (Rules #3)
   - Standard: OAuth 2.0 + JWT is industry best practice
   - Alternative: Session-based auth (less suitable for distributed systems)
   - Requirement: Every endpoint protected by default

4. **Audit Logging** (Rule #4)
   - Regulatory: SOC 2 Type II requirement (audit trail for 7 years)
   - Standard: Immutable append-only logs, never delete
   - Compliance: Essential for regulatory inspections

5. **State Machine Validation** (Rule #5)
   - Banking practice: Explicit state transitions prevent invalid operations
   - Alternative: Allow any transition (less safe)
   - Example: Can't transition from CANCELLED or EXPIRED to other states

6. **Fraud Detection** (Rule #6)
   - Risk mitigation: Real-time checks prevent unauthorized usage
   - Pattern: Velocity checks, amount anomalies, geographic flags
   - Impact: Auto-freeze cards when fraud score exceeds threshold

7. **Rate Limiting** (Rule #7)
   - Security: Prevents brute force and DDoS attacks
   - Standard: Per-user and per-org limits on sensitive endpoints
   - Compliance: Demonstrates access controls to auditors

### 4. **Code Patterns: "Always Follow" vs "Never Use"**

**Why explicit "NEVER" patterns?**
- AI models sometimes generate insecure patterns from training data
- Banking domain has zero-tolerance for security violations
- Clear prohibitions prevent common mistakes (float money, plaintext logs, unprotected endpoints)

**Why specific code examples?**
- Models learn from examples better than abstract rules
- ✅ CORRECT / ❌ WRONG pairs make patterns unambiguous
- Reduces need for back-and-forth refinement

---

## 🏦 Industry Best Practices Reflected in Spec

### 1. **PCI-DSS Compliance** 
**Locations in Spec:**
- `specification.md` → Mid-Level Objectives → "Regulatory Compliance & Data Protection"
- `specification.md` → Implementation Notes → "Compliance Constraints"
- `agents.md` → Domain Rules → "Card Data Security"
- `.github/copilot-instructions.md` → Forbidden Patterns #2, #3
- `specification.md` → Low-Level Tasks → Task #1 (Database Schema), Task #10 (Compliance Reporting)

**Key Practices:**
- ✅ Never store full PAN in plaintext
- ✅ Encrypt card data at rest (AES-256) and in transit (TLS 1.3)
- ✅ Field-level encryption for sensitive data
- ✅ Immutable audit trail for all operations
- ✅ Access control with role-based permissions

### 2. **GDPR Compliance**
**Locations in Spec:**
- `specification.md` → Mid-Level Objectives → "Regulatory Compliance & Data Protection"
- `specification.md` → Low-Level Tasks → Task #7 (Card Cancellation & GDPR deletion)
- `agents.md` → Security & Compliance Constraints → "GDPR Compliance Checklist"

**Key Practices:**
- ✅ Right to Access: Data export endpoint included
- ✅ Right to Deletion: Hard delete after 90-day retention period
- ✅ Data Minimization: Only collect necessary data
- ✅ Consent Management: Explicit user consent for card operations
- ✅ Privacy Notice: Available to all users

### 3. **SOC 2 Type II (Audit & Compliance)**
**Locations in Spec:**
- `specification.md` → Mid-Level Objectives → "Audit & Logging"
- `specification.md` → Implementation Notes → "Compliance Constraints"
- `specification.md` → Low-Level Tasks → Task #8 (Fraud Detection & Alerts), Task #10 (Compliance Reporting)

**Key Practices:**
- ✅ Immutable audit trail (7-year retention)
- ✅ Track every card state change (who, what, when, where, why)
- ✅ Real-time monitoring and alerting
- ✅ Compliance reports on demand
- ✅ Automated PCI-DSS validation tests

### 4. **API Security (OWASP Top 10)**
**Locations in Spec:**
- `agents.md` → Domain Rules → "Authentication & Authorization"
- `.github/copilot-instructions.md` → Security Checklist
- `specification.md` → Implementation Notes → "Security Requirements"

**Coverage:**
1. **A1: Broken Authentication** → OAuth 2.0 + JWT (agents.md)
2. **A2: Broken Authorization** → Role-based access control (agents.md Domain Rule #3)
3. **A3: Injection** → Parameterized queries only (.github/copilot-instructions.md)
4. **A5: Broken Access Control** → Check user owns resource (agents.md)
5. **A7: XSS** → Output encoding (.github/copilot-instructions.md Security Checklist)
6. **A9: Using Components with Known Vulnerabilities** → Approved libraries list (.github/copilot-instructions.md)

### 5. **Performance & Scalability**
**Locations in Spec:**
- `specification.md` → Mid-Level Objectives → "Performance & Scalability"
- `specification.md` → Implementation Notes → "Testing Standards"
- `agents.md` → Performance Standards (latency/throughput targets)
- `specification.md` → Low-Level Tasks → Task #4 (Transaction Authorization < 100ms)

**Key Metrics:**
- Card creation: < 200ms (p99)
- Transaction authorization: < 100ms (p95)
- 10,000+ card operations per second
- Support for multi-region deployment

### 6. **Fraud Detection & Risk Management**
**Locations in Spec:**
- `specification.md` → Low-Level Tasks → Task #8 (Fraud Detection & Alerts)
- `specification.md` → Implementation Notes → "Compliance Constraints"
- `agents.md` → Domain Rules → "Fraud Detection Standards"

**Patterns Implemented:**
- Velocity checks (max 10 tx/hour)
- Amount anomaly detection (>3x average)
- Geographic anomaly detection
- Merchant category anomaly detection
- Auto-freeze cards on high fraud score

### 7. **Webhook Architecture & Event-Driven Design**
**Locations in Spec:**
- `specification.md` → Mid-Level Objectives → "Integration & API Design"
- `specification.md` → Low-Level Tasks → Task #9 (Webhook Event System)

**Industry Standards:**
- Real-time event notifications (card.created, card.frozen, transaction.authorized)
- HMAC-SHA256 signing for webhook security
- Reliable delivery with exponential backoff retry
- Event filtering by subscription type
- Webhook verification challenge-response

### 8. **Monetary Value Handling (Never Native Number)**
**Locations in Spec:**
- `agents.md` → Domain Rules → "Monetary Value Handling" (Rule #1)
- `.github/copilot-instructions.md` → Patterns to ALWAYS Follow #1
- `.github/copilot-instructions.md` → Forbidden Patterns #1

**Standard Practice:**
- Use `decimal.js` library for all monetary values
- Always 2 decimal places (cents precision)
- Prevents rounding errors in financial calculations
- Required for PCI-DSS Level 1 compliance

---

## 🔐 Security & Compliance Coverage Map

| Requirement | Specification | agents.md | Copilot Rules | Implementation Task |
|------------|-----------|-----------|-----------|-----|
| PCI-DSS L1 | ✅ Mid-Obj #1 | ✅ Rule #2 | ✅ Forbidden #2 | Task #1, #10 |
| GDPR Compliance | ✅ Mid-Obj #1 | ✅ Checklist | ✅ Env Config | Task #7 |
| Encryption @ Rest | ✅ Mid-Obj #2 | ✅ Rule #2 | ✅ Config | Task #1 |
| TLS 1.3 @ Transit | ✅ Mid-Obj #2 | ✅ Requirements | ✅ Config | Task #4 |
| Authentication | ✅ Impl Notes | ✅ Rule #3 | ✅ Checklist | Task #2 |
| Authorization | ✅ Impl Notes | ✅ Rule #3 | ✅ Checklist | Task #2 |
| Audit Trail | ✅ Mid-Obj #3 | ✅ Rule #4 | ✅ Pattern | Task #8, #10 |
| Fraud Detection | ✅ Mid-Obj #5 | ✅ Rule #6 | ✅ Checklist | Task #8 |
| Rate Limiting | ✅ Impl Notes | ✅ Rule #7 | ✅ Pattern | Task #2 |
| Input Validation | ✅ Impl Notes | ✅ Pattern #5 | ✅ Pattern | Task #2 |

---

## 📚 How to Use This Specification

### For AI Coding Partners (Copilot, Claude, Cursor):

1. **Start with this README** to understand the domain and rationale
2. **Review agents.md** for tech stack and domain rules
3. **Follow .github/copilot-instructions.md** for code patterns and naming
4. **Read specification.md** for complete feature specification
5. **Implement each low-level task** in order, using provided prompts

### For Code Reviewers:

1. **Security Review**: Check against PCI-DSS checklist in agents.md
2. **Compliance Review**: Verify GDPR requirements from this README
3. **Code Quality Review**: Follow patterns in .github/copilot-instructions.md
4. **Test Review**: Verify >90% coverage from agents.md standards

### For Product Managers:

1. **Feature Overview**: Read specification.md High-Level & Mid-Level Objectives
2. **User Impact**: Check Mid-Level Objective #5 (Integration & API Design)
3. **Timeline**: Estimate from 10 low-level tasks (typically 2-3 weeks per task)
4. **Compliance**: Review audit requirements in Mid-Level Objective #3

---

## 🚀 Key Architectural Decisions

### 1. **Microservice Architecture**
- Virtual Card Service as independent microservice
- Payment Processor integration via API
- Webhook-based event notifications
- Separate fraud detection service

### 2. **Technology Stack**
- **TypeScript 5.0+ / Node.js 18+ / Express.js**: Type-safe, async-first framework for I/O-heavy operations
- **Prisma + PostgreSQL + pgcrypto**: Type-safe ORM with industry standard encryption
- **Redis + ioredis**: Cache layer for sub-100ms response times
- **BullMQ/SQS**: Async processing for fraud detection and reporting

### 3. **Security Layers**
- **Layer 1 (Transport)**: TLS 1.3 for all data in transit
- **Layer 2 (Application)**: OAuth 2.0 + JWT for authentication
- **Layer 3 (Database)**: Field-level encryption with pgcrypto
- **Layer 4 (Operations)**: Role-based access control (RBAC)

### 4. **Compliance Approach**
- **Compliance by Design**: Security requirements in every layer
- **Audit Trail First**: Log before committing state changes
- **Retention Policies**: 7-year audit log retention
- **Automated Testing**: PCI-DSS requirement validation

---

## 📊 Specification Statistics

| Metric | Value |
|--------|-------|
| specification.md Lines | 670+ |
| Mid-Level Objectives | 5 |
| Low-Level Tasks | 10 |
| Database Tables | 5 |
| API Endpoints | 7 major + 3 webhook |
| agents.md Lines | 550+ |
| Domain Rules | 7 critical |
| GitHub Copilot Instructions Lines | 400+ |
| Patterns (Always/Never) | 15 total |
| Security Checklist Items | 8 |
| Performance Targets | 5 |
| Compliance Frameworks | 4 (PCI-DSS, GDPR, SOC 2, OWASP) |
| Test Coverage Target | 90%+ |

---

## 💡 What Makes This Specification AI-Ready

### 1. **Explicit Task Structure**
Each low-level task includes:
- ✅ Specific AI prompt to copy-paste
- ✅ Exact file paths to create/update
- ✅ Function/class names to implement
- ✅ Detailed requirements and constraints

### 2. **Unambiguous Patterns**
- ✅ Code examples showing ✅ CORRECT and ❌ WRONG
- ✅ Domain rules with specific constraints
- ✅ Forbidden patterns explicitly listed

### 3. **Clear Success Criteria**
- ✅ Performance SLAs (latency targets)
- ✅ Test coverage requirements (90%+)
- ✅ Compliance checkpoints (PCI-DSS, GDPR)
- ✅ Security validations (authentication, encryption)

### 4. **Implementation Roadmap**
- ✅ 10 tasks in logical dependency order
- ✅ Each task self-contained but building on previous
- ✅ Clear integration points between tasks
- ✅ Estimates provided (typically 2-3 weeks per task)

---

## 🎓 Learning Outcomes for AI Coding Partners

By following this specification, AI agents will learn:

1. **FinTech Domain Knowledge**
   - Virtual card lifecycle management
   - PCI-DSS compliance requirements
   - Fraud detection patterns
   - Transaction authorization flows

2. **Security Best Practices**
   - Field-level encryption implementation
   - OAuth 2.0 + JWT authentication
   - Role-based access control (RBAC)
   - Audit trail design patterns

3. **TypeScript + Express.js Mastery**
   - Async/await patterns for I/O-heavy operations
   - Zod schema validation
   - Prisma ORM with type-safe queries
   - Error handling and custom exceptions

4. **Testing Disciplines**
   - Unit test patterns (>90% coverage)
   - Integration testing with real databases
   - Security testing (OWASP Top 10)
   - Performance testing and benchmarking

5. **Compliance & Audit Thinking**
   - Audit trail design
   - Data retention policies
   - Regulatory requirement mapping
   - Compliance reporting automation

---

## 📝 Next Steps

### If Implementing This Specification:

1. Set up Node.js 18+ with TypeScript 5.0+ + Express.js project structure
2. Initialize Prisma and create schema (Task #1)
3. Implement card creation API (Task #2)
4. Build card freeze/unfreeze functionality (Task #3)
5. Create transaction authorization webhook (Task #4)
6. Continue with remaining tasks in order

### If Reviewing/Auditing:

1. Verify all security patterns from .github/copilot-instructions.md
2. Check PCI-DSS compliance against checklist in agents.md
3. Validate >90% test coverage requirement
4. Ensure audit logs created for all operations
5. Review encryption implementation for sensitive data

---

## 📞 Contact & Support

- **Author**: Andrii Orel
- **Course**: AI as a Personalized Coding Partner
- **Date**: February 17, 2026
- **Version**: 1.0

---

<div align="center">

### 🎯 Specification Complete and Ready for Implementation

This specification package demonstrates specification-driven design with security, compliance, and performance as primary concerns. It provides AI coding partners with everything needed to implement a production-grade FinTech application.

**Total Package Size**: 1,600+ lines of specification and guidelines  
**Regulatory Coverage**: PCI-DSS, GDPR, SOC 2, OWASP Top 10  
**AI-Ready**: Explicit prompts, patterns, and constraints for autonomous implementation

</div>


