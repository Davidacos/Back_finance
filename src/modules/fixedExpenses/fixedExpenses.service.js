export class FixedExpensesService {
  constructor(repository, categoryRepository) {
    this.repository = repository;
    this.categoryRepository = categoryRepository;
  }

  async getFixedExpenses(userId, includeInactive) {
    return this.repository.findAllForUser(userId, includeInactive);
  }

  async createFixedExpense(userId, data) {
    const category = await this.categoryRepository.findByIdAndUser(data.category_id, userId);
    
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

    return this.repository.create({ user_id: userId, ...data });
  }

  async updateFixedExpense(id, userId, data) {
    const expense = await this.repository.findByIdAndUser(id, userId);
    
    if (!expense) {
      const error = new Error('Fixed expense not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.category_id) {
      const category = await this.categoryRepository.findByIdAndUser(data.category_id, userId);
      
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

    return this.repository.update(id, userId, data);
  }

  async deleteFixedExpense(id, userId) {
    // We implement a "soft delete" to keep the history of the fixed expense
    // without it actively triggering any future generation logic
    const isDeleted = await this.repository.softDelete(id, userId);
    
    if (!isDeleted) {
      const error = new Error('Fixed expense not found');
      error.statusCode = 404;
      throw error;
    }
    
    return true;
  }
}
