/**
 * Global error handling middleware for Express.
 * Must be registered as the last middleware in the pipeline.
 *
 * @param {Error} err - The error object passed to next(err)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status ?? err.statusCode ?? 500;

  const response = {
    success: false,
    message: err.message || 'An unexpected error occurred',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
