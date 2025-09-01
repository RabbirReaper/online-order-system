<template>
  <BModal
    v-model:show="showModal"
    title="生成 QR Code 桌牌"
    size="xl"
    centered
    no-close-on-backdrop
    no-close-on-esc
  >
    <div class="row">
      <!-- 設定區域 -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title mb-3">桌牌設定</h6>

            <!-- 桌號設定 -->
            <div class="mb-4">
              <label class="form-label fw-bold"> <i class="bi bi-hash me-1"></i>桌號設定 </label>
              <div class="input-group">
                <BFormInput
                  v-model="tableConfig.tableNumber"
                  placeholder="請輸入桌號 (例: A1, 1, VIP1)"
                  maxlength="10"
                  @input="updatePreview"
                />
                <span class="input-group-text">
                  <i
                    class="bi bi-check-circle-fill text-success"
                    v-if="tableConfig.tableNumber"
                  ></i>
                  <i class="bi bi-exclamation-circle-fill text-warning" v-else></i>
                </span>
              </div>
              <BFormText class="mt-1">支援中英文混合，最多 10 個字符</BFormText>
            </div>

            <!-- 尺寸選擇 -->
            <div class="mb-4">
              <label class="form-label fw-bold">
                <i class="bi bi-aspect-ratio me-1"></i>桌牌尺寸
              </label>
              <div class="btn-group w-100" role="group">
                <input
                  type="radio"
                  class="btn-check"
                  name="size"
                  id="size-1x1"
                  value="1x1"
                  v-model="tableConfig.size"
                  @change="updatePreview"
                />
                <label class="btn btn-outline-primary" for="size-1x1">
                  <div class="text-center">
                    <div class="fw-bold">1×1</div>
                    <small>10×10cm</small><br />
                    <small class="text-muted">小桌面</small>
                  </div>
                </label>

                <input
                  type="radio"
                  class="btn-check"
                  name="size"
                  id="size-2x3"
                  value="2x3"
                  v-model="tableConfig.size"
                  @change="updatePreview"
                />
                <label class="btn btn-outline-primary" for="size-2x3">
                  <div class="text-center">
                    <div class="fw-bold">2×3</div>
                    <small>20×30cm</small><br />
                    <small class="text-muted">標準餐桌</small>
                  </div>
                </label>

                <input
                  type="radio"
                  class="btn-check"
                  name="size"
                  id="size-3x4"
                  value="3x4"
                  v-model="tableConfig.size"
                  @change="updatePreview"
                />
                <label class="btn btn-outline-primary" for="size-3x4">
                  <div class="text-center">
                    <div class="fw-bold">3×4</div>
                    <small>30×40cm</small><br />
                    <small class="text-muted">大餐桌</small>
                  </div>
                </label>
              </div>
            </div>

            <!-- QR Code 連結說明 -->
            <div class="mb-4" v-if="props.store">
              <div
                class="alert"
                :class="props.store.enableLineOrdering ? 'alert-info' : 'alert-warning'"
              >
                <div class="d-flex align-items-center">
                  <i
                    class="bi"
                    :class="props.store.enableLineOrdering ? 'bi-line me-2' : 'bi-globe me-2'"
                  ></i>
                  <div>
                    <strong>QR Code 連結類型:</strong><br />
                    <span v-if="props.store.enableLineOrdering">
                      LINE LIFF 連結 (適用於 LINE 內開啟)
                    </span>
                    <span v-else> 顾客菜單頁面 (適用於任何瀏覽器) </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 樣式設定 -->
            <div class="mb-4">
              <label class="form-label fw-bold"> <i class="bi bi-palette me-1"></i>樣式設定 </label>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small">背景顏色</label>
                  <div class="d-flex">
                    <BFormInput
                      type="color"
                      v-model="tableConfig.backgroundColor"
                      class="form-control-color"
                      style="width: 50px; height: 38px"
                      @input="updatePreview"
                    />
                    <BFormInput
                      v-model="tableConfig.backgroundColor"
                      placeholder="#FFFFFF"
                      class="ms-2"
                      @input="updatePreview"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small">文字顏色</label>
                  <div class="d-flex">
                    <BFormInput
                      type="color"
                      v-model="tableConfig.textColor"
                      class="form-control-color"
                      style="width: 50px; height: 38px"
                      @input="updatePreview"
                    />
                    <BFormInput
                      v-model="tableConfig.textColor"
                      placeholder="#000000"
                      class="ms-2"
                      @input="updatePreview"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 批量生成設定 -->
            <div class="mb-0">
              <BFormCheckbox v-model="showBatchOptions" switch class="mb-3">
                啟用批量生成
              </BFormCheckbox>

              <div v-if="showBatchOptions" class="border rounded p-3">
                <h6 class="mb-3">批量生成設定</h6>

                <div class="mb-3">
                  <label class="form-label small">生成方式</label>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="batchMode"
                      id="range-mode"
                      value="range"
                      v-model="batchConfig.mode"
                    />
                    <label class="form-check-label" for="range-mode"> 數字範圍 </label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="batchMode"
                      id="custom-mode"
                      value="custom"
                      v-model="batchConfig.mode"
                    />
                    <label class="form-check-label" for="custom-mode"> 自訂桌號 </label>
                  </div>
                </div>

                <div v-if="batchConfig.mode === 'range'" class="mb-3">
                  <div class="row g-2">
                    <div class="col">
                      <label class="form-label small">起始桌號</label>
                      <BFormInput type="number" v-model.number="batchConfig.startNumber" min="1" />
                    </div>
                    <div class="col">
                      <label class="form-label small">結束桌號</label>
                      <BFormInput type="number" v-model.number="batchConfig.endNumber" min="1" />
                    </div>
                  </div>
                </div>

                <div v-if="batchConfig.mode === 'custom'" class="mb-3">
                  <label class="form-label small">自訂桌號列表</label>
                  <BFormTextarea
                    v-model="batchConfig.customNumbers"
                    rows="3"
                    placeholder="請輸入桌號，以逗號分隔 (例: A1,A2,B1,VIP1)"
                  />
                </div>

                <div class="alert alert-info small mb-0">
                  <i class="bi bi-info-circle me-1"></i>
                  預計生成: <strong>{{ estimatedCount }}</strong> 張桌牌
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 預覽區域 -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-3">即時預覽</h6>

            <div class="flex-grow-1 d-flex align-items-center justify-content-center">
              <div v-if="!tableConfig.tableNumber" class="text-center text-muted">
                <i class="bi bi-qr-code" style="font-size: 4rem; opacity: 0.3"></i>
                <p class="mt-2">請輸入桌號以顯示預覽</p>
              </div>

              <div v-else class="text-center preview-container">
                <div class="preview-frame" :class="`preview-${tableConfig.size}`">
                  <canvas
                    ref="previewCanvas"
                    class="preview-canvas"
                    :width="previewSize.width"
                    :height="previewSize.height"
                  ></canvas>
                </div>

                <div class="mt-3">
                  <small class="text-muted">
                    桌號: {{ tableConfig.tableNumber }} | 尺寸: {{ currentSizeInfo.display }} |
                    實際大小: {{ currentSizeInfo.realSize }}
                  </small>
                </div>
              </div>
            </div>

            <div class="mt-3">
              <BButton
                variant="outline-primary"
                size="sm"
                @click="updatePreview"
                :disabled="!tableConfig.tableNumber"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>重新生成預覽
              </BButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="d-flex justify-content-between w-100">
        <div>
          <BButton variant="info" @click="showBatchModal = true" v-if="!showBatchOptions">
            <i class="bi bi-stack me-1"></i>批量生成
          </BButton>
        </div>

        <div class="d-flex gap-2">
          <BButton variant="secondary" @click="closeModal">取消</BButton>

          <BButton
            variant="success"
            @click="downloadSingle"
            :disabled="!tableConfig.tableNumber || isGenerating"
            v-if="!showBatchOptions"
          >
            <span v-if="isGenerating" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-download me-1"></i>
            {{ isGenerating ? '生成中...' : '下載 PNG' }}
          </BButton>

          <BButton
            variant="primary"
            @click="downloadBatch"
            :disabled="estimatedCount === 0 || isGenerating"
            v-if="showBatchOptions"
          >
            <span v-if="isGenerating" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-file-earmark-zip me-1"></i>
            {{ isGenerating ? '生成中...' : `下載 ZIP (${estimatedCount} 張)` }}
          </BButton>
        </div>
      </div>
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  BModal,
  BButton,
  BFormInput,
  BFormCheckbox,
  BFormTextarea,
  BFormText,
} from 'bootstrap-vue-next'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  brandId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  store: {
    type: Object,
    required: false,
    default: null,
  },
})

