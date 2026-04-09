export class CategoriesService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAllCategories(userId) {
    return this.repository.findAllForUser(userId);
  }

  async createCategory(userId, data) {
    return this.repository.create({
      user_id: userId,
      ...data
    });
  }

  async updateCategory(id, userId, data) {
    const client = await this.repository.pool.connect();
    try {
      await client.query('BEGIN');
      const category = await this.repository.findByIdAndUser(id, userId, client);
      
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
      }

      if (category.is_default) {
        const error = new Error('Default categories cannot be modified');
        error.statusCode = 403;
        throw error;
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

  async deleteCategory(id, userId) {
    const client = await this.repository.pool.connect();
    try {
      await client.query('BEGIN');
      const category = await this.repository.findByIdAndUser(id, userId, client);
      
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
      }

      if (category.is_default) {
        const error = new Error('Default categories cannot be deleted');
        error.statusCode = 403;
        throw error;
      }

      const isDeleted = await this.repository.delete(id, userId, client);
      
      if (!isDeleted) {
        const error = new Error('Category could not be deleted (might be in use by transactions)');
        error.statusCode = 409;
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
}
