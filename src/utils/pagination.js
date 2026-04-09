/**
 * Parse pagination params from query string
 * @param {object} query
 * @returns {{ page: number, limit: number, offset: number }}
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Build pagination metadata for responses
 * @param {number} total - Total record count
 * @param {number} page
 * @param {number} limit
 */
export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
