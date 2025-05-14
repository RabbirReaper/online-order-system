import express from 'express';
import * as brandController from '../controllers/Brand/brand.js';
import { authMiddleware } from '../middlewares/auth.js';
import { roleMiddleware } from '../middlewares/permission.js';

const router = express.Router();

// 保留品牌路由 - 這是我們目前需要的功能
router.get('/', authMiddleware, roleMiddleware(['boss']), brandController.getAllBrands);
router.get('/:id', authMiddleware, roleMiddleware(['boss']), brandController.getBrandById);
router.post('/', authMiddleware, roleMiddleware(['boss']), brandController.createBrand);
router.put('/:id', authMiddleware, roleMiddleware(['boss']), brandController.updateBrand);
router.delete('/:id', authMiddleware, roleMiddleware(['boss']), brandController.deleteBrand);
router.get('/:id/stores', authMiddleware, roleMiddleware(['boss']), brandController.getBrandStores);
router.put('/:id/toggle', authMiddleware, roleMiddleware(['boss']), brandController.toggleBrandActive);

// router.get('/brands/:id/stats',authMiddleware, roleMiddleware(['boss']), brandController.getBrandStats);
