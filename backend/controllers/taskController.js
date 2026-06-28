'use strict';

const Task = require('../models/Task');

// Valid enum values for query param validation
const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Sort mapping for recognized sort keys
const SORT_MAP = {
  createdAt_desc: { type: 'simple', sort: { createdAt: -1 } },
  createdAt_asc:  { type: 'simple', sort: { createdAt:  1 } },
  dueDate_asc: {
    type: 'aggregation',
    pipeline: (filter) => [
      { $match: filter },
      {
        $addFields: {
          hasDueDate: { $cond: [{ $ifNull: ['$dueDate', false] }, 1, 0] },
        },
      },
      { $sort: { hasDueDate: -1, dueDate: 1 } },
    ],
  },
  priority_desc: {
    type: 'aggregation',
    pipeline: (filter) => [
      { $match: filter },
      {
        $addFields: {
          priorityRank: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'high']   }, then: 3 },
                { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                { case: { $eq: ['$priority', 'low']    }, then: 1 },
              ],
              default: 0,
            },
          },
        },
      },
      { $sort: { priorityRank: -1 } },
      { $project: { priorityRank: 0 } },
    ],
  },
};

/**
 * GET /api/tasks
 * Returns all tasks with optional filtering and sorting.
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { status, priority, search, sort } = req.query;

    // Build filter object
    const filter = {};

    // Validate and apply status filter
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      filter.status = status;
    }

    // Validate and apply priority filter
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority value' });
      }
      filter.priority = priority;
    }

    // Apply search filter (case-insensitive substring match on title or description)
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine sort strategy — fall back to createdAt_desc for unrecognized values
    const sortKey = sort && SORT_MAP[sort] ? sort : 'createdAt_desc';
    const sortConfig = SORT_MAP[sortKey];

    let data;

    if (sortConfig.type === 'aggregation') {
      data = await Task.aggregate(sortConfig.pipeline(filter));
    } else {
      data = await Task.find(filter).sort(sortConfig.sort).lean();
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/:id
 * Returns a single task by its ID.
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks
 * Creates a new task.
 */
const createTask = async (req, res, next) => {
  try {
    const newTask = await new Task(req.body).save();
    return res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const validationErr = new Error(err.message);
      validationErr.status = 400;
      return next(validationErr);
    }
    next(err);
  }
};

// Fields that are allowed to be updated
const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

/**
 * PUT /api/tasks/:id
 * Updates an existing task by its ID.
 */
const updateTask = async (req, res, next) => {
  try {
    // Build updateData from only recognized fields present in req.body
    const updateData = {};
    for (const field of UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    }

    // Require at least one recognized field
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, data: updatedTask });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const validationErr = new Error(err.message);
      validationErr.status = 400;
      return next(validationErr);
    }
    next(err);
  }
};

/**
 * DELETE /api/tasks/:id
 * Deletes a task by its ID.
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.status(200).json({ success: true, data: {} });
  } catch (err) {
    const serverErr = new Error(err.message || 'An unexpected error occurred');
    serverErr.status = 500;
    next(serverErr);
  }
};

/**
 * PATCH /api/tasks/reorder
 * Bulk-updates the `order` field for a list of task IDs.
 * Body: { orderedIds: [id, ...] }
 * Sets order = index for each task at its position in the array.
 */
const reorderTasks = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps);
    }

    return res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, reorderTasks };
