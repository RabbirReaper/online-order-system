/**
 * 菜單服務
 * 處理店鋪菜單相關業務邏輯
 */

import Menu from '../../models/Menu/Menu.js';
import Store from '../../models/Store/Store.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
import Bundle from '../../models/Dish/Bundle.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取店鋪菜單
 * @param {String} storeId - 店鋪ID
 * @param {Boolean} includeUnpublished - 是否包含未發布的項目 (默認 false)
 * @returns {Promise<Object>} 菜單數據
 */
export const getStoreMenu = async (storeId, includeUnpublished = false) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 獲取店鋪菜單
  const menu = await Menu.findOne({ store: storeId });

  // 如果菜單不存在，返回一個空的菜單對象
  if (!menu) {
    return {
      exists: false,
      store: storeId,
      categories: []
    };
  }

  // 處理菜單數據 - 深度填充商品信息
  const populateOptions = [
    {
      path: 'categories.items.dishTemplate',
      model: 'DishTemplate',
      select: 'name description basePrice image tags optionCategories'
    },
    {
      path: 'categories.items.bundle',
      model: 'Bundle',
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
    }
  ];

  const populatedMenu = await Menu.findById(menu._id).populate(populateOptions);

  // 如果不包含未發布的項目，過濾掉它們
  if (!includeUnpublished) {
    populatedMenu.categories.forEach(category => {
      category.items = category.items.filter(item => item.isShowing);
    });
  }

  return populatedMenu;
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

  // 檢查店鋪是否已有菜單
  const existingMenu = await Menu.findOne({ store: storeId });

  if (existingMenu) {
    throw new AppError('店鋪已有菜單，請使用更新操作', 400);
  }

  // 檢查品牌
  if (menuData.brand) {
    if (menuData.brand.toString() !== store.brand.toString()) {
      throw new AppError('菜單品牌必須與店鋪品牌一致', 400);
    }
  } else {
    menuData.brand = store.brand;
  }

  // 關聯店鋪
  menuData.store = storeId;

  // 設置默認菜單類型
  if (!menuData.menuType) {
    menuData.menuType = 'food';
  }

  // 檢查並驗證分類和商品
  if (menuData.categories && menuData.categories.length > 0) {
    for (const category of menuData.categories) {
      if (!category.name) {
        throw new AppError('分類名稱為必填欄位', 400);
      }

      // 如果有商品，檢查每個商品
      if (category.items && category.items.length > 0) {
        for (const item of category.items) {
          if (!item.itemType) {
            throw new AppError('商品類型為必填欄位', 400);
          }

          // 根據商品類型驗證相應字段
          if (item.itemType === 'dish') {
            if (!item.dishTemplate) {
              throw new AppError('餐點模板ID為必填欄位', 400);
            }

            const template = await DishTemplate.findById(item.dishTemplate);
            if (!template) {
              throw new AppError(`餐點模板 ${item.dishTemplate} 不存在`, 404);
            }
          } else if (item.itemType === 'bundle') {
            if (!item.bundle) {
              throw new AppError('套餐ID為必填欄位', 400);
            }

            const bundle = await Bundle.findById(item.bundle);
            if (!bundle) {
              throw new AppError(`套餐 ${item.bundle} 不存在`, 404);
            }
          }
        }
      }
    }
  }

  // 創建菜單
  const newMenu = new Menu(menuData);
  await newMenu.save();

  // 更新店鋪關聯的菜單
  store.menuId = newMenu._id;
  await store.save();

  // 返回包含填充的商品資訊的菜單
  return await Menu.findById(newMenu._id).populate([
    {
      path: 'categories.items.dishTemplate',
      model: 'DishTemplate',
      select: 'name description basePrice image tags optionCategories'
    },
    {
      path: 'categories.items.bundle',
      model: 'Bundle',
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
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

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 不允許更改店鋪或品牌
  delete updateData.store;
  delete updateData.brand;

  // 如果更新分類
  if (updateData.categories) {
    // 檢查每個分類和商品
    for (const category of updateData.categories) {
      if (!category.name) {
        throw new AppError('分類名稱為必填欄位', 400);
      }

      if (category.items && category.items.length > 0) {
        for (const item of category.items) {
          if (!item.itemType) {
            throw new AppError('商品類型為必填欄位', 400);
          }

          // 根據商品類型驗證相應字段
          if (item.itemType === 'dish') {
            if (!item.dishTemplate) {
              throw new AppError('餐點模板ID為必填欄位', 400);
            }

            const template = await DishTemplate.findById(item.dishTemplate);
            if (!template) {
              throw new AppError(`餐點模板 ${item.dishTemplate} 不存在`, 404);
            }
          } else if (item.itemType === 'bundle') {
            if (!item.bundle) {
              throw new AppError('套餐ID為必填欄位', 400);
            }

            const bundle = await Bundle.findById(item.bundle);
            if (!bundle) {
              throw new AppError(`套餐 ${item.bundle} 不存在`, 404);
            }
          }
        }
      }
    }

    menu.categories = updateData.categories;
  }

  // 更新其他欄位
  if (updateData.name !== undefined) {
    menu.name = updateData.name;
  }

  if (updateData.menuType !== undefined) {
    menu.menuType = updateData.menuType;
  }

  if (updateData.isActive !== undefined) {
    menu.isActive = updateData.isActive;
  }

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
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
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

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 刪除菜單
  await menu.deleteOne();

  // 更新店鋪，移除菜單關聯
  if (store.menuId && store.menuId.toString() === menuId) {
    store.menuId = undefined;
    await store.save();
  }

  return { success: true, message: '菜單已刪除' };
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
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 檢查分類和商品是否存在
  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  if (!menu.categories[categoryIndex].items[itemIndex]) {
    throw new AppError('指定的商品不存在', 404);
  }

  // 更新商品狀態
  menu.categories[categoryIndex].items[itemIndex].isShowing = isShowing;

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
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
    }
  ]);
};

