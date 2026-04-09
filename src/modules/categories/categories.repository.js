export class CategoriesRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findAllForUser(userId, client = null) {
    const db = client || this.pool;
    // Get all custom categories for the user AND all default categories (user_id IS NULL)
    const { rows } = await db.query(
      `SELECT id, user_id, name, type, icon, color, is_default, created_at, updated_at 
       FROM categories 
       WHERE (user_id = $1 OR is_default = TRUE) AND deleted_at IS NULL
       ORDER BY type, name`,
      [userId]
    );
    return rows;
  }

  async findByIdAndUser(id, userId, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      `SELECT id, user_id, name, type, icon, color, is_default 
       FROM categories 
       WHERE id = $1 AND (user_id = $2 OR is_default = TRUE) AND deleted_at IS NULL`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(category, client = null) {
    const db = client || this.pool;
    const { user_id, name, type, icon, color } = category;
    
    const { rows } = await db.query(
      `INSERT INTO categories (user_id, name, type, icon, color, is_default)
       VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id`,
      [user_id, name, type, icon || null, color || null]
    );
    
    return this.findByIdAndUser(rows[0].id, user_id, client);
  }

  async update(id, userId, data, client = null) {
    const db = client || this.pool;
    const fields = [];
    const values = [];

    // You cannot update `type` as it could corrupt existing transactions
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'type') {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findByIdAndUser(id, userId, client);

    values.push(id, userId);

    // Ensure we only update if user_id matches (to prevent modifying defaults)
    await db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length} AND is_default = FALSE AND deleted_at IS NULL`,
      values
    );

    return this.findByIdAndUser(id, userId, client);
  }

  async delete(id, userId, client = null) {
    const db = client || this.pool;
    // Soft Delete
    const result = await db.query(
      `UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND is_default = FALSE AND deleted_at IS NULL`,
      [id, userId]
    );
    
    return result.rowCount > 0;
  }
}
