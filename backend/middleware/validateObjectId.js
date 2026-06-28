const mongoose = require('mongoose');

/**
 * Express middleware that validates MongoDB ObjectId URL parameters.
 * Checks req.params.id using mongoose.Types.ObjectId.isValid().
 * Returns HTTP 400 with { success: false, message: "Invalid task ID" } if invalid.
 * Calls next() if valid.
 */
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid task ID' });
  }
  next();
};

module.exports = validateObjectId;
