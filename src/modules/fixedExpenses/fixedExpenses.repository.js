export class FixedExpensesRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findAllForUser(userId, includeInactive = false) {
    let query = `
      SELECT 
        f.*,
        c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM fixed_expenses f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.user_id = $1
    `;

    if (!includeInactive) {
      query += ` AND f.is_active = TRUE`;
    }

    query += ` ORDER BY f.start_date DESC`;

    const { rows } = await this.pool.query(query, [userId]);

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

  async findByIdAndUser(id, userId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM fixed_expenses WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(expense) {
    const { 
      user_id, category_id, name, amount, frequency, 
      day_of_month, start_date, end_date, description 
    } = expense;
    
    // Explicitly handling MySQL's CURRENT_DATE fallback
    const effectiveStartDate = start_date || new Date().toISOString().split('T')[0];
    
    const { rows } = await this.pool.query(
      `INSERT INTO fixed_expenses 
       (user_id, category_id, name, amount, frequency, day_of_month, start_date, end_date, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE) RETURNING id`,
      [
        user_id, category_id, name, amount, frequency, 
        day_of_month || null, effectiveStartDate, end_date || null, description || null
      ]
    );

    return this.findByIdAndUser(rows[0].id, user_id);
  }

  async update(id, userId, data) {
    const fields = [];
    const values = [];

    const safeData = { ...data };

    for (const [key, value] of Object.entries(safeData)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findByIdAndUser(id, userId);

    values.push(id, userId);

    await this.pool.query(
      `UPDATE fixed_expenses SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length}`,
      values
    );

    return this.findByIdAndUser(id, userId);
  }

  async softDelete(id, userId) {
    const result = await this.pool.query(
      `UPDATE fixed_expenses SET is_active = FALSE WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rowCount > 0;
  }
}
