import { sendSuccess } from '../../utils/response.js';

export class ReportsController {
  constructor(service) {
    this.service = service;
  }

  async getMonthlyReport(req, res, next) {
    try {
      const { year, month } = req.query;
      const report = await this.service.getMonthlyReport(req.user.id, year, month);
      res.json({ success: true, data: { report } });
    } catch (error) {
      next(error);
    }
  }

  async getDetailedReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.service.getDetailedReport(req.user.id, startDate, endDate);
      res.json({ success: true, data: { report } });
    } catch (error) {
      next(error);
    }
  }

  async exportCSV(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.service.getDetailedReport(req.user.id, startDate, endDate);
      const csv = this.service.generateCSV(report.transactions);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${startDate}_${endDate}.csv`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
