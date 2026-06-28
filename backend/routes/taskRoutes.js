'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} = require('../controllers/taskController');
const validateObjectId = require('../middleware/validateObjectId');

// GET /api/tasks — retrieve all tasks (with optional filter/sort query params)
router.get('/', getAllTasks);

// PATCH /api/tasks/reorder — bulk-update task order fields
// IMPORTANT: must be declared BEFORE /:id routes to avoid being shadowed
router.patch('/reorder', reorderTasks);

// GET /api/tasks/:id — retrieve a single task by ID
router.get('/:id', validateObjectId, getTaskById);

// POST /api/tasks — create a new task
router.post('/', createTask);

// PUT /api/tasks/:id — update an existing task by ID
router.put('/:id', validateObjectId, updateTask);

// DELETE /api/tasks/:id — delete a task by ID
router.delete('/:id', validateObjectId, deleteTask);

module.exports = router;
