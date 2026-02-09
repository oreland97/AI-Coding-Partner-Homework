const express = require('express');
const ticketsRouter = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/tickets', ticketsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only if not being imported as a module for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎧 Support Ticket API listening on port ${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`  - POST   /tickets              (create)`);
    console.log(`  - POST   /tickets/import       (bulk import)`);
    console.log(`  - GET    /tickets              (list)`);
    console.log(`  - GET    /tickets/:id          (retrieve)`);
    console.log(`  - PUT    /tickets/:id          (update)`);
    console.log(`  - DELETE /tickets/:id          (delete)`);
    console.log(`  - POST   /tickets/:id/auto-classify (classify)`);
  });
}

module.exports = app;

