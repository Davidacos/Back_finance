export class AuthRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByEmail(email, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  async create(user, client = null) {
    const db = client || this.pool;
    const { id, email, password_hash, first_name, last_name, currency_code, language, monthly_budget } = user;
    
    await db.query(
      `INSERT INTO users 
       (id, email, password_hash, first_name, last_name, currency_code, language, monthly_budget) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, email, password_hash, first_name, last_name, currency_code || 'USD', language || 'en', monthly_budget || null]
    );
    
    return this.findById(id, client);
  }

  async findById(id, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      'SELECT id, email, first_name, last_name, currency_code, language, monthly_budget, is_active, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findByIdWithPassword(id, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      'SELECT id, password_hash, is_active FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async updatePassword(id, password_hash, client = null) {
    const db = client || this.pool;
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, id]
    );
  }

  async storeRefreshToken(userId, tokenHash, userAgent, ipAddress, expiresAt, client = null) {
    const db = client || this.pool;
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, userAgent, ipAddress, expiresAt]
    );
  }

  async findRefreshToken(tokenHash, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash]
    );
    return rows[0] || null;
  }

  async deleteRefreshToken(tokenHash, client = null) {
    const db = client || this.pool;
    await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  }
}
