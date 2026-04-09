export class ReportsRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async getMonthlySummary(userId, year, month) {
    // We assume the VIEW `v_monthly_summary` already exists in your DB
    // Expected to have columns like: user_id, year, month, total_income, total_expense, balance, etc.
    // If the view schema differs slightly, this query can be adjusted.
    
    let query = `SELECT * FROM v_monthly_summary WHERE user_id = $1`;
    const params = [userId];

    if (year) {
      // Assuming the view has a 'year' or 'summary_year' column, using common names
      // If the view calculates based on a date, this might need adapting to match the view's exact columns.
      // I will assume standard: `summary_year` and `summary_month` to avoid reserved keyword conflicts
      params.push(year);
      query += ` AND summary_year = $${params.length}`;
    }

    if (month) {
      params.push(month);
      query += ` AND summary_month = $${params.length}`;
    }

    query += ` ORDER BY summary_year DESC, summary_month DESC`;

    const { rows } = await this.pool.query(query, params);
    return rows;
  }
}
