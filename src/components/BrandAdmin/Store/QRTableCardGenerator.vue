<template>
  <BModal
    v-model:show="showModal"
    title="生成 QR Code 桌牌"
    size="xl"
    centered
    no-close-on-backdrop
    no-close-on-esc
    @show="handleModalShow"
    @hidden="handleModalHidden"
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

            <!-- 背景圖片上傳 -->
            <div class="mb-4">
              <label class="form-label fw-bold">
                <i class="bi bi-image me-1"></i>背景圖片
                <span class="badge bg-secondary ms-2">選填</span>
              </label>
              <BInputGroup>
                <BFormFile
                  ref="backgroundFileInput"
                  @change="handleBackgroundImageChange"
                  accept="image/png,image/jpeg,image/jpg"
                  :state="errors.backgroundImage ? false : null"
                />
                <BButton
                  variant="outline-secondary"
                  @click="clearBackgroundImage"
                  v-if="backgroundConfig.imageData"
                >
                  清除
                </BButton>
              </BInputGroup>
              <BFormInvalidFeedback v-if="errors.backgroundImage">
                {{ errors.backgroundImage }}
              </BFormInvalidFeedback>
              <BFormText class="mt-1">
                <i class="bi bi-info-circle me-1"></i>
                支援 PNG、JPG 格式，建議尺寸 1181×1181px (10×10cm @ 300 DPI)。桌號將顯示在 QR Code
                中心。
              </BFormText>

              <!-- 圖片資訊顯示 -->
              <div v-if="backgroundConfig.imageData" class="alert alert-info mt-2 small mb-0">
                <i class="bi bi-check-circle-fill me-1"></i>
                已上傳圖片：{{ backgroundConfig.originalWidth }} ×
                {{ backgroundConfig.originalHeight }} px
              </div>
            </div>

            <!-- QR Code 設定 -->
            <div class="mb-4">
              <label class="form-label fw-bold">
                <i class="bi bi-qr-code me-1"></i>QR Code 設定
              </label>

              <div v-if="!backgroundConfig.imageData" class="alert alert-warning small mb-3">
                <i class="bi bi-info-circle me-1"></i>
                未上傳背景圖片時，QR Code 將自動置中，位置設定無效。
              </div>

              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label small">X 座標 (px)</label>
                  <BFormInput
                    type="number"
                    v-model.number="qrConfig.x"
                    min="0"
                    :max="backgroundConfig.canvasWidth - qrConfig.size"
                    @input="updatePreview"
                  />
                  <BFormText class="small">左邊界距離</BFormText>
                </div>

                <div class="col-md-4">
                  <label class="form-label small">Y 座標 (px)</label>
                  <BFormInput
                    type="number"
                    v-model.number="qrConfig.y"
                    min="0"
                    :max="backgroundConfig.canvasHeight - qrConfig.size"
                    @input="updatePreview"
                  />
                  <BFormText class="small">上邊界距離</BFormText>
                </div>

                <div class="col-md-4">
                  <label class="form-label small">大小 (px)</label>
                  <BFormInput
                    type="number"
                    v-model.number="qrConfig.size"
                    min="100"
                    max="800"
                    step="10"
                    @input="updatePreview"
                  />
                  <BFormText class="small">QR code 尺寸</BFormText>
                </div>

                <div class="col-md-6">
                  <label class="form-label small">前景色（圖案顏色）</label>
                  <div class="d-flex">
                    <BFormInput
                      type="color"
                      v-model="qrConfig.darkColor"
                      class="form-control-color"
                      style="width: 50px; height: 38px"
                      @input="updatePreview"
                    />
                    <BFormInput
                      v-model="qrConfig.darkColor"
                      placeholder="#000000"
                      class="ms-2"
                      @input="updatePreview"
                    />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small">背景色</label>
                  <div class="d-flex">
                    <BFormInput
                      type="color"
                      v-model="qrConfig.lightColor"
                      class="form-control-color"
                      style="width: 50px; height: 38px"
                      @input="updatePreview"
                    />
                    <BFormInput
                      v-model="qrConfig.lightColor"
                      placeholder="#FFFFFF"
                      class="ms-2"
                      @input="updatePreview"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 桌號文字設定（僅在有背景圖片時顯示） -->
            <div class="mb-4" v-if="backgroundConfig.imageData">
              <label class="form-label fw-bold">
                <i class="bi bi-fonts me-1"></i>額外桌號文字設定
                <span class="badge bg-secondary ms-2">選填</span>
              </label>

              <div class="alert alert-info small mb-3">
                <i class="bi bi-info-circle me-1"></i>
                桌號已自動顯示在 QR Code 中心。此設定可在背景圖片其他位置添加額外的桌號文字。
              </div>

              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label small">X 座標 (px)</label>
                  <BFormInput
                    type="number"
                    v-model.number="tableNumberConfig.x"
                    min="0"
                    :max="backgroundConfig.canvasWidth"
                    @input="updatePreview"
                  />
                  <BFormText class="small">水平位置</BFormText>
                </div>

                <div class="col-md-4">
                  <label class="form-label small">Y 座標 (px)</label>
                  <BFormInput
                    type="number"
                    v-model.number="tableNumberConfig.y"
                    min="0"
                    :max="backgroundConfig.canvasHeight"
                    @input="updatePreview"
                  />
                  <BFormText class="small">垂直位置</BFormText>
                </div>

                <div class="col-md-4">
                  <label class="form-label small">字體大小 (px)</label>
                  <BFormInput
                    type="number"
                    v-model.number="tableNumberConfig.fontSize"
                    min="20"
                    max="200"
                    step="2"
                    @input="updatePreview"
                  />
                  <BFormText class="small">文字大小</BFormText>
                </div>

                <div class="col-md-12">
                  <label class="form-label small">文字顏色</label>
                  <div class="d-flex">
                    <BFormInput
                      type="color"
                      v-model="tableNumberConfig.color"
                      class="form-control-color"
                      style="width: 50px; height: 38px"
                      @input="updatePreview"
                    />
                    <BFormInput
                      v-model="tableNumberConfig.color"
                      placeholder="#000000"
                      class="ms-2"
                      @input="updatePreview"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- QR Code 連結預覽 -->
            <div class="mb-4" v-if="tableConfig.tableNumber">
              <div class="alert alert-light border">
                <div class="d-flex align-items-start">
                  <i class="bi bi-eye me-2 mt-1"></i>
                  <div class="flex-grow-1">
                    <strong class="d-block mb-1">預覽連結:</strong>
                    <code class="d-block text-break small bg-white p-2 rounded border">{{
                      previewUrl
                    }}</code>
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
                <p class="mt-2">請輸入桌號以生成 QR Code</p>
              </div>

              <div v-else class="text-center preview-container">
                <div class="preview-frame">
                  <canvas
                    ref="previewCanvas"
                    class="preview-canvas"
                    :width="previewSize.width"
                    :height="previewSize.height"
                  ></canvas>
                </div>

                <div class="mt-3">
                  <small class="text-muted">
                    <span v-if="backgroundConfig.imageData">
                      桌號: {{ tableConfig.tableNumber }} | 圖片尺寸:
                      {{ backgroundConfig.canvasWidth }} × {{ backgroundConfig.canvasHeight }} px
                    </span>
                    <span v-else>
                      桌號: {{ tableConfig.tableNumber }} | 純 QR Code 模式（桌號顯示在中心）
                    </span>
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
  BInputGroup,
  BFormFile,
  BFormInvalidFeedback,
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

