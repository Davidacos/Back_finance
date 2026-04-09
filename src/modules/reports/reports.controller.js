import { sendSuccess } from '../../utils/response.js';

export class ReportsController {
  constructor(service) {
    this.service = service;
  }

  getMonthlyReport = async (req, res, next) => {
    try {
      const { year, month } = req.query;
      const report = await this.service.getMonthlyReport(req.user.id, year, month);
      
      return sendSuccess(res, { report });
    } catch (error) {
      next(error);
    }
  };
}
