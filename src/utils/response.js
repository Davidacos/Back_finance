/**
 * Send a standardized success response
 * @param {import('express').Response} res
 * @param {object} data
 * @param {number} [statusCode=200]
 * @param {string} [message='Success']
 */
export const sendSuccess = (res, data = null, statusCode = 200, message = 'Success') => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Send a standardized error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {string|null} [error=null]
 */
export const sendError = (res, message, statusCode = 500, error = null) => {
  const payload = { success: false, message };
  if (error) payload.error = error;
  return res.status(statusCode).json(payload);
};
