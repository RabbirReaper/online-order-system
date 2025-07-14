import mongoose from 'mongoose'

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    }, // 菜單名稱

    // 菜單類型
    menuType: {
      type: String,
      enum: ['food', 'cash_coupon', 'point_exchange'],
      required: true,
      default: 'food',
    }, // food: 現金購買餐點, cash_coupon: 現金購買預購券, point_exchange: 點數兌換

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    }, // 所屬店鋪

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    }, // 所屬品牌

    categories: [
      {
        name: {
          type: String,
          trim: true,
          required: true,
        }, // 分類名稱

        description: {
          type: String,
        }, // 分類描述

        order: {
          type: Number,
          default: 0,
        }, // 分類順序

        // === 統一的商品項目結構 ===
        items: [
          {
            // 商品類型
            itemType: {
              type: String,
              enum: ['dish', 'bundle'],
              required: true,
            },

            // === 餐點相關（當 itemType = 'dish' 時使用） ===
            dishTemplate: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'DishTemplate',
              required: function () {
                return this.itemType === 'dish'
              },
            }, // 關聯的餐點模板

            // === 套餐相關（當 itemType = 'bundle' 時使用） ===
            bundle: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Bundle',
              required: function () {
                return this.itemType === 'bundle'
              },
            }, // 關聯的套餐

            priceOverride: {
              type: Number,
              validate: {
                validator: function (v) {
                  // 如果設定了現金價格覆蓋，必須是正數
                  return v === null || v === undefined || v > 0
                },
                message: 'Cash price override must be a positive number',
              },
            },

            // 點數價格覆蓋（適用於點數兌換）
            pointOverride: {
              type: Number,
              validate: {
                validator: function (v) {
                  // 如果設定了點數價格覆蓋，必須是正數或0
                  return v === null || v === undefined || v >= 0
                },
                message: 'Point cost override must be a non-negative number',
              },
            },

            // === 商品狀態 ===
            isShowing: {
              type: Boolean,
              default: true,
            }, // 是否發布

            order: {
              type: Number,
              default: 0,
            }, // 在分類中的顯示順序
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    }, // 菜單是否啟用
  },
  { timestamps: true },
)

menuSchema.index({ brand: 1, store: 1 })

export default mongoose.model('Menu', menuSchema)
