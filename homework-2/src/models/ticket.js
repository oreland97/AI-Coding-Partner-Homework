const { randomUUID } = require('crypto');

// In-memory storage using Map
const ticketsStorage = new Map();

// Valid enums
const CATEGORIES = ['account_access', 'technical_issue', 'billing_question', 'feature_request', 'bug_report', 'other'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const STATUSES = ['new', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const SOURCES = ['web_form', 'email', 'api', 'chat', 'phone'];
const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];

class Ticket {
  constructor(data) {
    this.id = data.id || randomUUID();
    this.customer_id = data.customer_id;
    this.customer_email = data.customer_email;
    this.customer_name = data.customer_name;
    this.subject = data.subject;
    this.description = data.description;
    this.category = data.category || 'other';
    this.priority = data.priority || 'medium';
    this.status = data.status || 'new';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.resolved_at = data.resolved_at || null;
    this.assigned_to = data.assigned_to || null;
    this.tags = data.tags || [];
    this.metadata = data.metadata || {
      source: 'api',
      browser: null,
      device_type: null,
    };

    // Classification info
    this.classification = data.classification || null;
  }

  toJSON() {
    return {
      id: this.id,
      customer_id: this.customer_id,
      customer_email: this.customer_email,
      customer_name: this.customer_name,
      subject: this.subject,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      resolved_at: this.resolved_at,
      assigned_to: this.assigned_to,
      tags: this.tags,
      metadata: this.metadata,
      classification: this.classification,
    };
  }
}

// Static methods for in-memory operations
Ticket.create = function(data) {
  const ticket = new Ticket(data);
  ticketsStorage.set(ticket.id, ticket);
  return ticket;
};

Ticket.findById = function(id) {
  return ticketsStorage.get(id) || null;
};

Ticket.findAll = function() {
  return Array.from(ticketsStorage.values());
};

Ticket.findByFilter = function(filters = {}) {
  let results = Array.from(ticketsStorage.values());

  if (filters.category) {
    results = results.filter(t => t.category === filters.category);
  }

  if (filters.priority) {
    results = results.filter(t => t.priority === filters.priority);
  }

  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }

  if (filters.customer_id) {
    results = results.filter(t => t.customer_id === filters.customer_id);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      t =>
        t.subject.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.customer_name.toLowerCase().includes(searchLower)
    );
  }

  return results;
};

Ticket.update = function(id, data) {
  const ticket = ticketsStorage.get(id);
  if (!ticket) return null;

  Object.assign(ticket, {
    ...data,
    id: ticket.id, // Prevent ID override
    created_at: ticket.created_at, // Prevent created_at override
    updated_at: new Date().toISOString(),
  });

  ticketsStorage.set(id, ticket);
  return ticket;
};

Ticket.delete = function(id) {
  return ticketsStorage.delete(id);
};

Ticket.clear = function() {
  ticketsStorage.clear();
};

Ticket.count = function() {
  return ticketsStorage.size;
};

// Export valid enums
Ticket.CATEGORIES = CATEGORIES;
Ticket.PRIORITIES = PRIORITIES;
Ticket.STATUSES = STATUSES;
Ticket.SOURCES = SOURCES;
Ticket.DEVICE_TYPES = DEVICE_TYPES;

module.exports = Ticket;

