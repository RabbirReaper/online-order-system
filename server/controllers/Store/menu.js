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
      message: error.message || '獲取菜單失敗'
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
      message: error.message || '創建菜單失敗'
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
      message: error.message || '更新菜單失敗'
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
      message: error.message || '刪除菜單失敗'
    });
  }
});

// 切換菜單項目的啟用狀態
export const toggleMenuItem = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { categoryIndex, itemIndex, isShowing } = req.body;

    // 檢查必要參數
    if (categoryIndex === undefined || itemIndex === undefined || isShowing === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數（categoryIndex、itemIndex 或 isShowing）'
      });
    }

    // 確保參數是數字類型
    const catIndex = parseInt(categoryIndex, 10);
    const itmIndex = parseInt(itemIndex, 10);

    if (isNaN(catIndex) || isNaN(itmIndex)) {
      return res.status(400).json({
        success: false,
        message: 'categoryIndex 和 itemIndex 必須是有效的數字'
      });
    }

    const menu = await menuService.toggleMenuItem(storeId, menuId, catIndex, itmIndex, isShowing);

    res.json({
      success: true,
      message: `菜單項目已${isShowing ? '啟用' : '停用'}`,
      menu
    });
  } catch (error) {
    console.error('Error toggling menu item:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '切換菜單項目狀態失敗'
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

    // 確保所有索引和順序都是數字
    const validatedOrders = categoryOrders.map(item => ({
      categoryIndex: parseInt(item.categoryIndex, 10),
      order: parseInt(item.order, 10)
    }));

    const menu = await menuService.updateCategoryOrder(storeId, menuId, validatedOrders);

    res.json({
      success: true,
      message: '分類順序更新成功',
      menu
    });
  } catch (error) {
    console.error('Error updating category order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '更新分類順序失敗'
    });
  }
});

// 更新商品順序
export const updateItemOrder = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { categoryIndex, itemOrders } = req.body;

    if (categoryIndex === undefined || !itemOrders || !Array.isArray(itemOrders)) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的商品順序資料'
      });
    }

    // 確保分類索引和所有商品索引和順序都是數字
    const catIndex = parseInt(categoryIndex, 10);
    const validatedOrders = itemOrders.map(item => ({
      itemIndex: parseInt(item.itemIndex, 10),
      order: parseInt(item.order, 10)
    }));

    const menu = await menuService.updateItemOrder(storeId, menuId, catIndex, validatedOrders);

    res.json({
      success: true,
      message: '商品順序更新成功',
      menu
    });
  } catch (error) {
    console.error('Error updating item order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '更新商品順序失敗'
    });
  }
});

// 添加商品到菜單
export const addItemToMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { categoryIndex, itemData } = req.body;

    if (categoryIndex === undefined || !itemData || !itemData.itemType) {
      return res.status(400).json({
        success: false,
        message: '缺少有效的商品資料'
      });
    }

    // 確保分類索引是數字
    const catIndex = parseInt(categoryIndex, 10);

    const menu = await menuService.addItemToMenu(storeId, menuId, catIndex, itemData);

    res.json({
      success: true,
      message: '商品添加成功',
      menu
    });
  } catch (error) {
    console.error('Error adding item to menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '添加商品失敗'
    });
  }
});

// 從菜單中移除商品
export const removeItemFromMenu = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { categoryIndex, itemIndex } = req.body;

    if (categoryIndex === undefined || itemIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 確保索引是數字
    const catIndex = parseInt(categoryIndex, 10);
    const itmIndex = parseInt(itemIndex, 10);

    const menu = await menuService.removeItemFromMenu(storeId, menuId, catIndex, itmIndex);

    res.json({
      success: true,
      message: '商品移除成功',
      menu
    });
  } catch (error) {
    console.error('Error removing item from menu:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '移除商品失敗'
    });
  }
});

// 切換菜單啟用狀態
export const toggleMenuActive = asyncHandler(async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 active'
      });
    }

    // 更新菜單數據中的 isActive 欄位
    const menu = await menuService.updateMenu(storeId, menuId, { isActive: active });

    res.json({
      success: true,
      message: `菜單已${active ? '啟用' : '停用'}`,
      menu
    });
  } catch (error) {
    console.error('Error toggling menu status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '切換菜單狀態失敗'
    });
  }
});
