export class TransactionsRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findAndCountAll(userId, filters, pagination, client = null) {
    const db = client || this.pool;
    const { startDate, endDate, type, categoryId } = filters;
    const { limit, offset } = pagination;

    let whereClause = 't.user_id = $1 AND t.deleted_at IS NULL';
    const values = [userId];

    if (startDate) {
      values.push(startDate);
      whereClause += ` AND t.transaction_date >= $${values.length}`;
    }
    
    if (endDate) {
      values.push(endDate);
      whereClause += ` AND t.transaction_date <= $${values.length}`;
    }

    if (type) {
      values.push(type);
      whereClause += ` AND t.type = $${values.length}`;
    }

    if (categoryId) {
      values.push(categoryId);
      whereClause += ` AND t.category_id = $${values.length}`;
    }

    // Get total count for pagination metadata
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`,
      values
    );
    // Postgres returns BIGINT count as string to avoid JS precision loss
    const total = parseInt(countRows[0].total, 10);

    // Get data
    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;
    const queryValues = [...values, limit, offset];
    
    const { rows } = await db.query(
      `SELECT 
        t.id, t.type, t.amount, t.description, t.transaction_date, 
        t.payment_method, t.created_at,
        c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE ${whereClause}
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      queryValues
    );

    // Format results to nest category object
    const transactions = rows.map(row => {
      const { category_id, category_name, category_icon, category_color, ...tx } = row;
      return {
        ...tx,
        category: {
          id: category_id,
          name: category_name,
          icon: category_icon,
          color: category_color
        }
      };
    });

    return { transactions, total };
  }

  async findByIdAndUser(id, userId, client = null) {
    const db = client || this.pool;
    const { rows } = await db.query(
      `SELECT * FROM transactions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(transaction, client = null) {
    const db = client || this.pool;
    const { user_id, category_id, type, amount, description, transaction_date, payment_method } = transaction;
    
    const { rows } = await db.query(
      `INSERT INTO transactions 
       (user_id, category_id, type, amount, description, transaction_date, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user_id, category_id, type, amount, description || null, transaction_date, payment_method]
    );

    return this.findByIdAndUser(rows[0].id, user_id, client);
  }

  async update(id, userId, data, client = null) {
    const db = client || this.pool;
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) return this.findByIdAndUser(id, userId, client);

    values.push(id, userId);

    await db.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length} AND deleted_at IS NULL`,
      values
    );

    return this.findByIdAndUser(id, userId, client);
  }

  async delete(id, userId, client = null) {
    const db = client || this.pool;
    const result = await db.query(
      `UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rowCount > 0;
  }
}
