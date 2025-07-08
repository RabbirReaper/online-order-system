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
 * 獲取店鋪菜單（單個菜單，向後兼容）
 * @param {String} storeId - 店鋪ID
 * @param {Boolean} includeUnpublished - 是否包含未發布的項目（預設 false）
 * @param {String} menuType - 菜單類型（可選，預設獲取第一個啟用的菜單）
 * @returns {Promise<Object>} 菜單物件
 */
export const getStoreMenu = async (storeId, includeUnpublished = false, menuType = null) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 構建查詢條件
  const queryConditions = { store: storeId, isActive: true };

  if (menuType) {
    queryConditions.menuType = menuType;
  }

  // 查詢菜單 - 如果指定類型則找該類型，否則找第一個啟用的
  const menu = await Menu.findOne(queryConditions)
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
    .sort({ createdAt: -1 });

  if (!menu) {
    throw new AppError('此店鋪尚未建立菜單', 404);
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
      throw new AppError(`此店鋪已有啟用的「${getMenuTypeText(menuData.menuType)}」類型菜單：${existingActiveMenu.name}。請先停用現有菜單或將新菜單設為停用狀態。`, 400);
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
      throw new AppError(`此店鋪已有啟用的「${getMenuTypeText(updateData.menuType)}」類型菜單：${existingActiveMenu.name}。請先停用該菜單再進行類型變更。`, 400);
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
 * @returns {Promise<Object>} 刪除結果
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

  return { success: true, message: '菜單已刪除' };
};

/**
 * 切換菜單啟用狀態
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Boolean} isActive - 是否啟用
 * @returns {Promise<Object>} 更新後的菜單
 */
export const toggleMenuActive = async (storeId, menuId, isActive) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 如果要啟用菜單，檢查同類型是否已有啟用的菜單
  if (isActive && !menu.isActive) {
    const existingActiveMenu = await Menu.findOne({
      store: storeId,
      menuType: menu.menuType,
      isActive: true,
      _id: { $ne: menuId }
    });

    if (existingActiveMenu) {
      // 自動停用同類型的其他啟用菜單
      await Menu.updateMany(
        {
          store: storeId,
          menuType: menu.menuType,
          isActive: true,
          _id: { $ne: menuId }
        },
        { isActive: false }
      );
    }
  }

  menu.isActive = isActive;
  await menu.save();

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
 * 添加商品到菜單 - 商品可以是 DishTemplate 或 Bundle
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Object} itemData - 商品數據
 * @returns {Promise<Object>} 更新後的菜單
 */
export const addItemToMenu = async (storeId, menuId, categoryIndex, itemData) => {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  // 驗證商品類型和存在性
  if (itemData.itemType === 'dish') {
    const dishTemplate = await DishTemplate.findById(itemData.dishTemplate);
    if (!dishTemplate) {
      throw new AppError('指定的餐點模板不存在', 404);
    }
  } else if (itemData.itemType === 'bundle') {
    // 驗證 Bundle 存在 - Bundle 作為菜單商品
    const bundle = await Bundle.findById(itemData.bundle);
    if (!bundle) {
      throw new AppError('指定的Bundle不存在', 404);
    }

    // 驗證 Bundle 內含的 VoucherTemplate 有效性
    if (bundle.bundleItems && bundle.bundleItems.length > 0) {
      for (const bundleItem of bundle.bundleItems) {
        if (!bundleItem.voucherTemplate) {
          throw new AppError('Bundle中包含無效的兌換券模板', 400);
        }
      }
    } else {
      throw new AppError('Bundle必須包含至少一個兌換券項目', 400);
    }
  } else {
    throw new AppError('不支援的商品類型', 400);
  }

  // 設定商品順序
  if (typeof itemData.order === 'undefined') {
    const lastItem = menu.categories[categoryIndex].items[menu.categories[categoryIndex].items.length - 1];
    itemData.order = lastItem ? lastItem.order + 1 : 0;
  }

  menu.categories[categoryIndex].items.push(itemData);

  await menu.save();

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
 * 從菜單中移除商品
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Number} itemIndex - 商品索引
 * @returns {Promise<Object>} 更新後的菜單
 */
export const removeItemFromMenu = async (storeId, menuId, categoryIndex, itemIndex) => {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  if (!menu.categories[categoryIndex].items[itemIndex]) {
    throw new AppError('指定的商品不存在', 404);
  }

  // 移除商品
  menu.categories[categoryIndex].items.splice(itemIndex, 1);

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
 * 切換菜單項目啟用狀態
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Number} itemIndex - 商品索引
 * @param {Boolean} isShowing - 是否啟用
 * @returns {Promise<Object>} 更新後的菜單
 */
export const toggleMenuItem = async (storeId, menuId, categoryIndex, itemIndex, isShowing) => {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  if (!menu.categories[categoryIndex].items[itemIndex]) {
    throw new AppError('指定的商品不存在', 404);
  }

  menu.categories[categoryIndex].items[itemIndex].isShowing = isShowing;

  await menu.save();

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
 * 獲取菜單類型文字（輔助函數）
 * @param {String} menuType - 菜單類型
 * @returns {String} 菜單類型文字
 */
const getMenuTypeText = (menuType) => {
  const typeMap = {
    'food': '現金購買餐點',
    'cash_coupon': '現金購買預購券',
    'point_exchange': '點數兌換'
  };
  return typeMap[menuType] || menuType;
};
