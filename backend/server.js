'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const taskRouter = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// JSON body parser — reject bodies larger than 1 MB
app.use(express.json({ limit: '1mb' }));

// CORS — use FRONTEND_URL when set, otherwise allow all origins
const corsOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: corsOrigin }));

// Mount task router
app.use('/api/tasks', taskRouter);

// Global error handler — must be last
app.use(errorHandler);

// Connect to MongoDB, then start listening
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
