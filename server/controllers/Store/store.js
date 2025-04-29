import * as storeService from '../../services/store/storeManagement.js';
import { asyncHandler } from '../../middlewares/error.js';

// 獲取所有店家
export const getAllStores = asyncHandler(async (req, res) => {
  try {
    const options = {
      brandId: req.query.brandId,
      activeOnly: req.query.activeOnly === 'true'
    };

    const stores = await storeService.getAllStores(options);

    res.json({
      success: true,
      stores
    });
  } catch (error) {
    console.error('Error getting stores:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 獲取單個店家
export const getStoreById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeService.getStoreById(id);

    res.json({
      success: true,
      store
    });
  } catch (error) {
    console.error('Error getting store:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 創建店家
export const createStore = asyncHandler(async (req, res) => {
  try {
    // 處理可能的圖片資料
    if (req.file) {
      req.body.imageData = req.file.buffer;
    }

    const newStore = await storeService.createStore(req.body);

    res.json({
      success: true,
      message: 'Store created successfully',
      store: newStore
    });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新店家
export const updateStore = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 處理圖片資料
    if (req.file) {
      req.body.imageData = req.file.buffer;
    }

    const updatedStore = await storeService.updateStore(id, req.body);

    res.json({
      success: true,
      message: 'Store updated successfully',
      store: updatedStore
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 刪除店家
export const deleteStore = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await storeService.deleteStore(id);

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 切換店家啟用狀態
export const toggleStoreActive = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 isActive'
      });
    }

    const store = await storeService.toggleStoreActive(id, isActive);

    res.json({
      success: true,
      message: `Store ${isActive ? 'activated' : 'deactivated'} successfully`,
      store
    });
  } catch (error) {
    console.error('Error toggling store status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取店家營業時間
export const getStoreBusinessHours = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const businessHours = await storeService.getStoreBusinessHours(id);

    res.json({
      success: true,
      businessHours
    });
  } catch (error) {
    console.error('Error getting business hours:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新店家營業時間
export const updateStoreBusinessHours = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { businessHours } = req.body;

    if (!businessHours) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 businessHours'
      });
    }

    const store = await storeService.updateStoreBusinessHours(id, businessHours);

    res.json({
      success: true,
      message: 'Business hours updated successfully',
      store
    });
  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 更新店家公告
export const updateStoreAnnouncements = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { announcements } = req.body;

    if (!announcements) {
      return res.status(400).json({
        success: false,
        message: '缺少參數 announcements'
      });
    }

    const store = await storeService.updateStoreAnnouncements(id, announcements);

    res.json({
      success: true,
      message: 'Announcements updated successfully',
      store
    });
  } catch (error) {
    console.error('Error updating announcements:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// 獲取店家當前營業狀態
export const getStoreCurrentStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const status = await storeService.getStoreCurrentStatus(id);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting store status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});