// 背景圖片配置
const backgroundConfig = ref({
  imageData: null, // Base64 圖片數據
  originalWidth: 0, // 原始寬度（顯示用）
  originalHeight: 0, // 原始高度（顯示用）
  canvasWidth: 1181, // Canvas 寬度（10cm @ 300 DPI）
  canvasHeight: 1181, // Canvas 高度（10cm @ 300 DPI）
})

// QR Code 配置
const qrConfig = ref({
  x: 390, // X 座標（預設：左邊界 390px）
  y: 390, // Y 座標（預設：上邊界 390px）
  size: 400, // QR code 尺寸（預設 400px）
  darkColor: '#000000', // QR code 前景色（預設黑色）
  lightColor: '#FFFFFF', // QR code 背景色（預設白色）
})

// 桌號文字配置
const tableNumberConfig = ref({
  x: 590, // X 座標（預設：水平置中 590px）
  y: 850, // Y 座標（預設：QR code 下方 850px）
  fontSize: 48, // 字體大小（預設 48px）
  color: '#000000', // 文字顏色
})

// 錯誤狀態
const errors = ref({
  backgroundImage: '',
})

// 文件輸入 ref
const backgroundFileInput = ref(null)

// 桌牌配置（簡化版）
const tableConfig = ref({
  tableNumber: '',
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

// 預覽 URL
const previewUrl = computed(() => {
  if (!tableConfig.value.tableNumber) return ''

  const tableNumber = tableConfig.value.tableNumber
  // 直接連結模式
  return `${baseUrl.value}/stores/${props.brandId}/${props.storeId}?tableNumber=${tableNumber}`
})

const previewSize = computed(() => {
  // 預覽時縮放到合適的大小
  const scale = 0.25
  if (backgroundConfig.value.imageData) {
    // 有背景圖片：使用背景圖片尺寸
    return {
      width: backgroundConfig.value.canvasWidth * scale,
      height: backgroundConfig.value.canvasHeight * scale,
    }
  } else {
    // 沒有背景圖片：使用 QR Code 尺寸（不含桌號文字）
    const qrSize = qrConfig.value.size
    const padding = 40
    return {
      width: (qrSize + padding * 2) * scale,
      height: (qrSize + padding * 2) * scale,
    }
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
  // 直接連結模式
  const url = `${baseUrl.value}/stores/${props.brandId}/${props.storeId}?tableNumber=${tableNumber}`

  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: qrConfig.value.size,
      margin: 1,
      errorCorrectionLevel: 'H', // 提高容錯率為 High，允許中心顯示桌號
      color: {
        dark: qrConfig.value.darkColor, // QR code 前景色
        light: qrConfig.value.lightColor, // QR code 背景色
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('QR Code 生成失敗:', error)
    return null
  }
}

// 在 QR Code 中心繪製桌號的輔助函數
const drawTableNumberOnQR = (ctx, tableNumber, centerX, centerY, qrSize) => {
  // 根據 QR code 大小動態計算字體大小
  const fontSize = Math.max(qrSize * 0.12, 20) // 字體大小為 QR code 的 12%，最小 20px
  ctx.font = `bold ${fontSize}px Arial, "Microsoft JhengHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 測量文字寬度
  const textMetrics = ctx.measureText(tableNumber)
  const textWidth = textMetrics.width

  // 計算背景矩形尺寸（文字寬度 + 左右各 20% padding）
  const paddingX = textWidth * 0.4
  const paddingY = fontSize * 0.5
  const rectWidth = textWidth + paddingX
  const rectHeight = fontSize + paddingY

  // 繪製白色背景矩形（帶圓角）
  const cornerRadius = Math.min(rectWidth, rectHeight) * 0.2
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(
    centerX - rectWidth / 2,
    centerY - rectHeight / 2,
    rectWidth,
    rectHeight,
    cornerRadius,
  )
  ctx.fill()

  // 繪製黑色文字
  ctx.fillStyle = '#000000'
  ctx.fillText(tableNumber, centerX, centerY)
}

// 生成桌牌圖片
const generateTableCard = async (config) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 如果有背景圖片，使用背景圖片的尺寸；否則使用 QR Code 尺寸
  if (backgroundConfig.value.imageData) {
    // 有背景圖片：使用固定尺寸（1181×1181）
    canvas.width = backgroundConfig.value.canvasWidth
    canvas.height = backgroundConfig.value.canvasHeight

    // 1. 載入並繪製背景圖片
    const bgImage = new Image()
    await new Promise((resolve, reject) => {
      bgImage.onload = resolve
      bgImage.onerror = reject
      bgImage.src = backgroundConfig.value.imageData
    })

    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)

    // 2. 生成並繪製 QR Code
    const qrCodeDataURL = await generateQRCode(config.tableNumber)
    if (!qrCodeDataURL) {
      throw new Error('QR Code 生成失敗')
    }

    const qrImage = new Image()
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve
      qrImage.onerror = reject
      qrImage.src = qrCodeDataURL
    })

    ctx.drawImage(
      qrImage,
      qrConfig.value.x,
      qrConfig.value.y,
      qrConfig.value.size,
      qrConfig.value.size,
    )

    // 3. 在 QR Code 中心繪製桌號
    drawTableNumberOnQR(
      ctx,
      config.tableNumber,
      qrConfig.value.x + qrConfig.value.size / 2,
      qrConfig.value.y + qrConfig.value.size / 2,
      qrConfig.value.size,
    )

    // 4. 繪製額外的桌號文字（可選，顯示在背景圖片其他位置）
    ctx.font = `bold ${tableNumberConfig.value.fontSize}px Arial, "Microsoft JhengHei", sans-serif`
    ctx.fillStyle = tableNumberConfig.value.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(config.tableNumber, tableNumberConfig.value.x, tableNumberConfig.value.y)
  } else {
    // 沒有背景圖片：只生成純 QR Code（桌號顯示在中心）
    const qrSize = qrConfig.value.size
    const padding = 40 // 邊距

    canvas.width = qrSize + padding * 2
    canvas.height = qrSize + padding * 2

    // 填充白色背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 生成並繪製 QR Code（置中）
    const qrCodeDataURL = await generateQRCode(config.tableNumber)
    if (!qrCodeDataURL) {
      throw new Error('QR Code 生成失敗')
    }

    const qrImage = new Image()
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve
      qrImage.onerror = reject
      qrImage.src = qrCodeDataURL
    })

    ctx.drawImage(qrImage, padding, padding, qrSize, qrSize)

    // 在 QR Code 中心繪製桌號
    drawTableNumberOnQR(
      ctx,
      config.tableNumber,
      padding + qrSize / 2,
      padding + qrSize / 2,
      qrSize,
    )
  }

  return canvas.toDataURL('image/png')
}

// 更新預覽
const updatePreview = async () => {
  if (!tableConfig.value.tableNumber || !previewCanvas.value) {
    return
  }

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')

  // 清空畫布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  try {
    if (backgroundConfig.value.imageData) {
      // 有背景圖片：正常預覽
      const scale = 0.25 // 縮放比例

      // 1. 載入並繪製背景圖片
      const bgImage = new Image()
      await new Promise((resolve, reject) => {
        bgImage.onload = resolve
        bgImage.onerror = reject
        bgImage.src = backgroundConfig.value.imageData
      })

      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)

      // 2. 生成並繪製 QR Code
      const qrCodeDataURL = await generateQRCode(tableConfig.value.tableNumber)
      if (!qrCodeDataURL) return

      const qrImage = new Image()
      await new Promise((resolve) => {
        qrImage.onload = resolve
        qrImage.src = qrCodeDataURL
      })

      ctx.drawImage(
        qrImage,
        qrConfig.value.x * scale,
        qrConfig.value.y * scale,
        qrConfig.value.size * scale,
        qrConfig.value.size * scale,
      )

      // 3. 在 QR Code 中心繪製桌號
      drawTableNumberOnQR(
        ctx,
        tableConfig.value.tableNumber,
        (qrConfig.value.x + qrConfig.value.size / 2) * scale,
        (qrConfig.value.y + qrConfig.value.size / 2) * scale,
        qrConfig.value.size * scale,
      )

      // 4. 繪製額外的桌號文字（可選，顯示在背景圖片其他位置）
      ctx.font = `bold ${tableNumberConfig.value.fontSize * scale}px Arial, "Microsoft JhengHei", sans-serif`
      ctx.fillStyle = tableNumberConfig.value.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        tableConfig.value.tableNumber,
        tableNumberConfig.value.x * scale,
        tableNumberConfig.value.y * scale,
      )
    } else {
      // 沒有背景圖片：預覽純 QR Code（桌號顯示在中心）
      const qrSize = qrConfig.value.size
      const padding = 40
      const scale = 0.25

      // 動態調整 canvas 尺寸
      canvas.width = (qrSize + padding * 2) * scale
      canvas.height = (qrSize + padding * 2) * scale

      // 填充白色背景
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 生成並繪製 QR Code
      const qrCodeDataURL = await generateQRCode(tableConfig.value.tableNumber)
      if (!qrCodeDataURL) return

      const qrImage = new Image()
      await new Promise((resolve) => {
        qrImage.onload = resolve
        qrImage.src = qrCodeDataURL
      })

      ctx.drawImage(qrImage, padding * scale, padding * scale, qrSize * scale, qrSize * scale)

      // 在 QR Code 中心繪製桌號
      drawTableNumberOnQR(
        ctx,
        tableConfig.value.tableNumber,
        (padding + qrSize / 2) * scale,
        (padding + qrSize / 2) * scale,
        qrSize * scale,
      )
    }
  } catch (error) {
    console.error('預覽更新失敗:', error)
  }
}

// 處理背景圖片上傳
const handleBackgroundImageChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 驗證檔案類型
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
    errors.value.backgroundImage = '請上傳 PNG 或 JPG 格式的圖片'
    return
  }

  // 驗證檔案大小（限制 5MB）
  if (file.size > 5 * 1024 * 1024) {
    errors.value.backgroundImage = '圖片大小不能超過 5MB'
    return
  }

  errors.value.backgroundImage = ''

  try {
    // 使用 FileReader 轉換為 Base64
    const reader = new FileReader()
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // 載入圖片以獲取尺寸資訊
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = base64
    })

    // 儲存圖片數據和尺寸資訊
    backgroundConfig.value.imageData = base64
    backgroundConfig.value.originalWidth = img.width
    backgroundConfig.value.originalHeight = img.height

    // 觸發預覽更新
    nextTick(() => updatePreview())
  } catch (error) {
    console.error('圖片處理失敗:', error)
    errors.value.backgroundImage = '圖片處理失敗，請重試'
  }
}

// 清除背景圖片
const clearBackgroundImage = () => {
  backgroundConfig.value.imageData = null
  backgroundConfig.value.originalWidth = 0
  backgroundConfig.value.originalHeight = 0

  if (backgroundFileInput.value) {
    backgroundFileInput.value.value = ''
  }

  errors.value.backgroundImage = ''

  // 清空預覽
  if (previewCanvas.value) {
    const ctx = previewCanvas.value.getContext('2d')
    ctx.clearRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
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
      link.download = `桌牌_${tableConfig.value.tableNumber}.png`
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
        zip.file(`桌牌_${tableNumber}.png`, base64Data, { base64: true })
      }

      // 可以在這裡加入進度顯示
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const fileName = `店鋪桌牌_${new Date().toISOString().split('T')[0]}.zip`
    saveAs(content, fileName)
  } catch (error) {
    console.error('批量下載失敗:', error)
    alert('批量下載失敗，請稍後再試')
  } finally {
    isGenerating.value = false
  }
}

// 重置 Modal 狀態
const resetModal = () => {
  // 重置桌牌配置
  tableConfig.value = {
    tableNumber: '',
  }

  // 重置背景圖片配置
  backgroundConfig.value = {
    imageData: null,
    originalWidth: 0,
    originalHeight: 0,
    canvasWidth: 1181,
    canvasHeight: 1181,
  }

  // 重置 QR Code 配置
  qrConfig.value = {
    x: 390,
    y: 390,
    size: 400,
    darkColor: '#000000',
    lightColor: '#FFFFFF',
  }

  // 重置桌號文字配置
  tableNumberConfig.value = {
    x: 590,
    y: 850,
    fontSize: 48,
    color: '#000000',
  }

  // 重置批量配置
  showBatchOptions.value = false
  batchConfig.value = {
    mode: 'range',
    startNumber: 1,
    endNumber: 10,
    customNumbers: '',
  }

  // 重置錯誤
  errors.value = {
    backgroundImage: '',
  }

  // 重置狀態
  isGenerating.value = false

  // 清空預覽畫布
  if (previewCanvas.value) {
    const ctx = previewCanvas.value.getContext('2d')
    ctx.clearRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
  }
}

// Modal 顯示時的處理
const handleModalShow = () => {
  // Modal 被打開時的處理
}

// Modal 完全隱藏後的處理
const handleModalHidden = () => {
  // Modal 完全關閉後重置所有狀態
  resetModal()
}

// 關閉模態窗
const closeModal = () => {
  showModal.value = false
  // 重置邏輯由 handleModalHidden 處理
}

// 監聽變化
watch(
  () => tableConfig.value.tableNumber,
  () => {
    nextTick(() => updatePreview())
  },
  { immediate: true },
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

.form-control-color {
  padding: 0.2rem;
  border-radius: 0.375rem;
}

.btn-check:checked + .btn-outline-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-check:checked + .btn-outline-info {
  background-color: #0dcaf0;
  border-color: #0dcaf0;
  color: #000;
}

.btn-check:checked + .btn-outline-success {
  background-color: #198754;
  border-color: #198754;
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
