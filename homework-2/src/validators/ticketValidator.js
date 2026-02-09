const Joi = require('joi');
const Ticket = require('../models/ticket');

const ticketSchema = Joi.object({
  customer_id: Joi.string().required().messages({
    'any.required': 'customer_id is required',
  }),
  customer_email: Joi.string().email().required().messages({
    'any.required': 'customer_email is required',
    'string.email': 'customer_email must be a valid email',
  }),
  customer_name: Joi.string().required().messages({
    'any.required': 'customer_name is required',
  }),
  subject: Joi.string().min(1).max(200).required().messages({
    'any.required': 'subject is required',
    'string.max': 'subject must not exceed 200 characters',
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    'any.required': 'description is required',
    'string.min': 'description must be at least 10 characters',
    'string.max': 'description must not exceed 2000 characters',
  }),
  category: Joi.string().valid(...Ticket.CATEGORIES).messages({
    'any.only': `category must be one of: ${Ticket.CATEGORIES.join(', ')}`,
  }),
  priority: Joi.string().valid(...Ticket.PRIORITIES).messages({
    'any.only': `priority must be one of: ${Ticket.PRIORITIES.join(', ')}`,
  }),
  status: Joi.string().valid(...Ticket.STATUSES).messages({
    'any.only': `status must be one of: ${Ticket.STATUSES.join(', ')}`,
  }),
  assigned_to: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  metadata: Joi.object({
    source: Joi.string().valid(...Ticket.SOURCES),
    browser: Joi.string().allow(null),
    device_type: Joi.string().valid(...Ticket.DEVICE_TYPES).allow(null),
  }),
});

// Validate single ticket
function validateTicket(data, isCreation = true) {
  const schema = isCreation
    ? ticketSchema
    : ticketSchema.unknown(true).fork(Object.keys(ticketSchema.describe().keys), (schema) => schema.optional());

  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return { valid: false, errors };
  }

  return { valid: true, data: value };
}

// Validate bulk import
function validateTickets(data) {
  const results = {
    total: data.length,
    successful: 0,
    failed: 0,
    errors: [],
    validated: [],
  };

  data.forEach((item, index) => {
    const validation = validateTicket(item);
    if (validation.valid) {
      results.successful += 1;
      results.validated.push(validation.data);
    } else {
      results.failed += 1;
      results.errors.push({
        row: index + 1,
        data: item,
        errors: validation.errors,
      });
    }
  });

  return results;
}

module.exports = {
  validateTicket,
  validateTickets,
};

