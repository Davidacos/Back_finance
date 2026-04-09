export class UsersService {
  constructor(repository) {
    this.repository = repository;
  }

  async getProfile(userId) {
    const user = await this.repository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateProfile(userId, data) {
    const user = await this.repository.update(userId, data);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }
}
