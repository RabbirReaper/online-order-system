/**
 * 菜單服務
 * 處理店鋪菜單相關的業務邏輯
 * 菜單中顯示 Bundle 作為商品，Bundle 內含 VoucherTemplate
 * 修改邏輯：一個店鋪可以有多個菜單，但同種類型一次只能有一個啟用
 */

import Menu from '../../models/Menu/Menu.js';
import Store from '../../models/Store/Store.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
import Bundle from '../../models/Promotion/Bundle.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取店鋪的所有菜單
 * @param {String} storeId - 店鋪ID
 * @param {Object} options - 查詢選項
 * @param {Boolean} options.includeUnpublished - 是否包含未發布的項目（預設 false）
 * @param {Boolean} options.activeOnly - 是否只返回啟用的菜單（預設 false）
 * @param {String} options.menuType - 篩選特定類型的菜單（可選）
 * @returns {Promise<Array>} 菜單列表
 */
export const getAllStoreMenus = async (storeId, options = {}) => {
  const { includeUnpublished = false, activeOnly = false, menuType } = options;

  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 構建查詢條件
  const queryConditions = { store: storeId };

  if (activeOnly) {
    queryConditions.isActive = true;
  }

  if (menuType) {
    queryConditions.menuType = menuType;
  }

  // 查詢菜單列表
  const menus = await Menu.find(queryConditions)
    .populate([
      {
        path: 'categories.items.dishTemplate',
        model: 'DishTemplate',
        select: 'name description basePrice image tags optionCategories'
      },
      {
        path: 'categories.items.bundle',
        model: 'Bundle',
        select: 'name description image sellingPoint cashPrice pointPrice bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name description voucherType'
        }
      }
    ])
    .sort({ menuType: 1, createdAt: -1 });

  // 如果不包含未發布項目，過濾掉 isShowing: false 的項目
  if (!includeUnpublished) {
    menus.forEach(menu => {
      if (menu.categories) {
        menu.categories = menu.categories.map(category => ({
          ...category.toObject(),
          items: category.items.filter(item => item.isShowing === true)
        }));
      }
    });
  }

  return menus;
};

/**
 * 根據ID獲取菜單
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Boolean} includeUnpublished - 是否包含未發布的項目（預設 false）
 * @returns {Promise<Object>} 菜單物件
 */
export const getMenuById = async (storeId, menuId, includeUnpublished = false) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 查詢特定菜單
  const menu = await Menu.findOne({ _id: menuId, store: storeId })
    .populate([
      {
        path: 'categories.items.dishTemplate',
        model: 'DishTemplate',
        select: 'name description basePrice image tags optionCategories'
      },
      {
        path: 'categories.items.bundle',
        model: 'Bundle',
        select: 'name description image sellingPoint cashPrice pointPrice bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name description voucherType'
        }
      }
    ]);

  if (!menu) {
    throw new AppError('菜單不存在', 404);
  }

  // 如果不包含未發布項目，過濾掉 isShowing: false 的項目
  if (!includeUnpublished) {
    menu.categories = menu.categories.map(category => ({
      ...category.toObject(),
      items: category.items.filter(item => item.isShowing === true)
    }));
  }

  return menu;
};

/**
 * 創建菜單
 * @param {String} storeId - 店鋪ID
 * @param {Object} menuData - 菜單數據
 * @returns {Promise<Object>} 創建的菜單
 */
export const createMenu = async (storeId, menuData) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 如果新菜單要設為啟用，檢查同類型是否已有啟用的菜單
  if (menuData.isActive !== false) { // 預設為啟用
    const existingActiveMenu = await Menu.findOne({
      store: storeId,
      menuType: menuData.menuType,
      isActive: true
    });

    if (existingActiveMenu) {
      const typeText = menuData.menuType === 'food' ? '現金購買餐點' :
        menuData.menuType === 'cash_coupon' ? '現金購買預購券' :
          menuData.menuType === 'point_exchange' ? '點數兌換' : menuData.menuType;
      throw new AppError(`此店鋪已有啟用的「${typeText}」類型菜單：${existingActiveMenu.name}。請先停用現有菜單或將新菜單設為停用狀態。`, 400);
    }
  }

  // 創建菜單
  const menu = new Menu({
    ...menuData,
    store: storeId
  });

  await menu.save();

  // 返回包含填充的商品資訊的菜單
  return await Menu.findById(menu._id).populate([
    {
      path: 'categories.items.dishTemplate',
      model: 'DishTemplate',
      select: 'name description basePrice image tags optionCategories'
    },
    {
      path: 'categories.items.bundle',
      model: 'Bundle',
      select: 'name description image sellingPoint cashPrice pointPrice bundleItems',
      populate: {
        path: 'bundleItems.voucherTemplate',
        select: 'name description voucherType'
      }
    }
  ]);
};

/**
 * 更新菜單
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的菜單
 */
export const updateMenu = async (storeId, menuId, updateData) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 先獲取當前菜單資訊
  const currentMenu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!currentMenu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 檢查啟用狀態變更的邏輯
  if (updateData.isActive === true && !currentMenu.isActive) {
    // 要啟用此菜單，檢查同類型是否已有其他啟用的菜單
    const menuType = updateData.menuType || currentMenu.menuType;
    const existingActiveMenu = await Menu.findOne({
      store: storeId,
      menuType: menuType,
      isActive: true,
      _id: { $ne: menuId } // 排除當前菜單
    });

    if (existingActiveMenu) {
      // 自動停用同類型的其他啟用菜單
      await Menu.updateMany(
        {
          store: storeId,
          menuType: menuType,
          isActive: true,
          _id: { $ne: menuId }
        },
        { isActive: false }
      );
    }
  }

  // 檢查菜單類型變更的邏輯
  if (updateData.menuType && updateData.menuType !== currentMenu.menuType && currentMenu.isActive) {
    // 如果要改變菜單類型且當前是啟用狀態，檢查新類型是否已有啟用的菜單
    const existingActiveMenu = await Menu.findOne({
      store: storeId,
      menuType: updateData.menuType,
      isActive: true,
      _id: { $ne: menuId }
    });

    if (existingActiveMenu) {
      const typeText = updateData.menuType === 'food' ? '現金購買餐點' :
        updateData.menuType === 'cash_coupon' ? '現金購買預購券' :
          updateData.menuType === 'point_exchange' ? '點數兌換' : updateData.menuType;
      throw new AppError(`此店鋪已有啟用的「${typeText}」類型菜單：${existingActiveMenu.name}。請先停用該菜單再進行類型變更。`, 400);
    }
  }

  // 查找並更新菜單
  const menu = await Menu.findOneAndUpdate(
    { _id: menuId, store: storeId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 返回包含填充的商品資訊的菜單
  return await Menu.findById(menu._id).populate([
    {
      path: 'categories.items.dishTemplate',
      model: 'DishTemplate',
      select: 'name description basePrice image tags optionCategories'
    },
    {
      path: 'categories.items.bundle',
      model: 'Bundle',
      select: 'name description image sellingPoint cashPrice pointPrice bundleItems',
      populate: {
        path: 'bundleItems.voucherTemplate',
        select: 'name description voucherType'
      }
    }
  ]);
};

/**
 * 刪除菜單
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @returns {Promise<String>} 刪除成功訊息
 */
export const deleteMenu = async (storeId, menuId) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 查找並刪除菜單
  const menu = await Menu.findOneAndDelete({
    _id: menuId,
    store: storeId
  });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  return '菜單已刪除';
};
