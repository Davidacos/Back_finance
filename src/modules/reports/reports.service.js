export class ReportsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getMonthlyReport(userId, year, month) {
    return this.repository.getMonthlySummary(userId, year, month);
  }
}
