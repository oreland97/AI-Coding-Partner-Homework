# 🏦 Homework 1: Banking Transactions API

> **Student Name**: [Your Name]
> **Date Submitted**: [Date]
> **AI Tools Used**: [List tools, e.g., Claude Code, GitHub Copilot]

---

## 📋 Project Overview

[Briefly describe your implementation - what you built and the key features]

---

## ✅ Features Implemented

- [ ] Task 1: Core API (POST, GET transactions, GET balance)
- [ ] Task 2: Transaction Validation
- [ ] Task 3: Transaction Filtering
- [ ] Task 4: Additional Feature - [specify which option]

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | [Node.js / Python / Java] |
| **Framework** | [Express / Flask / FastAPI / Spring Boot] |
| **Other Tools** | [Any other tools or libraries used] |

---

## 🏗️ Architecture

[Describe your project structure and any architecture decisions]

```
src/
├── [describe your file organization]
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create a new transaction |
| `GET` | `/transactions` | List all transactions |
| `GET` | `/transactions/:id` | Get transaction by ID |
| `GET` | `/accounts/:accountId/balance` | Get account balance |
| [Add any additional endpoints] | | |

---

## ▶️ How to Run

See [HOWTORUN.md](./HOWTORUN.md) for detailed instructions.

**Quick Start:**
```bash
# Install dependencies
npm install  # or: pip install -r requirements.txt

# Run the application
npm start    # or: python app.py

# The API will be available at http://localhost:3000
```

---

## 🧪 Sample Requests

```bash
# Create a transaction
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "ACC-12345", "toAccount": "ACC-67890", "amount": 100.50, "currency": "USD", "type": "transfer"}'

# Get all transactions
curl http://localhost:3000/transactions
```

---

## 🤖 AI Tools Usage Summary

[Brief summary of how AI tools helped - detailed log in AI-COMPARISON.md]

| Aspect | Details |
|--------|---------|
| **Most helpful for** | [e.g., boilerplate code, validation logic, etc.] |
| **Challenges** | [Any issues encountered with AI tools] |
| **Key learnings** | [What you learned about working with AI assistants] |

---

## 📸 Screenshots

See `docs/screenshots/` folder for:
- 🤖 AI tool interaction screenshots
- ✅ API running demonstration
- 📝 Sample request/response examples

---

## ⚠️ Known Limitations

[List any known issues or limitations of your implementation]

---

## 🚀 Future Improvements

[Ideas for extending this project if you had more time]

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
