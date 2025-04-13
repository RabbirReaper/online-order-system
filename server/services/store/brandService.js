/**
 * 品牌服務
 * 處理品牌相關業務邏輯
 */

import Brand from '../../models/Brand/Brand.js';
import Store from '../../models/Store/Store.js';
import { AppError } from '../../middlewares/error.js';

/**
 * 獲取所有品牌
 * @param {Object} options - 查詢選項
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 品牌列表與分頁資訊
 */
export const getAllBrands = async (options = {}) => {
  const { page = 1, limit = 20 } = options;

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Brand.countDocuments();

  // 查詢品牌
  const brands = await Brand.find()
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    brands,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 根據ID獲取品牌
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 品牌
 */
export const getBrandById = async (brandId) => {
  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  return brand;
};

/**
 * 創建品牌
 * @param {Object} brandData - 品牌數據
 * @returns {Promise<Object>} 創建的品牌
 */
export const createBrand = async (brandData) => {
  // 基本驗證
  if (!brandData.name) {
    throw new AppError('品牌名稱為必填欄位', 400);
  }

  // 檢查名稱是否已存在
  const existingBrand = await Brand.findOne({ name: brandData.name });
  if (existingBrand) {
    throw new AppError('此品牌名稱已存在', 400);
  }

  // 圖片驗證（如果提供）
  if (brandData.image) {
    if (!brandData.image.url || !brandData.image.key) {
      throw new AppError('圖片資訊不完整', 400);
    }
  }

  // 創建品牌
  const newBrand = new Brand(brandData);
  await newBrand.save();

  return newBrand;
};

/**
 * 更新品牌
 * @param {String} brandId - 品牌ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新後的品牌
 */
export const updateBrand = async (brandId, updateData) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  // 檢查名稱是否已存在（如果要更新名稱）
  if (updateData.name && updateData.name !== brand.name) {
    const existingBrand = await Brand.findOne({
      name: updateData.name,
      _id: { $ne: brandId }
    });

    if (existingBrand) {
      throw new AppError('此品牌名稱已存在', 400);
    }
  }

  // 圖片驗證（如果提供）
  if (updateData.image) {
    if (!updateData.image.url || !updateData.image.key) {
      throw new AppError('圖片資訊不完整', 400);
    }
  }

  // 更新品牌
  Object.keys(updateData).forEach(key => {
    brand[key] = updateData[key];
  });

  await brand.save();

  return brand;
};

/**
 * 刪除品牌
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 刪除結果
 */
export const deleteBrand = async (brandId) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  // 檢查是否有關聯的店鋪
  const storesCount = await Store.countDocuments({ brand: brandId });

  if (storesCount > 0) {
    throw new AppError('此品牌下有關聯的店鋪，無法刪除', 400);
  }

  // 檢查其他資源引用（菜單、餐點模板等）
  // TODO: 根據實際需求添加其他檢查

  await brand.deleteOne();

  return { success: true, message: '品牌已刪除' };
};

/**
 * 獲取品牌下的所有店鋪
 * @param {String} brandId - 品牌ID
 * @param {Object} options - 查詢選項
 * @param {Boolean} options.activeOnly - 是否只顯示啟用的店鋪
 * @param {Number} options.page - 頁碼
 * @param {Number} options.limit - 每頁數量
 * @returns {Promise<Object>} 店鋪列表與分頁資訊
 */
export const getBrandStores = async (brandId, options = {}) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  const { activeOnly = false, page = 1, limit = 20 } = options;

  // 構建查詢條件
  const queryConditions = { brand: brandId };

  if (activeOnly) {
    queryConditions.isActive = true;
  }

  // 計算分頁
  const skip = (page - 1) * limit;

  // 查詢總數
  const total = await Store.countDocuments(queryConditions);

  // 查詢店鋪
  const stores = await Store.find(queryConditions)
    .populate('menuId', 'name')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  // 處理分頁信息
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    brand: {
      _id: brand._id,
      name: brand.name
    },
    stores,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * 獲取品牌統計數據
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 統計數據
 */
export const getBrandStats = async (brandId) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  // 獲取店鋪數量
  const storesCount = await Store.countDocuments({ brand: brandId });

  // 獲取啟用的店鋪數量
  const activeStoresCount = await Store.countDocuments({
    brand: brandId,
    isActive: true
  });

  // TODO: 其他統計數據（訂單數、銷售額等），根據實際需求添加

  return {
    brand: {
      _id: brand._id,
      name: brand.name
    },
    stats: {
      storesCount,
      activeStoresCount,
      // 其他統計數據
    }
  };
};

/**
 * 獲取品牌菜單模板
 * @param {String} brandId - 品牌ID
 * @returns {Promise<Object>} 菜單模板
 */
export const getBrandMenuTemplate = async (brandId) => {
  // 檢查品牌是否存在
  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new AppError('品牌不存在', 404);
  }

  // 查詢屬於該品牌的菜單模板
  // 在實際應用中，可能需要單獨設計一個菜單模板模型
  // 此處僅為示例，返回空對象
  return {
    brand: {
      _id: brand._id,
      name: brand.name
    },
    menuTemplate: {
      // 菜單模板數據
    }
  };
};
