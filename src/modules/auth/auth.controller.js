import { sendSuccess } from '../../utils/response.js';

export class AuthController {
  constructor(service) {
    this.service = service;
  }

  setTokenCookies = (res, tokens) => {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
    };

    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };

  register = async (req, res, next) => {
    try {
      const data = await this.service.register(req.body);
      // The service returns the new user object (and tokens if auto-login is implemented, but here let's assume it returns { user }).
      // If it returns { user, accessToken, refreshToken }, we set them.
      if (data.accessToken) {
         this.setTokenCookies(res, data);
      }
      return sendSuccess(res, { user: data.user || data }, 201, 'User registered successfully');
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
      
      // Set HttpOnly Cookies
      this.setTokenCookies(res, data);

      // We only return user profile and success status
      return sendSuccess(res, { user: data.user }, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      // Refresh token now comes from HttpOnly Cookie
      const currentToken = req.cookies.refreshToken;
      if (!currentToken) {
         return res.status(401).json({ success: false, message: 'No refresh token provided' });
      }

      const data = await this.service.refreshToken(currentToken);
      this.setTokenCookies(res, data);
      
      return sendSuccess(res, null, 200, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const currentToken = req.cookies.refreshToken;
      if (currentToken) {
        await this.service.logout(currentToken);
      }
      
      // Clear cookies immediately
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
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
