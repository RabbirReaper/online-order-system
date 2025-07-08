/**
 * 菜單控制器
 * 處理菜單相關的 HTTP 請求
 * 支援多菜單邏輯：一個店鋪可以有多個菜單，但同種類型一次只能有一個啟用
 */

import * as menuService from '../../services/store/menuService.js';
import { asyncHandler } from '../../middlewares/error.js';

/**
 * 獲取店鋪的所有菜單
 */
export const getAllStoreMenus = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params;
  const { includeUnpublished, activeOnly, menuType } = req.query;

  const options = {
    includeUnpublished: includeUnpublished === 'true',
    activeOnly: activeOnly === 'true',
    menuType: menuType || undefined
  };

  const menus = await menuService.getAllStoreMenus(storeId, options);

  res.status(200).json({
    success: true,
    menus,
    message: '店鋪菜單列表獲取成功'
  });
});

/**
 * 獲取店鋪菜單（單個，向後兼容）
 */
export const getStoreMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params;
  const { includeUnpublished, menuType } = req.query;

  try {
    const menu = await menuService.getStoreMenu(
      storeId,
      includeUnpublished === 'true',
      menuType || null
    );

    res.status(200).json({
      success: true,
      menu,
      message: '菜單獲取成功'
    });
  } catch (error) {
    if (error.message === '此店鋪尚未建立菜單') {
      // 兼容前端邏輯，返回特殊標記
      res.status(200).json({
        success: true,
        menu: { exists: false },
        message: '此店鋪尚未建立菜單'
      });
    } else {
      throw error;
    }
  }
});

/**
 * 根據ID獲取特定菜單
 */
export const getMenuById = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;
  const { includeUnpublished } = req.query;

  const menu = await menuService.getMenuById(
    storeId,
    menuId,
    includeUnpublished === 'true'
  );

  res.status(200).json({
    success: true,
    menu,
    message: '菜單獲取成功'
  });
});

/**
 * 創建菜單
 */
export const createMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params;

  // 確保菜單資料包含必要的店鋪和品牌資訊
  const menuData = {
    ...req.body,
    store: storeId,
    brand: brandId
  };

  const menu = await menuService.createMenu(storeId, menuData);

  res.status(201).json({
    success: true,
    menu,
    message: '菜單創建成功'
  });
});

/**
 * 更新菜單
 */
export const updateMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;

  const menu = await menuService.updateMenu(storeId, menuId, req.body);

  res.status(200).json({
    success: true,
    menu,
    message: '菜單更新成功'
  });
});

/**
 * 刪除菜單
 */
export const deleteMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;

  const result = await menuService.deleteMenu(storeId, menuId);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * 切換菜單啟用狀態
 */
export const toggleMenuActive = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;
  const { active } = req.body;

  const menu = await menuService.toggleMenuActive(storeId, menuId, active);

  res.status(200).json({
    success: true,
    menu,
    message: `菜單已${active ? '啟用' : '停用'}`
  });
});

/**
 * 切換菜單項目啟用狀態
 */
export const toggleMenuItem = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;
  const { categoryIndex, itemIndex, isShowing } = req.body;

  const menu = await menuService.toggleMenuItem(
    storeId,
    menuId,
    categoryIndex,
    itemIndex,
    isShowing
  );

  res.status(200).json({
    success: true,
    menu,
    message: `菜單項目已${isShowing ? '顯示' : '隱藏'}`
  });
});



/**
 * 添加商品到菜單
 */
export const addItemToMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;
  const { categoryIndex, itemData } = req.body;

  const menu = await menuService.addItemToMenu(
    storeId,
    menuId,
    categoryIndex,
    itemData
  );

  res.status(200).json({
    success: true,
    menu,
    message: '商品添加成功'
  });
});

/**
 * 從菜單移除商品
 */
export const removeItemFromMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params;
  const { categoryIndex, itemIndex } = req.body;

  const menu = await menuService.removeItemFromMenu(
    storeId,
    menuId,
    categoryIndex,
    itemIndex
  );

  res.status(200).json({
    success: true,
    menu,
    message: '商品移除成功'
  });
});
