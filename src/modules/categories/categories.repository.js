export class CategoriesRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findAllForUser(userId) {
    // Get all custom categories for the user AND all default categories (user_id IS NULL)
    const { rows } = await this.pool.query(
      `SELECT id, user_id, name, type, icon, color, is_default, created_at, updated_at 
       FROM categories 
       WHERE user_id = $1 OR is_default = TRUE
       ORDER BY type, name`,
      [userId]
    );
    return rows;
  }

  async findByIdAndUser(id, userId) {
    const { rows } = await this.pool.query(
      `SELECT id, user_id, name, type, icon, color, is_default 
       FROM categories 
       WHERE id = $1 AND (user_id = $2 OR is_default = TRUE)`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(category) {
    const { user_id, name, type, icon, color } = category;
    
    const { rows } = await this.pool.query(
      `INSERT INTO categories (user_id, name, type, icon, color, is_default)
       VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id`,
      [user_id, name, type, icon || null, color || null]
    );
    
    return this.findByIdAndUser(rows[0].id, user_id);
  }

  async update(id, userId, data) {
    const fields = [];
    const values = [];

    // You cannot update `type` as it could corrupt existing transactions
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'type') {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findByIdAndUser(id, userId);

    values.push(id, userId);

    // Ensure we only update if user_id matches (to prevent modifying defaults)
    await this.pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length} AND is_default = FALSE`,
      values
    );

    return this.findByIdAndUser(id, userId);
  }

  async delete(id, userId) {
    // Only allow deletion if the category belongs to the user and is not default
    const result = await this.pool.query(
      `DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = FALSE`,
      [id, userId]
    );
    
    return result.rowCount > 0;
  }
}
