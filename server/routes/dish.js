import express from 'express';
import * as dishTemplateController from '../controllers/Dish/dishTemplate.js';
import * as optionCategoryController from '../controllers/Dish/optionCategory.js';
import * as optionController from '../controllers/Dish/option.js';
import {
  authenticate,
  requireRole,
  requireBrandAccess
} from '../middlewares/auth/index.js';

const router = express.Router();

// 餐點模板路由
// 獲取品牌的所有餐點模板
router.get('/brands/:brandId/templates',
  dishTemplateController.getAllDishTemplates
);

// 獲取單個餐點模板
router.get('/brands/:brandId/templates/:id',
  dishTemplateController.getDishTemplateById
);

// 創建餐點模板（系統級和品牌級）
router.post('/brands/:brandId/templates',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  dishTemplateController.createDishTemplate
);

// 更新餐點模板（系統級和品牌級）
router.put('/brands/:brandId/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  dishTemplateController.updateDishTemplate
);

// 刪除餐點模板（系統級和品牌級）
router.delete('/brands/:brandId/templates/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  dishTemplateController.deleteDishTemplate
);

// 獲取餐點模板的選項類別
router.get('/brands/:brandId/templates/:id/options',
  dishTemplateController.getDishTemplateOptions
);

// 選項類別路由
// 獲取所有選項類別
router.get('/brands/:brandId/option-categories',
  optionCategoryController.getAllOptionCategories
);

// 獲取單個選項類別
router.get('/brands/:brandId/option-categories/:id',
  optionCategoryController.getOptionCategoryById
);

// 創建選項類別（系統級和品牌級）
router.post('/brands/:brandId/option-categories',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  optionCategoryController.createOptionCategory
);

// 更新選項類別（系統級和品牌級）
router.put('/brands/:brandId/option-categories/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  optionCategoryController.updateOptionCategory
);

// 刪除選項類別（系統級和品牌級）
router.delete('/brands/:brandId/option-categories/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  optionCategoryController.deleteOptionCategory
);

// 選項路由
// 獲取所有選項
router.get('/brands/:brandId/options',
  optionController.getAllOptions
);

// 獲取單個選項
router.get('/brands/:brandId/options/:id',
  optionController.getOptionById
);

// 創建選項（系統級和品牌級）
router.post('/brands/:brandId/options',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  optionController.createOption
);

// 更新選項（系統級和品牌級）
router.put('/brands/:brandId/options/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  optionController.updateOption
);

// 刪除選項（系統級和品牌級）
router.delete('/brands/:brandId/options/:id',
  authenticate('admin'),
  requireRole('primary_system_admin', 'system_admin', 'primary_brand_admin', 'brand_admin'),
  requireBrandAccess,
  optionController.deleteOption
);

// 獲取類別下的所有選項
router.get('/brands/:brandId/category/:categoryId/options',
  optionController.getOptionsByCategory
);

export default router;
