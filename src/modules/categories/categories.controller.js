import { sendSuccess } from '../../utils/response.js';

export class CategoriesController {
  constructor(service) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const categories = await this.service.getAllCategories(req.user.id);
      return sendSuccess(res, { categories });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const category = await this.service.createCategory(req.user.id, req.body);
      return sendSuccess(res, { category }, 201, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const category = await this.service.updateCategory(req.params.id, req.user.id, req.body);
      return sendSuccess(res, { category }, 200, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.deleteCategory(req.params.id, req.user.id);
      return sendSuccess(res, null, 200, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
