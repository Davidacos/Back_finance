import { sendSuccess } from '../../utils/response.js';

export class FixedExpensesController {
  constructor(service) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const { includeInactive } = req.query;
      const expenses = await this.service.getFixedExpenses(req.user.id, includeInactive);
      return sendSuccess(res, { fixedExpenses: expenses });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const expense = await this.service.createFixedExpense(req.user.id, req.body);
      return sendSuccess(res, { fixedExpense: expense }, 201, 'Fixed expense created successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const expense = await this.service.updateFixedExpense(
        req.params.id,
        req.user.id,
        req.body
      );
      return sendSuccess(res, { fixedExpense: expense }, 200, 'Fixed expense updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.deleteFixedExpense(req.params.id, req.user.id);
      return sendSuccess(res, null, 200, 'Fixed expense deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  async markAsPaid(req, res, next) {
    try {
      const transaction = await this.service.markAsPaid(req.params.id, req.user.id, req.body);
      res.status(201).json({ success: true, data: { transaction } });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req, res, next) {
    try {
      const payments = await this.service.getPayments(req.user.id, req.query);
      res.json({ success: true, data: { payments } });
    } catch (error) {
      next(error);
    }
  }
}
