export class ReportsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getMonthlyReport(userId, year, month) {
    return this.repository.getMonthlySummary(userId, year, month);
  }

  async getDetailedReport(userId, startDate, endDate) {
    const transactions = await this.repository.getDetailedReportByRange(userId, startDate, endDate);
    
    // Calculate totals for the header
    const totals = transactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    }, { income: 0, expense: 0 });

    return {
      summary: {
        total_income: totals.income,
        total_expense: totals.expense,
        balance: totals.income - totals.expense,
        transaction_count: transactions.length
      },
      transactions
    };
  }

  generateCSV(transactions) {
    const header = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Método de Pago'];
    const rows = transactions.map(t => [
      t.transaction_date.toISOString().split('T')[0],
      t.description || '',
      t.category_name || 'Sin categoría',
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.amount,
      t.payment_method
    ]);

    return [header, ...rows].map(row => row.join(',')).join('\n');
  }
}
