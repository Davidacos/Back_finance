export class FixedExpensesRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findAllForUser(userId, includeInactive = false, client = null) {
    const db = client || this.pool;
    let query = `
      SELECT 
        f.*,
        c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM fixed_expenses f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.user_id = $1 AND f.deleted_at IS NULL
    `;

    if (!includeInactive) {
      query += ` AND f.is_active = TRUE`;
    }

    query += ` ORDER BY f.start_date DESC`;

    const { rows } = await db.query(query, [userId]);

    return rows.map(row => {
      const { category_name, category_icon, category_color, ...expense } = row;
      return {
        ...expense,
        category: {
          id: expense.category_id,
          name: category_name,
          icon: category_icon,
          color: category_color
        }
      };
    });
  }

  async findByIdAndUser(id, userId, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      `SELECT * FROM fixed_expenses WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(expense, client = null) {
    const db = client || this.pool;
    const { 
      user_id, category_id, name, amount, frequency, 
      day_of_month, start_date, end_date, description 
    } = expense;
    
    // Explicitly handling MySQL's CURRENT_DATE fallback
    const effectiveStartDate = start_date || new Date().toISOString().split('T')[0];
    
    const { rows } = await db.query(
      `INSERT INTO fixed_expenses 
       (user_id, category_id, name, amount, frequency, day_of_month, start_date, end_date, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE) RETURNING id`,
      [
        user_id, category_id, name, amount, frequency, 
        day_of_month || null, effectiveStartDate, end_date || null, description || null
      ]
    );

    return this.findByIdAndUser(rows[0].id, user_id, client);
  }

  async update(id, userId, data, client = null) {
    const db = client || this.pool;
    const fields = [];
    const values = [];

    const safeData = { ...data };

    for (const [key, value] of Object.entries(safeData)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findByIdAndUser(id, userId, client);

    values.push(id, userId);

    await db.query(
      `UPDATE fixed_expenses SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length} AND deleted_at IS NULL`,
      values
    );

    return this.findByIdAndUser(id, userId, client);
  }

  async delete(id, userId, client = null) {
    const db = client || this.pool;
    const result = await db.query(
      `UPDATE fixed_expenses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rowCount > 0;
  }
}
