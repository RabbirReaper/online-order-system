import express from 'express';
import * as dishTemplateController from '../controllers/Dish/dishTemplate.js';
// import * as dishInstanceController from '../controllers/Dish/dishInstance.js';
import * as optionCategoryController from '../controllers/Dish/optionCategory.js';
import * as optionController from '../controllers/Dish/option.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware, brandMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 餐點模板路由 (主資料庫，由品牌管理員或老闆管理)
router.get('/brands/:brandId/templates', authMiddleware, brandMiddleware, dishTemplateController.getAllDishTemplates);
router.get('/brands/:brandId/templates/:id', authMiddleware, brandMiddleware, dishTemplateController.getDishTemplateById);
router.post('/brands/:brandId/templates', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, dishTemplateController.createDishTemplate);
router.put('/brands/:brandId/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, dishTemplateController.updateDishTemplate);
router.delete('/brands/:brandId/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, dishTemplateController.deleteDishTemplate);
router.get('/brands/:brandId/templates/:id/options', authMiddleware, brandMiddleware, dishTemplateController.getDishTemplateOptions);

// 餐點實例路由
// router.get('/instances', dishInstanceController.getAllDishInstances);
// router.get('/instances/:id', dishInstanceController.getDishInstanceById);
// router.post('/instances', dishInstanceController.createDishInstance);
// router.put('/instances/:id', dishInstanceController.updateDishInstance);
// router.delete('/instances/:id', authMiddleware, permissionMiddleware(['edit_backend']), dishInstanceController.deleteDishInstance);

// 選項類別路由 (主資料庫，由品牌管理員或老闆管理)
router.get('/brands/:brandId/option-categories', authMiddleware, brandMiddleware, optionCategoryController.getAllOptionCategories);
router.get('/brands/:brandId/option-categories/:id', authMiddleware, brandMiddleware, optionCategoryController.getOptionCategoryById);
router.post('/brands/:brandId/option-categories', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, optionCategoryController.createOptionCategory);
router.put('/brands/:brandId/option-categories/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, optionCategoryController.updateOptionCategory);
router.delete('/brands/:brandId/option-categories/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, optionCategoryController.deleteOptionCategory);

// 選項路由 (主資料庫，由品牌管理員或老闆管理)
router.get('/brands/:brandId/options', authMiddleware, brandMiddleware, optionController.getAllOptions);
router.get('/brands/:brandId/options/:id', authMiddleware, brandMiddleware, optionController.getOptionById);
router.post('/brands/:brandId/options', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, optionController.createOption);
router.put('/brands/:brandId/options/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, optionController.updateOption);
router.delete('/brands/:brandId/options/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), brandMiddleware, optionController.deleteOption);
router.get('/brands/:brandId/category/:categoryId/options', authMiddleware, brandMiddleware, optionController.getOptionsByCategory);

export default router;
