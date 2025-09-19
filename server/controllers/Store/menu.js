/**
 * 菜單控制器
 * 處理菜單相關的 HTTP 請求
 * 支援多菜單邏輯：一個店鋪可以有多個菜單，但同種類型一次只能有一個啟用
 */

import * as menuService from '../../services/store/menuService.js'
import { asyncHandler } from '../../middlewares/error.js'

/**
 * 獲取店鋪的所有菜單
 */
export const getAllStoreMenus = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params
  const { includeUnpublished, activeOnly, menuType } = req.query

  const options = {
    includeUnpublished: includeUnpublished === 'true',
    activeOnly: activeOnly === 'true',
    menuType: menuType || undefined,
  }

  const menus = await menuService.getAllStoreMenus(storeId, options)

  res.json({
    success: true,
    message: '店鋪菜單列表獲取成功',
    menus,
  })
})

/**
 * 根據ID獲取特定菜單
 */
export const getMenuById = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params
  const { includeUnpublished } = req.query

  const menu = await menuService.getMenuById(storeId, menuId, includeUnpublished === 'true')

  res.json({
    success: true,
    message: '菜單獲取成功',
    menu,
  })
})

/**
 * 創建菜單
 */
export const createMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId } = req.params

  // 確保菜單資料包含必要的店鋪和品牌資訊
  const menuData = {
    ...req.body,
    store: storeId,
    brand: brandId,
  }

  const menu = await menuService.createMenu(storeId, menuData)

  res.status(201).json({
    success: true,
    message: '菜單創建成功',
    menu,
  })
})

/**
 * 更新菜單
 */
export const updateMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params

  const menu = await menuService.updateMenu(storeId, menuId, req.body)

  res.json({
    success: true,
    message: '菜單更新成功',
    menu,
  })
})

/**
 * 刪除菜單
 */
export const deleteMenu = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params

  const message = await menuService.deleteMenu(storeId, menuId)

  res.json({
    success: true,
    message,
  })
})

/**
 * 根據ID獲取菜單且完整填充商品與選項 - 用於外送平台上傳Menu
 */
export const getMenuAllPopulateById = asyncHandler(async (req, res) => {
  const { brandId, storeId, menuId } = req.params
  const { includeUnpublished } = req.query

  const menu = await menuService.getMenuAllPopulateById(storeId, menuId, includeUnpublished === 'true')

  res.json({
    success: true,
    message: '完整菜單獲取成功',
    menu,
  })
})
