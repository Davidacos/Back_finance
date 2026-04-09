import { sendSuccess } from '../../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

export class TransactionsController {
  constructor(service) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const pagination = parsePagination(req.query);
      const filters = req.query; // Already validated by Zod

      const { transactions, total } = await this.service.getTransactions(
        req.user.id,
        filters,
        pagination
      );

      const meta = buildPaginationMeta(total, pagination.page, pagination.limit);

      return sendSuccess(res, { meta, transactions });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const transaction = await this.service.createTransaction(req.user.id, req.body);
      return sendSuccess(res, { transaction }, 201, 'Transaction created successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const transaction = await this.service.updateTransaction(
        req.params.id,
        req.user.id,
        req.body
      );
      return sendSuccess(res, { transaction }, 200, 'Transaction updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.deleteTransaction(req.params.id, req.user.id);
      return sendSuccess(res, null, 200, 'Transaction deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
