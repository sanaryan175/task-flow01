'use strict';

// Feature: task-manager-app
// Unit tests for errorHandler middleware
// Requirements: 8.1–8.6

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const errorHandler = require('./errorHandler');

/**
 * Creates a mock Express request (unused by errorHandler but needed for signature).
 */
function mockReq() {
  return {};
}

/**
 * Creates a spy-based mock Express response.
 * Captures the status code and JSON body written by errorHandler.
 */
function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('errorHandler — status code extraction (Req 8.1)', () => {
  it('uses err.status when present', () => {
    const err = { status: 422, message: 'Unprocessable Entity' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.statusCode).toBe(422);
  });

  it('uses err.statusCode when err.status is absent', () => {
    const err = { statusCode: 403, message: 'Forbidden' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.statusCode).toBe(403);
  });

  it('defaults to 500 when neither err.status nor err.statusCode is set', () => {
    const err = { message: 'Something went wrong' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.statusCode).toBe(500);
  });

  it('prefers err.status over err.statusCode when both present', () => {
    const err = { status: 409, statusCode: 422, message: 'Conflict' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.statusCode).toBe(409);
  });
});

describe('errorHandler — response body (Req 8.2, 8.3)', () => {
  it('returns success:false with the error message (Req 8.2)', () => {
    const err = { message: 'Task not found', status: 404 };
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Task not found');
  });

  it('returns "An unexpected error occurred" when message is empty string (Req 8.3)', () => {
    const err = { message: '' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An unexpected error occurred');
  });

  it('returns "An unexpected error occurred" when message is absent (Req 8.3)', () => {
    const err = {};
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An unexpected error occurred');
  });
});

describe('errorHandler — stack trace inclusion (Req 8.4, 8.5, 8.6)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('includes "stack" field in development mode (Req 8.4)', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Dev error');
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.stack).toBeDefined();
  });

  it('omits "stack" field in production mode (Req 8.5)', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Prod error');
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.stack).toBeUndefined();
  });

  it('omits "stack" field when NODE_ENV is not set (Req 8.6)', () => {
    delete process.env.NODE_ENV;
    const err = new Error('No env error');
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.stack).toBeUndefined();
  });

  it('omits "stack" field for arbitrary non-development NODE_ENV values (Req 8.6)', () => {
    process.env.NODE_ENV = 'staging';
    const err = new Error('Staging error');
    const res = mockRes();
    errorHandler(err, mockReq(), res, () => {});
    expect(res.body.stack).toBeUndefined();
  });
});
