/**
 * 菜單服務
 * 處理店鋪菜單相關的業務邏輯
 * 菜單中顯示 Bundle 作為商品，Bundle 內含 VoucherTemplate
 */

import Menu from '../../models/Menu/Menu.js';
import Store from '../../models/Store/Store.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
import Bundle from '../../models/Promotion/Bundle.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取店鋪菜單
 * @param {String} storeId - 店鋪ID
 * @param {Boolean} includeUnpublished - 是否包含未發布的項目（預設 false）
 * @returns {Promise<Object>} 菜單物件
 */
export const getStoreMenu = async (storeId, includeUnpublished = false) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 查詢菜單 - Bundle 作為商品項目
  const menu = await Menu.findOne({ store: storeId })
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

  // 檢查是否已有菜單
  const existingMenu = await Menu.findOne({ store: storeId });

  if (existingMenu) {
    throw new AppError('此店鋪已有菜單，請使用更新功能', 400);
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
