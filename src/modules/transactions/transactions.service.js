export class TransactionsService {
  constructor(repository, categoryRepository) {
    this.repository = repository;
    this.categoryRepository = categoryRepository;
  }

  async getTransactions(userId, filters, pagination) {
    return this.repository.findAndCountAll(userId, filters, pagination);
  }

  async createTransaction(userId, data) {
    // Validate that the category exists and belongs to the user or is default
    const category = await this.categoryRepository.findByIdAndUser(data.category_id, userId);
    
    if (!category) {
      const error = new Error('Category not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    // Optional: Validation to strictly match transaction 'type' with category 'type'
    if (category.type !== data.type) {
      const error = new Error(`Transaction type (${data.type}) does not match category type (${category.type})`);
      error.statusCode = 400;
      throw error;
    }

    return this.repository.create({ user_id: userId, ...data });
  }

  async updateTransaction(id, userId, data) {
    const transaction = await this.repository.findByIdAndUser(id, userId);
    
    if (!transaction) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      throw error;
    }

    // If category_id or type changes, re-validate relationship
    if (data.category_id || data.type) {
      const catId = data.category_id || transaction.category_id;
      const tType = data.type || transaction.type;
      
      const category = await this.categoryRepository.findByIdAndUser(catId, userId);
      
      if (!category) {
        const error = new Error('Category not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      if (category.type !== tType) {
        const error = new Error(`Transaction type (${tType}) does not match category type (${category.type})`);
        error.statusCode = 400;
        throw error;
      }
    }

    return this.repository.update(id, userId, data);
  }

  async deleteTransaction(id, userId) {
    const isDeleted = await this.repository.delete(id, userId);
    
    if (!isDeleted) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      throw error;
    }
    
    return true;
  }
}