/**
 * 更新分類順序
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Array} categoryOrders - 分類順序 [{ categoryIndex, order }]
 * @returns {Promise<Object>} 更新後的菜單
 */
export const updateCategoryOrder = async (storeId, menuId, categoryOrders) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 檢查分類索引是否有效
  for (const item of categoryOrders) {
    if (!menu.categories[item.categoryIndex]) {
      throw new AppError(`指定的分類索引 ${item.categoryIndex} 不存在`, 404);
    }
  }

  // 更新分類順序
  for (const item of categoryOrders) {
    menu.categories[item.categoryIndex].order = item.order;
  }

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
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
    }
  ]);
};

/**
 * 更新商品順序
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Array} itemOrders - 商品順序 [{ itemIndex, order }]
 * @returns {Promise<Object>} 更新後的菜單
 */
export const updateItemOrder = async (storeId, menuId, categoryIndex, itemOrders) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 檢查分類是否存在
  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  // 檢查商品索引是否有效
  for (const item of itemOrders) {
    if (!menu.categories[categoryIndex].items[item.itemIndex]) {
      throw new AppError(`指定的商品索引 ${item.itemIndex} 不存在`, 404);
    }
  }

  // 更新商品順序
  for (const item of itemOrders) {
    menu.categories[categoryIndex].items[item.itemIndex].order = item.order;
  }

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
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
    }
  ]);
};

/**
 * 添加商品到菜單
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Object} itemData - 商品數據
 * @returns {Promise<Object>} 更新後的菜單
 */
export const addItemToMenu = async (storeId, menuId, categoryIndex, itemData) => {
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 檢查分類是否存在
  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  // 驗證商品數據
  if (!itemData.itemType) {
    throw new AppError('商品類型為必填欄位', 400);
  }

  // 根據商品類型驗證相應字段
  if (itemData.itemType === 'dish') {
    if (!itemData.dishTemplate) {
      throw new AppError('餐點模板ID為必填欄位', 400);
    }

    const template = await DishTemplate.findById(itemData.dishTemplate);
    if (!template) {
      throw new AppError('餐點模板不存在', 404);
    }
  } else if (itemData.itemType === 'bundle') {
    if (!itemData.bundle) {
      throw new AppError('套餐ID為必填欄位', 400);
    }

    const bundle = await Bundle.findById(itemData.bundle);
    if (!bundle) {
      throw new AppError('套餐不存在', 404);
    }
  }

  // 添加默認值
  if (itemData.isShowing === undefined) {
    itemData.isShowing = true;
  }

  if (itemData.order === undefined) {
    // 自動設置順序為該分類中的最後一個
    const lastItem = menu.categories[categoryIndex].items
      .sort((a, b) => b.order - a.order)[0];
    itemData.order = lastItem ? lastItem.order + 1 : 0;
  }

  // 添加商品到分類
  menu.categories[categoryIndex].items.push(itemData);

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
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
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
  // 檢查店鋪是否存在
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError('店鋪不存在', 404);
  }

  // 檢查菜單是否存在
  const menu = await Menu.findOne({ _id: menuId, store: storeId });

  if (!menu) {
    throw new AppError('菜單不存在或不屬於指定店鋪', 404);
  }

  // 檢查分類是否存在
  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  // 檢查商品是否存在
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
      select: 'name description sellingPrice sellingPoint originalPrice originalPoint bundleItems'
    }
  ]);
};