// Emits
const emit = defineEmits(['update:show'])

// 響應式數據
const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

// 尺寸配置
const sizeConfigs = {
  '1x1': {
    width: 1181,
    height: 1181,
    qrSize: 400,
    fontSize: 48,
    padding: 80,
    display: '1×1',
    realSize: '10×10cm',
  },
  '2x3': {
    width: 2362,
    height: 3543,
    qrSize: 800,
    fontSize: 96,
    padding: 160,
    display: '2×3',
    realSize: '20×30cm',
  },
  '3x4': {
    width: 3543,
    height: 4724,
    qrSize: 1200,
    fontSize: 144,
    padding: 240,
    display: '3×4',
    realSize: '30×40cm',
  },
}

// 桌牌配置
const tableConfig = ref({
  tableNumber: '',
  size: '2x3',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
})

// 批量生成配置
const showBatchOptions = ref(false)
const batchConfig = ref({
  mode: 'range',
  startNumber: 1,
  endNumber: 10,
  customNumbers: '',
})

// 狀態
const isGenerating = ref(false)
const previewCanvas = ref(null)

// 計算屬性
const baseUrl = computed(() => window.location.origin)

const currentSizeInfo = computed(() => sizeConfigs[tableConfig.value.size])

const previewSize = computed(() => {
  const config = currentSizeInfo.value
  // 預覽時縮放到合適的大小
  const scale = 0.15
  return {
    width: config.width * scale,
    height: config.height * scale,
  }
})

