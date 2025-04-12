import express from 'express';
import * as dishTemplateController from '../controllers/Dish/dishTemplate.js';
import * as dishInstanceController from '../controllers/Dish/dishInstance.js';
import * as optionCategoryController from '../controllers/Dish/optionCategory.js';
import * as optionController from '../controllers/Dish/option.js';
import { authMiddleware } from '../middlewares/auth.js';
import { permissionMiddleware, roleMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 餐點模板路由 (主資料庫，由品牌管理員或老闆管理)
router.get('/templates', dishTemplateController.getAllDishTemplates);
router.get('/templates/:id', dishTemplateController.getDishTemplateById);
router.post('/templates', authMiddleware, roleMiddleware(['boss', 'brand_admin']), dishTemplateController.createDishTemplate);
router.put('/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), dishTemplateController.updateDishTemplate);
router.delete('/templates/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), dishTemplateController.deleteDishTemplate);

// 餐點實例路由
router.get('/instances', dishInstanceController.getAllDishInstances);
router.get('/instances/:id', dishInstanceController.getDishInstanceById);
router.post('/instances', dishInstanceController.createDishInstance);
router.put('/instances/:id', dishInstanceController.updateDishInstance);
router.delete('/instances/:id', authMiddleware, permissionMiddleware(['edit_backend']), dishInstanceController.deleteDishInstance);

// 選項類別路由 (主資料庫，由品牌管理員或老闆管理)
router.get('/option-categories', optionCategoryController.getAllOptionCategories);
router.get('/option-categories/:id', optionCategoryController.getOptionCategoryById);
router.post('/option-categories', authMiddleware, roleMiddleware(['boss', 'brand_admin']), optionCategoryController.createOptionCategory);
router.put('/option-categories/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), optionCategoryController.updateOptionCategory);
router.delete('/option-categories/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), optionCategoryController.deleteOptionCategory);

// 選項路由 (主資料庫，由品牌管理員或老闆管理)
router.get('/options', optionController.getAllOptions);
router.get('/options/:id', optionController.getOptionById);
router.post('/options', authMiddleware, roleMiddleware(['boss', 'brand_admin']), optionController.createOption);
router.put('/options/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), optionController.updateOption);
router.delete('/options/:id', authMiddleware, roleMiddleware(['boss', 'brand_admin']), optionController.deleteOption);

export default router;
