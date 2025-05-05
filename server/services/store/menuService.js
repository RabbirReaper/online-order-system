/**
 * 菜單服務
 * 處理店鋪菜單相關業務邏輯
 */

import Menu from '../../models/Menu/Menu.js';
import Store from '../../models/Store/Store.js';
import DishTemplate from '../../models/Dish/DishTemplate.js';
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

  if (!menu) {
    throw new AppError('店鋪菜單不存在', 404);
  }

  // 處理菜單數據 - 深度填充餐點模板信息
  const populatedMenu = await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });

  // 如果不包含未發布的項目，過濾掉它們
  if (!includeUnpublished) {
    populatedMenu.categories.forEach(category => {
      category.dishes = category.dishes.filter(dish => dish.isPublished);
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

  // 檢查並驗證分類和餐點
  if (menuData.categories && menuData.categories.length > 0) {
    for (const category of menuData.categories) {
      if (!category.name) {
        throw new AppError('分類名稱為必填欄位', 400);
      }

      // 如果有餐點，檢查每個餐點模板是否存在
      if (category.dishes && category.dishes.length > 0) {
        for (const dish of category.dishes) {
          if (!dish.dishTemplate) {
            throw new AppError('餐點模板ID為必填欄位', 400);
          }

          const template = await DishTemplate.findById(dish.dishTemplate);
          if (!template) {
            throw new AppError(`餐點模板 ${dish.dishTemplate} 不存在`, 404);
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

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(newMenu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
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
    // 檢查每個分類和餐點
    for (const category of updateData.categories) {
      if (!category.name) {
        throw new AppError('分類名稱為必填欄位', 400);
      }

      if (category.dishes && category.dishes.length > 0) {
        for (const dish of category.dishes) {
          if (!dish.dishTemplate) {
            throw new AppError('餐點模板ID為必填欄位', 400);
          }

          const template = await DishTemplate.findById(dish.dishTemplate);
          if (!template) {
            throw new AppError(`餐點模板 ${dish.dishTemplate} 不存在`, 404);
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

  if (updateData.isActive !== undefined) {
    menu.isActive = updateData.isActive;
  }

  await menu.save();

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
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
 * @param {Number} dishIndex - 餐點索引
 * @param {Boolean} isPublished - 是否啟用
 * @returns {Promise<Object>} 更新後的菜單
 */
export const toggleMenuItem = async (storeId, menuId, categoryIndex, dishIndex, isPublished) => {
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

  // 檢查分類和餐點是否存在
  if (!menu.categories[categoryIndex]) {
    throw new AppError('指定的分類不存在', 404);
  }

  if (!menu.categories[categoryIndex].dishes[dishIndex]) {
    throw new AppError('指定的餐點不存在', 404);
  }

  // 更新餐點狀態
  menu.categories[categoryIndex].dishes[dishIndex].isPublished = isPublished;

  await menu.save();

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
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

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
};

/**
 * 更新餐點順序
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Array} dishOrders - 餐點順序 [{ dishIndex, order }]
 * @returns {Promise<Object>} 更新後的菜單
 */
export const updateDishOrder = async (storeId, menuId, categoryIndex, dishOrders) => {
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

  // 檢查餐點索引是否有效
  for (const item of dishOrders) {
    if (!menu.categories[categoryIndex].dishes[item.dishIndex]) {
      throw new AppError(`指定的餐點索引 ${item.dishIndex} 不存在`, 404);
    }
  }

  // 更新餐點順序
  for (const item of dishOrders) {
    menu.categories[categoryIndex].dishes[item.dishIndex].order = item.order;
  }

  await menu.save();

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
};

/**
 * 添加餐點到菜單
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Object} dishData - 餐點數據
 * @returns {Promise<Object>} 更新後的菜單
 */
export const addDishToMenu = async (storeId, menuId, categoryIndex, dishData) => {
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

  // 驗證餐點數據
  if (!dishData.dishTemplate) {
    throw new AppError('餐點模板ID為必填欄位', 400);
  }

  // 檢查餐點模板是否存在
  const template = await DishTemplate.findById(dishData.dishTemplate);
  if (!template) {
    throw new AppError('餐點模板不存在', 404);
  }

  // 添加默認值
  if (dishData.isPublished === undefined) {
    dishData.isPublished = true;
  }

  if (dishData.order === undefined) {
    // 自動設置順序為該分類中的最後一個
    const lastDish = menu.categories[categoryIndex].dishes
      .sort((a, b) => b.order - a.order)[0];
    dishData.order = lastDish ? lastDish.order + 1 : 0;
  }

  // 添加餐點到分類
  menu.categories[categoryIndex].dishes.push(dishData);

  await menu.save();

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
};

/**
 * 從菜單中移除餐點
 * @param {String} storeId - 店鋪ID
 * @param {String} menuId - 菜單ID
 * @param {Number} categoryIndex - 分類索引
 * @param {Number} dishIndex - 餐點索引
 * @returns {Promise<Object>} 更新後的菜單
 */
export const removeDishFromMenu = async (storeId, menuId, categoryIndex, dishIndex) => {
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

  // 檢查餐點是否存在
  if (!menu.categories[categoryIndex].dishes[dishIndex]) {
    throw new AppError('指定的餐點不存在', 404);
  }

  // 移除餐點
  menu.categories[categoryIndex].dishes.splice(dishIndex, 1);

  await menu.save();

  // 返回包含填充的模板資訊的菜單
  return await Menu.findById(menu._id).populate({
    path: 'categories.dishes.dishTemplate',
    model: 'DishTemplate',
    select: 'name description basePrice image tags optionCategories'
  });
};
