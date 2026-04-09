export class FixedExpensesService {
  constructor(repository, categoryRepository) {
    this.repository = repository;
    this.categoryRepository = categoryRepository;
  }

  async getFixedExpenses(userId, includeInactive) {
    return this.repository.findAllForUser(userId, includeInactive);
  }

  async createFixedExpense(userId, data) {
    const client = await this.repository.pool.connect();
    try {
      await client.query('BEGIN');
      const category = await this.categoryRepository.findByIdAndUser(data.category_id, userId, client);
      
      if (!category) {
        const error = new Error('Category not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      if (category.type !== 'expense') {
        const error = new Error('Fixed expenses must use categories of type "expense"');
        error.statusCode = 400;
        throw error;
      }

      const expense = await this.repository.create({ user_id: userId, ...data }, client);
      await client.query('COMMIT');
      return expense;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateFixedExpense(id, userId, data) {
    const client = await this.repository.pool.connect();
    try {
      await client.query('BEGIN');
      const expense = await this.repository.findByIdAndUser(id, userId, client);
      
      if (!expense) {
        const error = new Error('Fixed expense not found');
        error.statusCode = 404;
        throw error;
      }

      if (data.category_id) {
        const category = await this.categoryRepository.findByIdAndUser(data.category_id, userId, client);
        
        if (!category) {
          const error = new Error('Category not found or unauthorized');
          error.statusCode = 404;
          throw error;
        }

        if (category.type !== 'expense') {
          const error = new Error('Fixed expenses must use categories of type "expense"');
          error.statusCode = 400;
          throw error;
        }
      }

      const updated = await this.repository.update(id, userId, data, client);
      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteFixedExpense(id, userId) {
    const client = await this.repository.pool.connect();
    try {
      await client.query('BEGIN');
      const isDeleted = await this.repository.delete(id, userId, client);
      
      if (!isDeleted) {
        const error = new Error('Fixed expense not found');
        error.statusCode = 404;
        throw error;
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markAsPaid(id, userId, paymentData) {
    const client = await this.repository.pool.connect();
    try {
      await client.query('BEGIN');
      
      const expense = await this.repository.findByIdAndUser(id, userId, client);
      if (!expense) {
        const error = new Error('Fixed expense not found');
        error.statusCode = 404;
        throw error;
      }

      // 1. Create the transaction record
      const transaction = await client.query(
        `INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          userId, 
          expense.category_id, 
          'expense', 
          expense.amount, 
          `Pago: ${expense.name} (${paymentData.period_type})`,
          paymentData.payment_date || new Date().toISOString().split('T')[0],
          paymentData.payment_method || 'bank_transfer'
        ]
      );

      // 2. Register the payment fulfillment
      await client.query(
        `INSERT INTO fixed_expense_payments (fixed_expense_id, transaction_id, payment_date, period_year, period_month, period_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          transaction.rows[0].id,
          paymentData.payment_date || new Date().toISOString().split('T')[0],
          paymentData.period_year,
          paymentData.period_month,
          paymentData.period_type || 'monthly'
        ]
      );

      await client.query('COMMIT');
      return transaction.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPayments(userId, filters) {
    return this.repository.findPaymentsForUser(userId, filters);
  }
}
