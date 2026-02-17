# 🏦 Banking Transactions API

> **Author:** Andrii Orel  
> **Course:** AI as a Personalized Coding Partner  
> **Homework:** #1 - Simple REST API with AI Assistance

A REST API for managing banking transactions with filtering, validation, and account balance tracking.

---

## 📋 Project Overview

This project demonstrates the use of AI coding assistants to build a functional banking transactions API. The implementation includes:

- ✅ Core CRUD operations for transactions
- ✅ Transaction validation (amount, currency, account format)
- ✅ Transaction filtering (by account, type, date range)
- ✅ Account balance calculation
- ✅ In-memory storage (no database required)
- ✅ Error handling with meaningful messages

---

## 🤖 AI Tools Used

- **GitHub Copilot** - Code generation and autocomplete
- **Claude Code** - Architecture planning and documentation
- **ChatGPT** - Problem-solving and validation logic

---

## ✨ Features

### Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create new transaction |
| `GET` | `/transactions` | List all transactions (with filters) |
| `GET` | `/transactions/:id` | Get transaction by ID |
| `GET` | `/accounts/:accountId/balance` | Get account balance |

### Transaction Model
```json
{
  "id": "auto-generated-uuid",
  "fromAccount": "ACC-12345",
  "toAccount": "ACC-67890",
  "amount": 100.50,
  "currency": "USD",
  "type": "transfer",
  "timestamp": "2026-02-17T12:00:00Z",
  "status": "completed"
}
```

### Validation Rules
- ✅ Amount must be positive with max 2 decimal places
- ✅ Account format: `ACC-XXXXX` (alphanumeric)
- ✅ Currency: Valid ISO 4217 codes (USD, EUR, GBP, JPY)
- ✅ Type: deposit | withdrawal | transfer

### Filtering Options
- By account: `?accountId=ACC-12345`
- By type: `?type=transfer`
- By date range: `?from=2024-01-01&to=2024-01-31`
- Combine multiple filters

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.x
- npm >= 8.x

### Installation

```bash
cd homework-1
npm install
npm start
```

Server runs at: `http://localhost:3000`

---

## 📖 API Usage Examples

### Create Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer"
  }'
```

### List All Transactions
```bash
curl -X GET http://localhost:3000/transactions
```

### Filter Transactions
```bash
# By account
curl -X GET "http://localhost:3000/transactions?accountId=ACC-12345"

# By type
curl -X GET "http://localhost:3000/transactions?type=transfer"

# By date range
curl -X GET "http://localhost:3000/transactions?from=2024-01-01&to=2024-01-31"
```

### Get Account Balance
```bash
curl -X GET http://localhost:3000/accounts/ACC-12345/balance
```

---

## 🏗️ Project Structure

```
homework-1/
├── src/
│   ├── index.js           # Express app entry point
│   ├── routes/            # API route handlers
│   ├── validators/        # Input validation logic
│   └── utils/             # Helper functions
├── docs/
│   └── screenshots/       # AI interaction screenshots
├── HOWTORUN.md           # Detailed setup guide
├── TASKS.md              # Assignment requirements
└── README.md             # This file
```

---

## 🔧 Technology Stack

- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Validation:** Custom validators
- **Storage:** In-memory (Array/Object)
- **Testing:** Manual testing (curl/Postman)

---

## ✅ Validation Examples

### Successful Request
```json
{
  "fromAccount": "ACC-12345",
  "toAccount": "ACC-67890",
  "amount": 100.50,
  "currency": "USD",
  "type": "transfer"
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be a positive number"
    },
    {
      "field": "currency",
      "message": "Invalid currency code"
    }
  ]
}
```

---

## 📸 Screenshots

See `docs/screenshots/` for:
- AI tool interactions and prompts
- Application running successfully
- API request/response examples

---

## 🎓 Learning Outcomes

Through this assignment, I learned:

1. **AI-Assisted Development**
   - How to effectively prompt AI tools for code generation
   - Comparing different AI tools' approaches to the same problem
   - When to rely on AI vs. manual coding

2. **API Design**
   - RESTful endpoint design
   - Input validation best practices
   - Error handling and HTTP status codes

3. **Documentation**
   - Documenting AI-assisted workflows
   - Creating clear API documentation
   - Capturing development process with screenshots

---

## 🚧 Known Limitations

- In-memory storage (data lost on restart)
- No authentication/authorization
- No database persistence
- Basic validation (suitable for learning)

---

## 📝 Future Enhancements

- [ ] Add database persistence (PostgreSQL/MongoDB)
- [ ] Implement authentication with JWT
- [ ] Add transaction history pagination
- [ ] Implement rate limiting
- [ ] Add automated tests (Jest/Mocha)
- [ ] Add API documentation (Swagger/OpenAPI)

---

## 📄 License

ISC

---

<div align="center">

**Created with AI assistance as part of AI Coding Partner course**  
*Last Updated: February 2026*

</div>

