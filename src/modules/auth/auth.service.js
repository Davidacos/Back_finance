import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateId } from '../../utils/uuid.js';

export class AuthService {
  constructor(repository, env) {
    this.repository = repository;
    this.env = env;
  }

  async register(data) {
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    const { password, ...userData } = data;
    const password_hash = await bcrypt.hash(password, 12);
    const id = generateId();

    const newUser = await this.repository.create({
      id,
      password_hash,
      ...userData
    });

    return newUser;
  }

  async login(email, password) {
    const user = await this.repository.findByEmail(email);
    
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      this.env.JWT_SECRET,
      { expiresIn: this.env.JWT_EXPIRES_IN }
    );

    // Remove sensitive data before returning
    const { password_hash: _hash, ...safeUser } = user;

    return {
      user: safeUser,
      token
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.repository.findByIdWithPassword(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 401;
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.repository.updatePassword(userId, newPasswordHash);
    
    return { success: true };
  }
}
