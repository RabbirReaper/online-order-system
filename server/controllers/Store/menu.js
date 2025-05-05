import * as menuService from '../../services/store/menuService.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取店鋪菜單
export const getStoreMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const includeUnpublished = req.query.includeUnpublished === 'true';

    const menu = await menuService.getStoreMenu(storeId, includeUnpublished);

    res.json({
      success: true,
      menu
    });
  } catch (error) {
    console.error('Error getting store menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 創建菜單
export const createMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const menuData = req.body;

    const newMenu = await menuService.createMenu(storeId, menuData);

    res.status(201).json({
      success: true,
      message: '菜單創建成功',
      menu: newMenu
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新菜單
export const updateMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const updateData = req.body;

    const updatedMenu = await menuService.updateMenu(storeId, menuId, updateData);

    res.json({
      success: true,
      message: '菜單更新成功',
      menu: updatedMenu
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 刪除菜單
export const deleteMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;

    const result = await menuService.deleteMenu(storeId, menuId);

    res.json({
      success: true,
      message: '菜單刪除成功'
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 切換菜單項目的啟用狀態
export const toggleMenuItem = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId, categoryIndex, dishIndex } = req.params;
    const { isPublished } = req.body;

    if (isPublished === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 isPublished'
      });
    }

    const menu = await menuService.toggleMenuItem(storeId, menuId, categoryIndex, dishIndex, isPublished);

    res.json({
      success: true,
      message: `菜單項目已${isPublished ? '啟用' : '停用'}`,
      menu
    });
  } catch (error) {
    console.error('Error toggling menu item:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新分類順序
export const updateCategoryOrder = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { categoryOrders } = req.body;

    if (!categoryOrders || !Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的分類順序資料'
      });
    }

    const menu = await menuService.updateCategoryOrder(storeId, menuId, categoryOrders);

    res.json({
      success: true,
      message: '分類順序更新成功',
      menu
    });
  } catch (error) {
    console.error('Error updating category order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新餐點順序
export const updateDishOrder = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId, categoryIndex } = req.params;
    const { dishOrders } = req.body;

    if (!dishOrders || !Array.isArray(dishOrders)) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的餐點順序資料'
      });
    }

    const menu = await menuService.updateDishOrder(storeId, menuId, categoryIndex, dishOrders);

    res.json({
      success: true,
      message: '餐點順序更新成功',
      menu
    });
  } catch (error) {
    console.error('Error updating dish order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 添加餐點到菜單
export const addDishToMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId, categoryIndex } = req.params;
    const dishData = req.body;

    if (!dishData || !dishData.dishTemplate) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的餐點資料'
      });
    }

    const menu = await menuService.addDishToMenu(storeId, menuId, categoryIndex, dishData);

    res.json({
      success: true,
      message: '餐點添加成功',
      menu
    });
  } catch (error) {
    console.error('Error adding dish to menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 從菜單中移除餐點
export const removeDishFromMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId, categoryIndex, dishIndex } = req.params;

    const menu = await menuService.removeDishFromMenu(storeId, menuId, categoryIndex, dishIndex);

    res.json({
      success: true,
      message: '餐點移除成功',
      menu
    });
  } catch (error) {
    console.error('Error removing dish from menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 切換菜單啟用狀態
export const toggleMenuActive = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 isActive'
      });
    }

    // 更新菜單數據中的 isActive 欄位
    const menu = await menuService.updateMenu(storeId, menuId, { isActive });

    res.json({
      success: true,
      message: `菜單已${isActive ? '啟用' : '停用'}`,
      menu
    });
  } catch (error) {
    console.error('Error toggling menu status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});
