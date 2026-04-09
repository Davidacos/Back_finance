import { sendSuccess } from '../../utils/response.js';

export class UsersController {
  constructor(service) {
    this.service = service;
  }

  getMe = async (req, res, next) => {
    try {
      // req.user is injected by the authMiddleware
      const user = await this.service.getProfile(req.user.id);
      return sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req, res, next) => {
    try {
      const user = await this.service.updateProfile(req.user.id, req.body);
      return sendSuccess(res, { user }, 200, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };
}
