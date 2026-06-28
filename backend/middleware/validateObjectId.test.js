'use strict';

// Feature: task-manager-app
// Unit tests for validateObjectId middleware
// Requirements: 4.3, 7.3

const { describe, it, expect } = require('@jest/globals');
const mongoose = require('mongoose');
const validateObjectId = require('./validateObjectId');

/**
 * Creates a mock Express response capturing status + json output.
 */
function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

describe('validateObjectId middleware', () => {
  it('calls next() for a valid MongoDB ObjectId', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const req = { params: { id: validId } };
    const res = mockRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.body).toBeUndefined(); // no response sent
  });

  it('returns 400 for a string that is not a valid ObjectId (Req 4.3, 7.3)', () => {
    const req = { params: { id: 'not-an-object-id' } };
    const res = mockRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid task ID');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty string', () => {
    const req = { params: { id: '' } };
    const res = mockRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for a short numeric string', () => {
    const req = { params: { id: '12345' } };
    const res = mockRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a 24-char hex string that is a valid ObjectId', () => {
    const req = { params: { id: '507f1f77bcf86cd799439011' } };
    const res = mockRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
