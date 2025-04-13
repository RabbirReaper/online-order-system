/**
 * 餐點服務入口文件
 * 匯總並導出所有餐點相關服務
 */

// 導入餐點相關服務
import * as dishTemplateService from './dishTemplate.js';
import * as dishInstanceService from './dishInstance.js';
import * as optionService from './optionService.js';
import * as optionCategoryService from './optionCategoryService.js';

// 導出所有餐點服務
export const template = dishTemplateService;
export const instance = dishInstanceService;
export const option = optionService;
export const optionCategory = optionCategoryService;

// 簡單導出，方便直接調用
export const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateOptions
} = dishTemplateService;

export const {
  getAllInstances,
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  calculateFinalPrice
} = dishInstanceService;

export const {
  getAllOptions,
  getOptionsByCategoryId,
  getOptionById,
  createOption,
  updateOption,
  deleteOption
} = optionService;

export const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = optionCategoryService;
