const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket');
const { validateTicket, validateTickets } = require('../validators/ticketValidator');
const ClassificationService = require('../services/classificationService');
const CSVParser = require('../parsers/csvParser');
const JSONParser = require('../parsers/jsonParser');
const XMLParser = require('../parsers/xmlParser');

// POST /tickets - Create a new ticket
router.post('/', async (req, res) => {
  const autoClassify = req.query.autoClassify !== 'false';

  const validation = validateTicket(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
  }

  const ticket = Ticket.create(validation.data);

  if (autoClassify) {
    const classification = ClassificationService.classify(ticket);
    ticket.category = classification.category;
    ticket.priority = classification.priority;
    ticket.classification = {
      ...classification,
      classified_at: new Date().toISOString(),
      manual_override: false,
    };
    Ticket.update(ticket.id, ticket.toJSON());
  }

  res.status(201).json(ticket.toJSON());
});

// GET /tickets - List all tickets with optional filtering
router.get('/', (req, res) => {
  const filters = {};

  if (req.query.category) filters.category = req.query.category;
  if (req.query.priority) filters.priority = req.query.priority;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.customer_id) filters.customer_id = req.query.customer_id;
  if (req.query.search) filters.search = req.query.search;

  const tickets = Ticket.findByFilter(filters);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const end = start + limit;

  const paginatedTickets = tickets.slice(start, end);

  res.json({
    data: paginatedTickets.map(t => t.toJSON()),
    pagination: {
      page,
      limit,
      total: tickets.length,
      pages: Math.ceil(tickets.length / limit),
    },
  });
});

// GET /tickets/:id - Get a specific ticket
router.get('/:id', (req, res) => {
  const ticket = Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  res.json(ticket.toJSON());
});

// PUT /tickets/:id - Update a ticket
router.put('/:id', (req, res) => {
  const ticket = Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const validation = validateTicket({ ...ticket.toJSON(), ...req.body }, false);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
  }

  const updated = Ticket.update(req.params.id, validation.data);
  res.json(updated.toJSON());
});

// DELETE /tickets/:id - Delete a ticket
router.delete('/:id', (req, res) => {
  const ticket = Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  Ticket.delete(req.params.id);
  res.status(204).send();
});

// POST /tickets/import - Bulk import tickets from CSV/JSON/XML
router.post('/import', express.raw({ type: 'text/*', limit: '10mb' }), async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'No file content provided' });
  }

  const contentType = req.get('content-type') || '';
  const autoClassify = req.query.autoClassify !== 'false';

  let parseResult;
  const content = req.body.toString('utf-8');

  if (contentType.includes('csv')) {
    parseResult = CSVParser.parse(content);
  } else if (contentType.includes('json')) {
    parseResult = JSONParser.parse(content);
  } else if (contentType.includes('xml')) {
    parseResult = await XMLParser.parse(content);
  } else {
    return res.status(400).json({
      error: 'Unsupported content type. Use text/csv, application/json, or application/xml',
    });
  }

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Failed to parse file',
      details: parseResult.error,
    });
  }

  const validation = validateTickets(parseResult.data);

  // Create tickets from validated data
  const createdTickets = [];
  validation.validated.forEach(data => {
    const ticket = Ticket.create(data);

    if (autoClassify) {
      const classification = ClassificationService.classify(ticket);
      ticket.category = classification.category;
      ticket.priority = classification.priority;
      ticket.classification = {
        ...classification,
        classified_at: new Date().toISOString(),
        manual_override: false,
      };
      Ticket.update(ticket.id, ticket.toJSON());
    }

    createdTickets.push(ticket.toJSON());
  });

  res.status(201).json({
    summary: {
      total: validation.total,
      successful: validation.successful,
      failed: validation.failed,
    },
    tickets: createdTickets,
    errors: validation.errors.length > 0 ? validation.errors : undefined,
  });
});

// POST /tickets/:id/auto-classify - Auto-classify a ticket
router.post('/:id/auto-classify', (req, res) => {
  const ticket = Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const result = ClassificationService.autoClassifyTicket(req.params.id);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  const updated = Ticket.findById(req.params.id);
  res.json({
    ticket: updated.toJSON(),
    classification: result.classification,
  });
});

module.exports = router;

