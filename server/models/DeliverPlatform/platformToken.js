import mongoose from 'mongoose'

/**
 * 外送平台 Token Schema
 * 用於儲存和管理各平台的認證 token
 */
const platformTokenSchema = new mongoose.Schema(
  {
    // 平台類型
    platform: {
      type: String,
      enum: ['foodpanda', 'ubereats'],
      required: true,
    },

    // Access Token
    accessToken: {
      type: String,
      required: true,
    },

    // Refresh Token（某些平台可能有）
    refreshToken: {
      type: String,
    },

    // Token 過期時間
    expiresAt: {
      type: Date,
      required: true,
    },

    // 額外的平台特定資料
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model('PlatformToken', platformTokenSchema)
