export class AuthRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT id, email, password_hash, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  async create(user) {
    const { id, email, password_hash, first_name, last_name, currency_code, language, monthly_budget } = user;
    
    await this.pool.query(
      `INSERT INTO users 
       (id, email, password_hash, first_name, last_name, currency_code, language, monthly_budget) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, email, password_hash, first_name, last_name, currency_code || 'USD', language || 'en', monthly_budget || null]
    );
    
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.pool.query(
      'SELECT id, email, first_name, last_name, currency_code, language, monthly_budget, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findByIdWithPassword(id) {
    const { rows } = await this.pool.query(
      'SELECT id, password_hash, is_active FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async updatePassword(id, password_hash) {
    await this.pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, id]
    );
  }
}