const estimatedCount = computed(() => {
  if (!showBatchOptions.value) return 0

  if (batchConfig.value.mode === 'range') {
    const start = batchConfig.value.startNumber
    const end = batchConfig.value.endNumber
    return Math.max(0, end - start + 1)
  } else {
    const numbers = batchConfig.value.customNumbers
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
    return numbers.length
  }
})

// QR Code 生成函數
const generateQRCode = async (tableNumber) => {
  let url

  // 如果有 store 資料且啟用 LINE 點餐，使用 LIFF 連結
  if (props.store && props.store.enableLineOrdering) {
    const liffId = '2007974797-rvmVYQB0' // 可以改為從環境變數讀取
    if (liffId) {
      url = `https://liff.line.me/${liffId}?brandId=${props.brandId}&storeId=${props.storeId}&tableNumber=${tableNumber}`
    } else {
      // 沒有 LIFF ID 時回退到顧客菜單頁面
      url = `${baseUrl.value}/stores/${props.brandId}/${props.storeId}?tableNumber=${tableNumber}`
    }
  } else {
    // 沒有 store 資料或沒有啟用 LINE 點餐，使用顧客菜單頁面
    url = `${baseUrl.value}/stores/${props.brandId}/${props.storeId}?tableNumber=${tableNumber}`
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: currentSizeInfo.value.qrSize,
      margin: 1,
      color: {
        dark: tableConfig.value.textColor,
        light: tableConfig.value.backgroundColor,
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('QR Code 生成失敗:', error)
    return null
  }
}

// 生成桌牌圖片
const generateTableCard = async (config) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const sizeConfig = sizeConfigs[config.size]

  // 設定 Canvas 尺寸
  canvas.width = sizeConfig.width
  canvas.height = sizeConfig.height

  // 填充背景色
  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 繪製裝飾邊框
  const borderWidth = sizeConfig.padding * 0.2
  ctx.strokeStyle = config.textColor
  ctx.lineWidth = borderWidth
  ctx.setLineDash([borderWidth * 2, borderWidth])
  ctx.strokeRect(
    borderWidth / 2,
    borderWidth / 2,
    canvas.width - borderWidth,
    canvas.height - borderWidth,
  )
  ctx.setLineDash([]) // 重置虛線

  // 生成並繪製 QR Code
  const qrCodeDataURL = await generateQRCode(config.tableNumber)
  if (!qrCodeDataURL) return null

  const qrImage = new Image()

  return new Promise((resolve) => {
    qrImage.onload = () => {
      // 計算佈局
      const centerX = canvas.width / 2
      const topPadding = sizeConfig.padding * 1.5

      // 繪製品牌名稱（頂部）
      ctx.font = `bold ${sizeConfig.fontSize * 0.7}px Arial, "Microsoft JhengHei", sans-serif`
      ctx.fillStyle = config.textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // 品牌名稱背景裝飾
      const brandText = 'Rabbir 點餐系統'
      const brandMetrics = ctx.measureText(brandText)
      const brandBg = {
        width: brandMetrics.width + sizeConfig.padding * 0.8,
        height: sizeConfig.fontSize * 0.9,
        x: centerX - (brandMetrics.width + sizeConfig.padding * 0.8) / 2,
        y: topPadding * 0.6,
      }

      // 繪製品牌背景裝飾
      ctx.fillStyle = config.textColor + '10' // 透明度10%
      ctx.fillRect(brandBg.x, brandBg.y, brandBg.width, brandBg.height)

      // 繪製品牌名稱
      ctx.fillStyle = config.textColor
      ctx.fillText(brandText, centerX, topPadding)

      // 繪製裝飾線
      const lineY = topPadding + sizeConfig.fontSize * 1.2
      ctx.strokeStyle = config.textColor
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(centerX - sizeConfig.qrSize * 0.3, lineY)
      ctx.lineTo(centerX + sizeConfig.qrSize * 0.3, lineY)
      ctx.stroke()

      // 計算 QR Code 位置（中間偏上）
      const qrX = (canvas.width - sizeConfig.qrSize) / 2
      const qrY = lineY + sizeConfig.padding * 0.8

      // QR Code 背景陰影
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(qrX + 10, qrY + 10, sizeConfig.qrSize, sizeConfig.qrSize)

      // 繪製 QR Code
      ctx.drawImage(qrImage, qrX, qrY, sizeConfig.qrSize, sizeConfig.qrSize)

      // QR Code 邊框裝飾
      ctx.strokeStyle = config.textColor
      ctx.lineWidth = 6
      ctx.strokeRect(qrX - 3, qrY - 3, sizeConfig.qrSize + 6, sizeConfig.qrSize + 6)

      // 繪製桌號（底部）
      const tableNumberY = qrY + sizeConfig.qrSize + sizeConfig.padding * 0.8

      // 桌號背景裝飾
      ctx.fillStyle = config.textColor
      const tableTextSize = sizeConfig.fontSize * 1.2
      ctx.font = `bold ${tableTextSize}px Arial, "Microsoft JhengHei", sans-serif`

      const tableText = `桌號 ${config.tableNumber}`
      const tableMetrics = ctx.measureText(tableText)
      const tableBg = {
        width: tableMetrics.width + sizeConfig.padding * 0.6,
        height: tableTextSize * 1.2,
        x: centerX - (tableMetrics.width + sizeConfig.padding * 0.6) / 2,
        y: tableNumberY - tableTextSize * 0.1,
      }

      // 圓角矩形背景
      ctx.fillRect(tableBg.x, tableBg.y, tableBg.width, tableBg.height)

      // 桌號文字（白色）
      ctx.fillStyle = config.backgroundColor
      ctx.fillText(tableText, centerX, tableNumberY)

      // 底部裝飾圖案
      ctx.fillStyle = config.textColor + '30' // 透明度30%
      const decorY = tableNumberY + tableTextSize * 1.8
      for (let i = 0; i < 5; i++) {
        const x = centerX - 60 + i * 30
        ctx.beginPath()
        ctx.arc(x, decorY, 6, 0, 2 * Math.PI)
        ctx.fill()
      }

      resolve(canvas.toDataURL('image/png'))
    }

    qrImage.onerror = () => resolve(null)
    qrImage.src = qrCodeDataURL
  })
}

