export class UsersRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, email, first_name, last_name, currency_code, 
              language, monthly_budget, is_active, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    // Dynamically build the UPDATE query based on provided fields
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id); // For the WHERE clause

    await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    );

    return this.findById(id);
  }
}
