import * as brandService from '../../services/store/brandService.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有品牌
export const getAllBrands = asyncHandler(async (req, res) => {
  try {
    const brands = await brandService.getAllBrands();

    res.json({
      success: true,
      brands
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 獲取單個品牌
export const getBrandById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await brandService.getBrandById(id);

    res.json({
      success: true,
      brand
    });
  } catch (error) {
    console.error('Error getting brand:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 創建品牌
export const createBrand = asyncHandler(async (req, res) => {
  try {
    // 圖片數據直接從請求體中獲取
    // req.body.imageData 應該包含 Base64 編碼的圖片數據

    const newBrand = await brandService.createBrand(req.body);

    res.json({
      success: true,
      message: 'Brand created successfully',
      brand: newBrand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新品牌
export const updateBrand = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 圖片數據直接從請求體中獲取
    // req.body.imageData 應該包含 Base64 編碼的圖片數據

    const updatedBrand = await brandService.updateBrand(id, req.body);

    res.json({
      success: true,
      message: 'Brand updated successfully',
      brand: updatedBrand
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 刪除品牌
export const deleteBrand = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await brandService.deleteBrand(id);

    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取品牌的所有店鋪
export const getBrandStores = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const options = {
      activeOnly: req.query.activeOnly === 'true'
    };

    const result = await brandService.getBrandStores(id, options);

    res.json({
      success: true,
      brand: result.brand,
      stores: result.stores
    });
  } catch (error) {
    console.error('Error getting brand stores:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取品牌統計數據
export const getBrandStats = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await brandService.getBrandStats(id);

    res.json({
      success: true,
      brand: stats.brand,
      stats: stats.stats
    });
  } catch (error) {
    console.error('Error getting brand stats:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});