// 更新預覽
const updatePreview = async () => {
  if (!tableConfig.value.tableNumber || !previewCanvas.value) return

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  const config = currentSizeInfo.value
  const scale = 0.15

  // 清空畫布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 填充背景色
  ctx.fillStyle = tableConfig.value.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 繪製裝飾邊框（縮放版）
  const borderWidth = config.padding * scale * 0.2
  ctx.strokeStyle = tableConfig.value.textColor
  ctx.lineWidth = borderWidth
  ctx.setLineDash([borderWidth * 2, borderWidth])
  ctx.strokeRect(
    borderWidth / 2,
    borderWidth / 2,
    canvas.width - borderWidth,
    canvas.height - borderWidth,
  )
  ctx.setLineDash([])

  try {
    const qrSize = config.qrSize * scale
    const fontSize = config.fontSize * scale
    const padding = config.padding * scale

    const qrCodeDataURL = await generateQRCode(tableConfig.value.tableNumber)
    if (!qrCodeDataURL) return

    const qrImage = new Image()
    qrImage.onload = () => {
      const centerX = canvas.width / 2
      const topPadding = padding * 1.5

      // 繪製品牌名稱（頂部）
      ctx.font = `bold ${fontSize * 0.7}px Arial, "Microsoft JhengHei", sans-serif`
      ctx.fillStyle = tableConfig.value.textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const brandText = 'Rabbir 點餐系統'
      const brandMetrics = ctx.measureText(brandText)

      // 品牌名稱背景裝飾
      const brandBg = {
        width: brandMetrics.width + padding * 0.8,
        height: fontSize * 0.9,
        x: centerX - (brandMetrics.width + padding * 0.8) / 2,
        y: topPadding * 0.6,
      }

      ctx.fillStyle = tableConfig.value.textColor + '10'
      ctx.fillRect(brandBg.x, brandBg.y, brandBg.width, brandBg.height)

      ctx.fillStyle = tableConfig.value.textColor
      ctx.fillText(brandText, centerX, topPadding)

      // 裝飾線
      const lineY = topPadding + fontSize * 1.2
      ctx.strokeStyle = tableConfig.value.textColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX - qrSize * 0.3, lineY)
      ctx.lineTo(centerX + qrSize * 0.3, lineY)
      ctx.stroke()

      // QR Code 位置
      const qrX = (canvas.width - qrSize) / 2
      const qrY = lineY + padding * 0.8

      // QR Code 背景陰影（縮放）
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(qrX + 2, qrY + 2, qrSize, qrSize)

      // 繪製 QR Code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

      // QR Code 邊框
      ctx.strokeStyle = tableConfig.value.textColor
      ctx.lineWidth = 1
      ctx.strokeRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2)

      // 桌號文字
      const tableNumberY = qrY + qrSize + padding * 0.8
      const tableTextSize = fontSize * 1.2
      ctx.font = `bold ${tableTextSize}px Arial, "Microsoft JhengHei", sans-serif`

      const tableText = `桌號 ${tableConfig.value.tableNumber}`
      const tableMetrics = ctx.measureText(tableText)

      // 桌號背景
      const tableBg = {
        width: tableMetrics.width + padding * 0.6,
        height: tableTextSize * 1.2,
        x: centerX - (tableMetrics.width + padding * 0.6) / 2,
        y: tableNumberY - tableTextSize * 0.1,
      }

      ctx.fillStyle = tableConfig.value.textColor
      ctx.fillRect(tableBg.x, tableBg.y, tableBg.width, tableBg.height)

      ctx.fillStyle = tableConfig.value.backgroundColor
      ctx.fillText(tableText, centerX, tableNumberY)

      // 底部裝飾圖案
      ctx.fillStyle = tableConfig.value.textColor + '30'
      const decorY = tableNumberY + tableTextSize * 1.8
      for (let i = 0; i < 5; i++) {
        const x = centerX - 12 + i * 6
        ctx.beginPath()
        ctx.arc(x, decorY, 1, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
    qrImage.src = qrCodeDataURL
  } catch (error) {
    console.error('預覽更新失敗:', error)
  }
}

// 下載單張桌牌
const downloadSingle = async () => {
  if (!tableConfig.value.tableNumber) return

  isGenerating.value = true

  try {
    const dataURL = await generateTableCard(tableConfig.value)
    if (dataURL) {
      const link = document.createElement('a')
      link.download = `桌牌_${tableConfig.value.tableNumber}_${tableConfig.value.size}.png`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('下載失敗:', error)
    alert('下載失敗，請稍後再試')
  } finally {
    isGenerating.value = false
  }
}

// 批量下載
const downloadBatch = async () => {
  if (estimatedCount.value === 0) return

  isGenerating.value = true

  try {
    const zip = new JSZip()
    let tableNumbers = []

    // 根據模式生成桌號列表
    if (batchConfig.value.mode === 'range') {
      for (let i = batchConfig.value.startNumber; i <= batchConfig.value.endNumber; i++) {
        tableNumbers.push(String(i))
      }
    } else {
      tableNumbers = batchConfig.value.customNumbers
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
    }

    // 生成每張桌牌
    for (let i = 0; i < tableNumbers.length; i++) {
      const tableNumber = tableNumbers[i]
      const config = {
        ...tableConfig.value,
        tableNumber,
      }

      const dataURL = await generateTableCard(config)
      if (dataURL) {
        const base64Data = dataURL.split(',')[1]
        zip.file(`桌牌_${tableNumber}_${tableConfig.value.size}.png`, base64Data, { base64: true })
      }

      // 可以在這裡加入進度顯示
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const fileName = `店鋪桌牌_${tableConfig.value.size}_${new Date().toISOString().split('T')[0]}.zip`
    saveAs(content, fileName)
  } catch (error) {
    console.error('批量下載失敗:', error)
    alert('批量下載失敗，請稍後再試')
  } finally {
    isGenerating.value = false
  }
}

// 關閉模態窗
const closeModal = () => {
  showModal.value = false
}

// 監聽變化
watch(
  () => tableConfig.value.tableNumber,
  () => {
    nextTick(() => updatePreview())
  },
  { immediate: true },
)

watch(
  () => tableConfig.value.size,
  () => {
    nextTick(() => updatePreview())
  },
)

// 組件掛載後初始化預覽
onMounted(() => {
  if (tableConfig.value.tableNumber) {
    nextTick(() => updatePreview())
  }
})
</script>

<style scoped>
.preview-container {
  max-width: 100%;
}

.preview-frame {
  border: 2px dashed #dee2e6;
  padding: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  overflow: hidden;
}

.preview-frame::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #007bff, #6f42c1, #e83e8c, #fd7e14);
  border-radius: 14px;
  z-index: -1;
  animation: borderGlow 3s ease-in-out infinite alternate;
}

@keyframes borderGlow {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 8px 20px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.preview-canvas:hover {
  transform: scale(1.02);
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.15),
    0 12px 30px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.preview-1x1 .preview-canvas {
  width: 240px;
  height: 240px;
}

.preview-2x3 .preview-canvas {
  width: 220px;
  height: 330px;
}

.preview-3x4 .preview-canvas {
  width: 240px;
  height: 320px;
}

.form-control-color {
  padding: 0.2rem;
  border-radius: 0.375rem;
}

.btn-check:checked + .btn-outline-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/* 批量選項動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 美化按鈕效果 */
.btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

/* 卡片陰影效果 */
.card {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.07),
    0 8px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 12px rgba(0, 0, 0, 0.1),
    0 16px 40px rgba(0, 0, 0, 0.15);
}

/* 輸入框美化 */
.form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  border-color: #86b7fe;
}

/* 預覽容器美化 */
.preview-container {
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 載入動畫美化 */
.spinner-border {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
