'use strict';

// Feature: task-manager-app
// Integration tests for task CRUD endpoints (Properties 5, 6, 7, 10, 11, 12)
// Requirements: 3.1–3.13, 4.1–4.4, 5.1–5.8, 6.1–6.7, 7.1–7.4

const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// We need the full Express app (but without actually starting the HTTP server).
// Build it in a factory to avoid the server.listen() call in server.js.
const express = require('express');
const cors = require('cors');
const taskRoutes = require('../routes/taskRoutes');
const errorHandler = require('../middleware/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());
  app.use('/api/tasks', taskRoutes);
  app.use(errorHandler);
  return app;
}

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  app = buildApp();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
}, 30000);

beforeEach(async () => {
  // Clear all tasks before each test for isolation
  const Task = require('../models/Task');
  await Task.deleteMany({});
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function createTask(overrides = {}) {
  const defaults = {
    title: 'Test task',
    description: 'Test description',
    status: 'todo',
    priority: 'medium',
  };
  const res = await request(app)
    .post('/api/tasks')
    .send({ ...defaults, ...overrides });
  return res.body.data;
}

// ---------------------------------------------------------------------------
// POST /api/tasks — create task (Properties 10, Requirements 5.1–5.8)
// ---------------------------------------------------------------------------
describe('POST /api/tasks', () => {
  it('creates a task and returns 201 with the new task data (Req 5.1)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Buy groceries', status: 'todo', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('Buy groceries');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it('returns 400 when title is missing (Req 5.2)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ status: 'todo' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when title is whitespace only (Req 5.2)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when title exceeds 100 characters (Req 5.3)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when description exceeds 500 characters (Req 5.4)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid', description: 'd'.repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid status value (Req 5.5)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid', status: 'invalid-status' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid priority value (Req 5.6)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid', priority: 'urgent' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('applies default status and priority when not provided', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Defaults test' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks/:id — get by ID (Property 10, Requirements 4.1–4.4)
// ---------------------------------------------------------------------------
describe('GET /api/tasks/:id', () => {
  it('returns 200 with the task when found (Req 4.1)', async () => {
    const created = await createTask({ title: 'Find me' });

    const res = await request(app).get(`/api/tasks/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(created._id);
    expect(res.body.data.title).toBe('Find me');
  });

  it('returns 404 for a valid but non-existent ID (Req 4.2)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/tasks/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 400 for a malformed ID (Req 4.3)', async () => {
    const res = await request(app).get('/api/tasks/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks — list with filters (Properties 5, 6, 7, Requirements 3.1–3.12)
// ---------------------------------------------------------------------------
describe('GET /api/tasks', () => {
  it('returns 200 with all tasks sorted by createdAt desc by default (Property 5, Req 3.1)', async () => {
    // Create tasks with staggered creation times
    const t1 = await createTask({ title: 'First created' });
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));
    const t2 = await createTask({ title: 'Second created' });
    await new Promise((r) => setTimeout(r, 10));
    const t3 = await createTask({ title: 'Third created' });

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);

    // Newest first
    expect(res.body.data[0]._id).toBe(t3._id);
    expect(res.body.data[1]._id).toBe(t2._id);
    expect(res.body.data[2]._id).toBe(t1._id);
  });

  it('filters by status — only returns matching tasks (Property 6, Req 3.2)', async () => {
    await createTask({ title: 'Todo task', status: 'todo' });
    await createTask({ title: 'Done task', status: 'done' });
    await createTask({ title: 'In progress task', status: 'in-progress' });

    const res = await request(app).get('/api/tasks?status=todo');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('todo');
  });

  it('filters by priority — only returns matching tasks (Property 6, Req 3.3)', async () => {
    await createTask({ title: 'Low', priority: 'low' });
    await createTask({ title: 'Medium', priority: 'medium' });
    await createTask({ title: 'High', priority: 'high' });

    const res = await request(app).get('/api/tasks?priority=high');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].priority).toBe('high');
  });

  it('filters by search — case-insensitive substring match in title (Property 7, Req 3.4)', async () => {
    await createTask({ title: 'Buy grocery items', description: 'Food items' });
    await createTask({ title: 'Write report', description: 'Work tasks' });
    await createTask({ title: 'GROCERY list', description: 'Shopping' });

    const res = await request(app).get('/api/tasks?search=grocery');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const titles = res.body.data.map((t) => t.title);
    expect(titles).toContain('Buy grocery items');
    expect(titles).toContain('GROCERY list');
  });

  it('filters by search — matches in description too (Property 7, Req 3.4)', async () => {
    await createTask({ title: 'Task A', description: 'Contains keyword here' });
    await createTask({ title: 'Task B', description: 'Nothing special' });

    const res = await request(app).get('/api/tasks?search=KEYWORD');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Task A');
  });

  it('returns 400 for invalid status query param (Property 9, Req 3.10)', async () => {
    const res = await request(app).get('/api/tasks?status=invalid');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid priority query param (Property 9, Req 3.11)', async () => {
    const res = await request(app).get('/api/tasks?priority=urgent');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('falls back to createdAt desc for unrecognized sort param (Req 3.12)', async () => {
    const t1 = await createTask({ title: 'Task A' });
    await new Promise((r) => setTimeout(r, 10));
    const t2 = await createTask({ title: 'Task B' });

    const res = await request(app).get('/api/tasks?sort=unknown_sort');

    expect(res.status).toBe(200);
    // Should still return results sorted by createdAt desc
    expect(res.body.data[0]._id).toBe(t2._id);
    expect(res.body.data[1]._id).toBe(t1._id);
  });

  it('returns empty array when no tasks exist (Req 3.1)', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('sorts by createdAt ascending when sort=createdAt_asc (Req 3.6)', async () => {
    const t1 = await createTask({ title: 'First' });
    await new Promise((r) => setTimeout(r, 10));
    const t2 = await createTask({ title: 'Second' });
    await new Promise((r) => setTimeout(r, 10));
    const t3 = await createTask({ title: 'Third' });

    const res = await request(app).get('/api/tasks?sort=createdAt_asc');

    expect(res.status).toBe(200);
    expect(res.body.data[0]._id).toBe(t1._id);
    expect(res.body.data[2]._id).toBe(t3._id);
  });

  it('sorts by priority descending (high>medium>low) when sort=priority_desc (Req 3.8)', async () => {
    await createTask({ title: 'Low prio', priority: 'low' });
    await createTask({ title: 'High prio', priority: 'high' });
    await createTask({ title: 'Medium prio', priority: 'medium' });

    const res = await request(app).get('/api/tasks?sort=priority_desc');

    expect(res.status).toBe(200);
    expect(res.body.data[0].priority).toBe('high');
    expect(res.body.data[1].priority).toBe('medium');
    expect(res.body.data[2].priority).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/tasks/:id — update task (Property 11, Requirements 6.1–6.7)
// ---------------------------------------------------------------------------
describe('PUT /api/tasks/:id', () => {
  it('updates a task and returns 200 with full updated task (Req 6.1)', async () => {
    const created = await createTask({ title: 'Original', status: 'todo' });

    const res = await request(app)
      .put(`/api/tasks/${created._id}`)
      .send({ title: 'Updated', status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated');
    expect(res.body.data.status).toBe('done');
    // Non-updated fields preserved
    expect(res.body.data.priority).toBe(created.priority);
  });

  it('returns 404 for a valid ID that does not exist (Req 6.2)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when body is empty (Req 6.3)', async () => {
    const created = await createTask();

    const res = await request(app)
      .put(`/api/tasks/${created._id}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when body contains no recognized fields (Req 6.3)', async () => {
    const created = await createTask();

    const res = await request(app)
      .put(`/api/tasks/${created._id}`)
      .send({ unknownField: 'value' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when title exceeds 100 chars (Req 6.4)', async () => {
    const created = await createTask();

    const res = await request(app)
      .put(`/api/tasks/${created._id}`)
      .send({ title: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid status value (Req 6.5)', async () => {
    const created = await createTask();

    const res = await request(app)
      .put(`/api/tasks/${created._id}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid priority value (Req 6.6)', async () => {
    const created = await createTask();

    const res = await request(app)
      .put(`/api/tasks/${created._id}`)
      .send({ priority: 'critical' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for a malformed ID (Req 4.3)', async () => {
    const res = await request(app)
      .put('/api/tasks/not-valid')
      .send({ title: 'Updated' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:id — delete task (Property 12, Requirements 7.1–7.4)
// ---------------------------------------------------------------------------
describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns 200 with empty data (Req 7.1)', async () => {
    const created = await createTask({ title: 'To delete' });

    const res = await request(app).delete(`/api/tasks/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({});
  });

  it('task is no longer retrievable after deletion (Property 12, Req 7.1)', async () => {
    const created = await createTask({ title: 'To delete' });

    await request(app).delete(`/api/tasks/${created._id}`);

    const getRes = await request(app).get(`/api/tasks/${created._id}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for a valid but non-existent ID (Req 7.2)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/tasks/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 400 for a malformed ID (Req 7.3)', async () => {
    const res = await request(app).delete('/api/tasks/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/tasks/reorder — reorder tasks (Requirement 16.2)
// ---------------------------------------------------------------------------
describe('PATCH /api/tasks/reorder', () => {
  it('returns 200 when a valid ordered IDs array is provided', async () => {
    const t1 = await createTask({ title: 'Task 1' });
    const t2 = await createTask({ title: 'Task 2' });
    const t3 = await createTask({ title: 'Task 3' });

    const res = await request(app)
      .patch('/api/tasks/reorder')
      .send({ orderedIds: [t3._id, t1._id, t2._id] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when orderedIds is not an array', async () => {
    const res = await request(app)
      .patch('/api/tasks/reorder')
      .send({ orderedIds: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
