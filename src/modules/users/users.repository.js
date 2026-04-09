export class UsersRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(id, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      `SELECT id, email, first_name, last_name, currency_code, 
              language, monthly_budget, is_active, role, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id, data, client = null) {
    const db = client || this.pool;
    const fields = [];
    const values = [];

    // Dynamically build the UPDATE query based on provided fields
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findById(id, client);

    values.push(id); // For the WHERE clause

    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    );

    return this.findById(id, client);
  }
}
