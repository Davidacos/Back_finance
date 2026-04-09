import { sendSuccess } from '../../utils/response.js';

export class AuthController {
  constructor(service) {
    this.service = service;
  }

  register = async (req, res, next) => {
    try {
      const user = await this.service.register(req.body);
      return sendSuccess(res, { user }, 201, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      
      const data = await this.service.login(email, password, userAgent, ipAddress);
      return sendSuccess(res, data, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const data = await this.service.refreshToken(refreshToken);
      return sendSuccess(res, data, 200, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      await this.service.logout(refreshToken);
      return sendSuccess(res, null, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await this.service.changePassword(req.user.id, currentPassword, newPassword);
      return sendSuccess(res, null, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };
}
