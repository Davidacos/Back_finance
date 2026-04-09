import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateId } from '../../utils/uuid.js';
import crypto from 'crypto';

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

  async login(email, password, userAgent, ipAddress) {
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

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.env.JWT_SECRET,
      { expiresIn: this.env.JWT_EXPIRES_IN || '15m' } // Should be short, e.g., 15m
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.repository.storeRefreshToken(user.id, tokenHash, userAgent, ipAddress, expiresAt);

    // Remove sensitive data before returning
    const { password_hash: _hash, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenData = await this.repository.findRefreshToken(tokenHash);

    if (!tokenData) {
      const error = new Error('Refresh token not found or expired');
      error.statusCode = 401;
      throw error;
    }

    const user = await this.repository.findById(tokenData.user_id);
    
    if (!user || !user.is_active) {
      const error = new Error('User not found or deactivated');
      error.statusCode = 403;
      throw error;
    }

    // ROTATION: Delete the old token
    await this.repository.deleteRefreshToken(tokenHash);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.env.JWT_SECRET,
      { expiresIn: this.env.JWT_EXPIRES_IN || '15m' }
    );

    // Issue a NEW refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.repository.storeRefreshToken(user.id, newTokenHash, tokenData.user_agent, tokenData.ip_address, expiresAt);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.repository.deleteRefreshToken(tokenHash);
    return { success: true };
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
