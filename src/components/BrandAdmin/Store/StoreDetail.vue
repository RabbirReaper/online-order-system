<template>
  <div>
    <!-- 載入中提示 -->
    <div class="d-flex justify-content-center my-5" v-if="isLoading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加載中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div class="alert alert-danger" v-if="error">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-if="store && !isLoading">
      <!-- 頁面頂部工具列 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">
          {{ store.name }}
          <span
            class="badge rounded-pill ms-2"
            :class="store.isActive ? 'bg-success' : 'bg-secondary'"
          >
            {{ store.isActive ? '啟用中' : '已停用' }}
          </span>
        </h4>
        <div class="d-flex">
          <router-link
            :to="`/admin/${brandId}/stores/edit/${store._id}`"
            class="btn btn-primary me-2"
          >
            <i class="bi bi-pencil me-1"></i>編輯店鋪
          </router-link>
          <router-link :to="`/admin/${brandId}/stores`" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i>返回列表
          </router-link>
        </div>
      </div>

      <!-- 店鋪詳情卡片 -->
      <div class="row">
        <!-- 左側基本資訊 -->
        <div class="col-md-5 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title mb-3">基本資訊</h5>

              <div class="mb-3">
                <div class="rounded overflow-hidden" style="max-height: 300px">
                  <img
                    :src="store.image?.url || '/placeholder.jpg'"
                    class="img-fluid w-100 object-fit-cover"
                    :alt="store.name"
                  />
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">店鋪名稱</h6>
                <p>{{ store.name }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">店鋪地址</h6>
                <p>{{ store.address || '未設定地址' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">店鋪電話</h6>
                <p>{{ store.phone || '未設定電話' }}</p>
              </div>

              <div class="mb-3">
                <h6 class="text-muted mb-1">創建時間</h6>
                <p>{{ formatDate(store.createdAt) }}</p>
              </div>

              <div class="mb-0">
                <h6 class="text-muted mb-1">最後更新</h6>
                <p>{{ formatDate(store.updatedAt) }}</p>
              </div>

              <!-- 新增：前端連結區塊 -->
              <div class="mt-4 pt-3 border-top">
                <h6 class="text-muted mb-3">前端連結</h6>

                <!-- 菜單連結 -->
                <div class="mb-3">
                  <label class="form-label small fw-bold">顧客菜單頁面</label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      :value="menuUrl"
                      readonly
                    />
                    <button
                      class="btn btn-sm"
                      :class="copyStates.menu ? 'btn-success' : 'btn-outline-secondary'"
                      type="button"
                      @click="copyToClipboard(menuUrl, 'menu')"
                      :title="copyStates.menu ? '已複製' : '複製連結'"
                    >
                      <i class="bi" :class="copyStates.menu ? 'bi-check' : 'bi-copy'"></i>
                    </button>
                    <a
                      :href="menuUrl"
                      target="_blank"
                      class="btn btn-outline-primary btn-sm"
                      title="開啟連結"
                    >
                      <i class="bi bi-box-arrow-up-right"></i>
                    </a>
                  </div>
                </div>

                <!-- 櫃檯連結 -->
                <div class="mb-3">
                  <label class="form-label small fw-bold">櫃檯點餐系統</label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      :value="counterUrl"
                      readonly
                    />
                    <button
                      class="btn btn-sm"
                      :class="copyStates.counter ? 'btn-success' : 'btn-outline-secondary'"
                      type="button"
                      @click="copyToClipboard(counterUrl, 'counter')"
                      :title="copyStates.counter ? '已複製' : '複製連結'"
                    >
                      <i class="bi" :class="copyStates.counter ? 'bi-check' : 'bi-copy'"></i>
                    </button>
                    <a
                      :href="counterUrl"
                      target="_blank"
                      class="btn btn-outline-primary btn-sm"
                      title="開啟連結"
                    >
                      <i class="bi bi-box-arrow-up-right"></i>
                    </a>
                  </div>
                </div>
                <!-- LINE LIFF 連結 -->
                <div class="mb-0" v-if="store.enableLineOrdering && liffUrl">
                  <label class="form-label small fw-bold">
                    <i class="bi bi-line me-1" style="color: #00c300"></i>
                    LINE 點餐連結
                  </label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      :value="liffUrl"
                      readonly
                    />
                    <button
                      class="btn btn-sm"
                      :class="copyStates.liff ? 'btn-success' : 'btn-outline-secondary'"
                      type="button"
                      @click="copyToClipboard(liffUrl, 'liff')"
                      :title="copyStates.liff ? '已複製' : '複製連結'"
                    >
                      <i class="bi" :class="copyStates.liff ? 'bi-check' : 'bi-copy'"></i>
                    </button>
                    <a
                      :href="liffUrl"
                      target="_blank"
                      class="btn btn-outline-success btn-sm"
                      title="開啟 LINE"
                    >
                      <i class="bi bi-line"></i>
                    </a>
                  </div>
                  <div class="form-text text-muted small mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    此連結需要在 LINE 應用程式中開啟才能正常運作
                  </div>
                </div>
                <!-- LINE LIFF END POINT 連結 -->
                <div class="mb-0" v-if="store.enableLineOrdering && liffUrl">
                  <label class="form-label small fw-bold">
                    <i class="bi bi-line me-1" style="color: #00c300"></i>
                    LINE LIFF END POINT 連結
                  </label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      :value="liffEndPointUrl"
                      readonly
                    />
                    <button
                      class="btn btn-sm"
                      :class="copyStates.liffEndPointUrl ? 'btn-success' : 'btn-outline-secondary'"
                      type="button"
                      @click="copyToClipboard(liffEndPointUrl, 'liffEndPointUrl')"
                      :title="copyStates.liffEndPointUrl ? '已複製' : '複製連結'"
                    >
                      <i
                        class="bi"
                        :class="copyStates.liffEndPointUrl ? 'bi-check' : 'bi-copy'"
                      ></i>
                    </button>
                    <a
                      :href="liffEndPointUrl"
                      target="_blank"
                      class="btn btn-outline-success btn-sm"
                      title="開啟連結"
                    >
                      <i class="bi bi-line"></i>
                    </a>
                  </div>
                  <div class="form-text text-muted small mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    此連結需要設置在Liff End Point 的地方 - 用來跳轉至點餐系統
                  </div>
                </div>
                <!-- LINE Bot ID 顯示 -->
                <div class="mb-0" v-if="store.enableLineOrdering">
                  <label class="form-label small fw-bold">
                    <i class="bi bi-robot me-1" style="color: #00c300"></i>
                    LINE 官方帳號 ID
                  </label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      :value="store.lineBotId || '(使用系統預設)'"
                      readonly
                      :class="!store.lineBotId ? 'text-muted fst-italic' : ''"
                    />
                    <button
                      v-if="store.lineBotId"
                      class="btn btn-sm"
                      :class="copyStates.botId ? 'btn-success' : 'btn-outline-secondary'"
                      type="button"
                      @click="copyToClipboard(store.lineBotId, 'botId')"
                      :title="copyStates.botId ? '已複製' : '複製 Bot ID'"
                    >
                      <i class="bi" :class="copyStates.botId ? 'bi-check' : 'bi-copy'"></i>
                    </button>
                    <a
                      v-if="store.lineBotId"
                      :href="`https://line.me/R/ti/p/@${store.lineBotId}`"
                      target="_blank"
                      class="btn btn-outline-success btn-sm"
                      title="開啟加好友頁面"
                    >
                      <i class="bi bi-person-plus"></i>
                    </a>
                  </div>
                  <div class="form-text text-muted small mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    客戶在需要加好友時會被導向此 LINE 官方帳號
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <button
                  class="btn btn-sm"
                  :class="store.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                  @click="toggleStoreActive"
                >
                  <i
                    class="bi"
                    :class="store.isActive ? 'bi-pause-fill me-1' : 'bi-play-fill me-1'"
                  ></i>
                  {{ store.isActive ? '停用店鋪' : '啟用店鋪' }}
                </button>

                <!-- 刪除按鈕 -->
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @click="showDeleteModal = true"
                >
                  <i class="bi bi-trash me-1"></i>刪除店鋪
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側詳細資訊 -->
        <div class="col-md-7">
          <!-- 服務設定卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">服務設定</h5>

              <div class="row g-3">
                <!-- 服務類型 -->
                <div class="col-md-12">
                  <h6 class="text-muted mb-2">服務類型</h6>
                  <div class="d-flex flex-wrap gap-3">
                    <span class="badge" :class="store.enableDineIn ? 'bg-success' : 'bg-secondary'">
                      <i
                        class="bi"
                        :class="
                          store.enableDineIn ? 'bi-check-circle-fill me-1' : 'bi-x-circle-fill me-1'
                        "
                      ></i>
                      內用
                    </span>
                    <span
                      class="badge"
                      :class="store.enableTakeOut ? 'bg-success' : 'bg-secondary'"
                    >
                      <i
                        class="bi"
                        :class="
                          store.enableTakeOut
                            ? 'bi-check-circle-fill me-1'
                            : 'bi-x-circle-fill me-1'
                        "
                      ></i>
                      外帶
                    </span>
                    <span
                      class="badge"
                      :class="store.enableDelivery ? 'bg-success' : 'bg-secondary'"
                    >
                      <i
                        class="bi"
                        :class="
                          store.enableDelivery
                            ? 'bi-check-circle-fill me-1'
                            : 'bi-x-circle-fill me-1'
                        "
                      ></i>
                      外送
                    </span>
                  </div>
                </div>

                <!-- 準備時間 -->
                <div class="col-md-12">
                  <h6 class="text-muted mb-2">準備時間設定</h6>
                  <div class="row g-2">
                    <div class="col-md-4" v-if="store.enableDineIn">
                      <div class="p-2 border rounded">
                        <div class="small text-muted">內用準備時間</div>
                        <div class="fw-bold">{{ store.dineInPrepTime || 0 }} 分鐘</div>
                      </div>
                    </div>
                    <div class="col-md-4" v-if="store.enableTakeOut">
                      <div class="p-2 border rounded">
                        <div class="small text-muted">外帶準備時間</div>
                        <div class="fw-bold">{{ store.takeOutPrepTime || 0 }} 分鐘</div>
                      </div>
                    </div>
                    <div class="col-md-4" v-if="store.enableDelivery">
                      <div class="p-2 border rounded">
                        <div class="small text-muted">外送準備時間</div>
                        <div class="fw-bold">{{ store.deliveryPrepTime || 0 }} 分鐘</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 外送設定 -->
                <div class="col-md-12" v-if="store.enableDelivery">
                  <h6 class="text-muted mb-2">外送設定</h6>
                  <div class="row g-2">
                    <div class="col-md-4">
                      <div class="p-2 border rounded">
                        <div class="small text-muted">最低外送金額</div>
                        <div class="fw-bold">${{ store.minDeliveryAmount || 0 }}</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-2 border rounded">
                        <div class="small text-muted">最少外送數量</div>
                        <div class="fw-bold">{{ store.minDeliveryQuantity || 1 }} 項</div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-2 border rounded">
                        <div class="small text-muted">最長外送距離</div>
                        <div class="fw-bold">{{ store.maxDeliveryDistance || 5 }} 公里</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 預訂設定 -->
                <div class="col-md-12">
                  <h6 class="text-muted mb-2">預訂設定</h6>
                  <div class="p-2 border rounded">
                    <div class="small text-muted">可預訂天數</div>
                    <div class="fw-bold">{{ formatAdvanceOrderDays(store.advanceOrderDays) }}</div>
                  </div>
                </div>

                <!-- 其他功能設定 -->
                <div class="col-md-12">
                  <h6 class="text-muted mb-2">其他功能設定</h6>
                  <div class="d-flex flex-wrap gap-3 mb-0">
                    <span
                      class="badge"
                      :class="store.enableLineOrdering ? 'bg-success' : 'bg-secondary'"
                    >
                      <i
                        class="bi"
                        :class="
                          store.enableLineOrdering
                            ? 'bi-check-circle-fill me-1'
                            : 'bi-x-circle-fill me-1'
                        "
                      ></i>
                      LINE點餐
                    </span>
                    <span class="badge" :class="store.showTaxId ? 'bg-success' : 'bg-secondary'">
                      <i
                        class="bi"
                        :class="
                          store.showTaxId ? 'bi-check-circle-fill me-1' : 'bi-x-circle-fill me-1'
                        "
                      ></i>
                      顯示統一編號欄位
                    </span>
                    <span
                      class="badge"
                      :class="store.provideReceipt ? 'bg-success' : 'bg-secondary'"
                    >
                      <i
                        class="bi"
                        :class="
                          store.provideReceipt
                            ? 'bi-check-circle-fill me-1'
                            : 'bi-x-circle-fill me-1'
                        "
                      ></i>
                      提供收據
                    </span>
                  </div>
                </div>

                <!-- 付款方式設定 -->
                <div class="col-md-12">
                  <h6 class="text-muted mb-2">付款方式設定</h6>
                  <div class="row g-2">
                    <!-- 現場支援付款方式 -->
                    <div class="col-md-6">
                      <div class="p-2 border rounded">
                        <div class="small text-muted mb-2">現場支援付款方式</div>
                        <div class="d-flex flex-wrap gap-2">
                          <span
                            v-if="store.counterPayments && store.counterPayments.includes('cash')"
                            class="badge bg-success"
                          >
                            <i class="bi bi-cash me-1"></i>現金
                          </span>
                          <span
                            v-if="
                              store.counterPayments && store.counterPayments.includes('line_pay')
                            "
                            class="badge bg-success"
                          >
                            <i class="bi bi-line me-1"></i>LINE Pay
                          </span>
                          <span
                            v-if="
                              store.counterPayments && store.counterPayments.includes('credit_card')
                            "
                            class="badge bg-success"
                          >
                            <i class="bi bi-credit-card me-1"></i>信用卡
                          </span>
                          <span
                            v-if="!store.counterPayments || store.counterPayments.length === 0"
                            class="text-muted small"
                          >
                            未設定
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- 客戶端支援付款方式 -->
                    <div class="col-md-6">
                      <div class="p-2 border rounded">
                        <div class="small text-muted mb-2">客戶端支援付款方式</div>
                        <div class="d-flex flex-wrap gap-2">
                          <span
                            v-if="
                              store.customerPayments && store.customerPayments.includes('line_pay')
                            "
                            class="badge bg-success"
                          >
                            <i class="bi bi-line me-1"></i>LINE Pay
                          </span>
                          <span
                            v-if="
                              store.customerPayments &&
                              store.customerPayments.includes('credit_card')
                            "
                            class="badge bg-success"
                          >
                            <i class="bi bi-credit-card me-1"></i>信用卡
                          </span>
                          <span
                            v-if="!store.customerPayments || store.customerPayments.length === 0"
                            class="text-muted small"
                          >
                            無
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 外送平台整合卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>外送平台整合</span>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="showDeliveryPlatformsModal = true"
                >
                  <i class="bi bi-pencil me-1"></i>快速編輯
                </button>
              </h5>

              <div v-if="store.deliveryPlatforms && store.deliveryPlatforms.length > 0">
                <div class="d-flex flex-wrap gap-3">
                  <button
                    v-for="(platform, index) in store.deliveryPlatforms"
                    :key="index"
                    class="btn btn-outline-primary btn-lg"
                    @click="openPlatformConfig(platform)"
                  >
                    <i class="bi bi-truck me-2"></i>
                    {{ getPlatformDisplayName(platform) }}
                  </button>
                </div>
              </div>

              <div v-else class="alert alert-light text-center py-3">
                <div class="text-muted mb-2">
                  <i class="bi bi-truck me-1"></i>
                  尚未設置外送平台整合
                </div>
                <div class="small text-muted mb-3">
                  整合外送平台後，系統可自動接收來自 foodpanda、Uber Eats 等平台的訂單
                </div>
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="showPlatformManagerModal = true"
                >
                  <i class="bi bi-gear me-1"></i>設置平台整合
                </button>
              </div>
            </div>
          </div>

          <!-- 營業時間卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>營業時間</span>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="showBusinessHoursModal = true"
                >
                  <i class="bi bi-pencil me-1"></i>快速編輯
                </button>
              </h5>

              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>星期</th>
                      <th>營業時間</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="day in sortedBusinessHours" :key="day.day">
                      <td>{{ getDayName(day.day) }}</td>
                      <td>
                        <span v-if="!day.isClosed">
                          <template v-for="(period, index) in day.periods" :key="index">
                            {{ period.open }} - {{ period.close }}
                            <br v-if="index < day.periods.length - 1" />
                          </template>
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>
                        <span class="badge" :class="day.isClosed ? 'bg-secondary' : 'bg-success'">
                          {{ day.isClosed ? '公休' : '營業' }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!store.businessHours || store.businessHours.length === 0">
                      <td colspan="3" class="text-center py-3">尚未設置營業時間</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 店鋪公告卡片 -->
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center mb-3">
                <span>店鋪公告</span>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="showAnnouncementsModal = true"
                >
                  <i class="bi bi-pencil me-1"></i>快速編輯
                </button>
              </h5>

              <div v-if="store.announcements && store.announcements.length > 0">
                <div
                  v-for="(announcement, index) in store.announcements"
                  :key="index"
                  class="announcement-item mb-3 p-3 border rounded"
                >
                  <h6 class="announcement-title mb-2">{{ announcement.title }}</h6>
                  <p class="announcement-content mb-0">{{ announcement.content }}</p>
                </div>
              </div>

              <div v-else class="alert alert-light text-center py-3">
                <div class="text-muted">尚未設置店鋪公告</div>
              </div>
            </div>
          </div>

          <!-- 更多功能卡片 -->
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-3">快速操作</h5>

              <div class="row g-3">
                <div class="col-md-3">
                  <div
                    class="card action-card h-100"
                    style="cursor: pointer"
                    @click="store && (showTableCardModal = true)"
                  >
                    <div
                      class="card-body d-flex flex-column align-items-center justify-content-center p-3"
                    >
                      <i class="bi bi-qr-code action-icon mb-2"></i>
                      <h6 class="mb-1">生成桌牌</h6>
                      <p class="small text-muted text-center mb-0">
                        生成 QR Code 桌牌供顧客掃描點餐
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <BModal v-model="showDeleteModal" title="確認刪除" centered>
      <div v-if="store">
        <p>
          您確定要刪除店鋪 <strong>{{ store.name }}</strong> 嗎？
        </p>
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          此操作無法撤銷，店鋪相關的所有資料都將被永久刪除。
        </div>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showDeleteModal = false">取消</BButton>
        <BButton variant="danger" @click="handleDelete" :disabled="isDeleting">
          <span
            v-if="isDeleting"
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isDeleting ? '處理中...' : '確認刪除' }}
        </BButton>
      </template>
    </BModal>

    <!-- 營業時間快速編輯對話框 -->
    <BModal v-model="showBusinessHoursModal" title="編輯營業時間" size="lg" centered>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>星期</th>
              <th>營業時段</th>
              <th width="100px">公休日</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in editBusinessHours" :key="day.day">
              <td>{{ getDayName(day.day) }}</td>
              <td>
                <div v-if="!day.isClosed">
                  <div v-for="(period, pIndex) in day.periods" :key="pIndex" class="mb-2">
                    <div class="d-flex align-items-center">
                      <div class="time-input-group">
                        <input
                          type="time"
                          class="form-control form-control-sm"
                          v-model="day.periods[pIndex].open"
                        />
                      </div>
                      <span class="mx-2">至</span>
                      <div class="time-input-group">
                        <input
                          type="time"
                          class="form-control form-control-sm"
                          v-model="day.periods[pIndex].close"
                        />
                      </div>

                      <!-- 刪除時段按鈕 -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger ms-2"
                        @click="removePeriod(day, pIndex)"
                        v-if="day.periods.length > 1"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <!-- 新增時段按鈕 -->
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary mt-1"
                    @click="addPeriod(day)"
                  >
                    <i class="bi bi-plus-circle me-1"></i>新增時段
                  </button>
                </div>
                <div v-else class="text-muted">公休日</div>
              </td>
              <td>
                <BFormCheckbox v-model="day.isClosed" switch> </BFormCheckbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showBusinessHoursModal = false">取消</BButton>
        <BButton variant="primary" @click="updateBusinessHours" :disabled="isUpdatingHours">
          <span
            v-if="isUpdatingHours"
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isUpdatingHours ? '更新中...' : '保存變更' }}
        </BButton>
      </template>
    </BModal>

    <!-- 公告快速編輯對話框 -->
    <BModal v-model="showAnnouncementsModal" title="編輯店鋪公告" size="lg" centered>
      <div v-if="editAnnouncements.length > 0">
        <div v-for="(announcement, index) in editAnnouncements" :key="index" class="card mb-3">
          <div class="card-body">
            <div class="mb-3">
              <label :for="`modal-announcement-title-${index}`" class="form-label required"
                >公告標題</label
              >
              <BFormInput :id="`modal-announcement-title-${index}`" v-model="announcement.title" />
            </div>

            <div class="mb-3">
              <label :for="`modal-announcement-content-${index}`" class="form-label required"
                >公告內容</label
              >
              <BFormTextarea
                :id="`modal-announcement-content-${index}`"
                v-model="announcement.content"
                rows="3"
              />
            </div>

            <div class="text-end">
              <BButton size="sm" variant="outline-danger" @click="removeModalAnnouncement(index)">
                <i class="bi bi-trash me-1"></i>刪除公告
              </BButton>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-3">
        <BButton variant="outline-primary" @click="addModalAnnouncement">
          <i class="bi bi-plus-circle me-1"></i>新增公告
        </BButton>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showAnnouncementsModal = false">取消</BButton>
        <BButton variant="primary" @click="updateAnnouncements" :disabled="isUpdatingAnnouncements">
          <span
            v-if="isUpdatingAnnouncements"
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isUpdatingAnnouncements ? '更新中...' : '保存變更' }}
        </BButton>
      </template>
    </BModal>

    <!-- 外送平台整合快速編輯對話框 -->
    <BModal v-model="showDeliveryPlatformsModal" title="編輯外送平台整合" size="lg" centered>
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">外送平台設定</h6>
          <BButton size="sm" variant="outline-primary" @click="addModalDeliveryPlatform">
            <i class="bi bi-plus-circle me-1"></i>新增平台
          </BButton>
        </div>

        <div v-if="editDeliveryPlatforms.length > 0">
          <div v-for="(platform, index) in editDeliveryPlatforms" :key="index" class="card mb-3">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-12">
                  <label :for="`modal-platform-type-${index}`" class="form-label required"
                    >外送平台</label
                  >
                  <BFormSelect
                    :id="`modal-platform-type-${index}`"
                    v-model="editDeliveryPlatforms[index]"
                    :options="platformOptions"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="alert alert-light text-center py-3" v-else>
          <div class="text-muted mb-2">
            <i class="bi bi-truck me-1"></i>
            尚未設置外送平台整合
          </div>
          <BButton size="sm" variant="primary" @click="addModalDeliveryPlatform">
            <i class="bi bi-plus-circle me-1"></i>新增平台整合
          </BButton>
        </div>
      </div>

      <template #footer>
        <BButton variant="secondary" @click="showDeliveryPlatformsModal = false">取消</BButton>
        <BButton
          variant="primary"
          @click="updateDeliveryPlatforms"
          :disabled="isUpdatingDeliveryPlatforms"
        >
          <span
            v-if="isUpdatingDeliveryPlatforms"
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isUpdatingDeliveryPlatforms ? '更新中...' : '保存變更' }}
        </BButton>
      </template>
    </BModal>


    <!-- QR Code 桌牌生成器 -->
    <QRTableCardGenerator
      v-if="store"
      v-model:show="showTableCardModal"
      :brandId="brandId"
      :storeId="storeId"
      :store="store"
    />

    <!-- 平台店鋪配置管理器 -->
    <PlatformStoreManager
      v-if="store"
      v-model:show="showPlatformManagerModal"
      :brandId="brandId"
      :storeId="storeId"
      :store="store"
      :platform="selectedPlatform"
      @updated="fetchStoreData"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  BModal,
  BButton,
  BFormCheckbox,
  BFormInput,
  BFormTextarea,
  BFormSelect,
} from 'bootstrap-vue-next'
import api from '@/api'
import QRTableCardGenerator from './QRTableCardGenerator.vue'
import PlatformStoreManager from './PlatformStoreManager.vue'

// 路由
const router = useRouter()
const route = useRoute()

const baseUrl = computed(() => window.location.origin)
const menuUrl = computed(() => `${baseUrl.value}/stores/${brandId.value}/${storeId.value}`)
const counterUrl = computed(() => `${baseUrl.value}/counter/${brandId.value}/${storeId.value}`)
const liffUrl = computed(() => {
  const liffId = store.value?.liffId
  if (!liffId) return null
  return `https://liff.line.me/${liffId}`
})
const liffEndPointUrl = computed(() => {
  const liffId = store.value?.liffId
  if (!liffId) return null
  // https://rabbirorder.com/line-entry?liffId=2008192565-m1q4KMrW&brandId=6829fddd1dcdb196fa13f479&storeId=682a00b3467760e4ad7469c7
  return `${baseUrl.value}/line-entry?liffId=${liffId}&brandId=${brandId.value}&storeId=${storeId.value}}`
})

// 從路由中獲取品牌ID和店鋪ID
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.id)

// 狀態
const store = ref(null)
const isLoading = ref(true)
const error = ref('')
const isDeleting = ref(false)
const isUpdatingHours = ref(false)
const isUpdatingAnnouncements = ref(false)
const isUpdatingDeliveryPlatforms = ref(false)

// Modal 顯示狀態
const showDeleteModal = ref(false)
const showBusinessHoursModal = ref(false)
const showAnnouncementsModal = ref(false)
const showDeliveryPlatformsModal = ref(false)
const showTableCardModal = ref(false)
const showPlatformManagerModal = ref(false)
const selectedPlatform = ref('')

// 編輯用的數據
const editBusinessHours = ref([])
const editAnnouncements = ref([])
const editDeliveryPlatforms = ref([])

// 複製狀態管理
const copyStates = ref({
  menu: false,
  counter: false,
  liff: false,
  botId: false,
  liffEndPointUrl: false,
})

// 複製連結到剪貼簿
const copyToClipboard = (text, type) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // 設置對應的複製狀態為 true
      copyStates.value[type] = true

      // 2秒後恢復原始狀態
      setTimeout(() => {
        copyStates.value[type] = false
      }, 2000)
    })
    .catch((err) => {
      console.error('複製失敗:', err)
    })
}

// 星期幾名稱
const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

// 外送平台選項
const platformOptions = [
  { value: '', text: '請選擇外送平台', disabled: true },
  { value: 'foodpanda', text: 'foodpanda' },
  { value: 'ubereats', text: 'Uber Eats' },
]

// 取得星期幾名稱
const getDayName = (day) => {
  return dayNames[day] || `未知 (${day})`
}

// 取得平台顯示名稱
const getPlatformDisplayName = (platform) => {
  const platformMap = {
    foodpanda: 'foodpanda',
    ubereats: 'Uber Eats',
  }
  return platformMap[platform] || platform
}

// 開啟特定平台配置
const openPlatformConfig = (platform) => {
  selectedPlatform.value = platform
  showPlatformManagerModal.value = true
}

// 按照星期順序排序的營業時間
const sortedBusinessHours = computed(() => {
  if (!store.value || !store.value.businessHours) return []
  return [...store.value.businessHours].sort((a, b) => a.day - b.day)
})

// 格式化預訂天數顯示
const formatAdvanceOrderDays = (days) => {
  if (days === 0) return '只能立即點餐'
  if (days === 1) return '可預訂當天'
  return `可預訂 ${days} 天`
}

// 獲取店鋪資料
const fetchStoreData = async () => {
  if (!storeId.value) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value })

    if (response && response.store) {
      store.value = response.store

      // 複製數據以供編輯
      initEditData()
    } else {
      error.value = '獲取店鋪資料失敗'
    }
  } catch (err) {
    console.error('獲取店鋪資料時發生錯誤:', err)
    error.value = '獲取店鋪資料時發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 新增模態窗中的外送平台
const addModalDeliveryPlatform = () => {
  editDeliveryPlatforms.value.push('')
}

// 更新外送平台設定
const updateDeliveryPlatforms = async () => {
  if (!store.value) return

  // 驗證表單
  let isValid = true
  for (const platform of editDeliveryPlatforms.value) {
    if (!platform.trim()) {
      isValid = false
      break
    }
  }

  if (!isValid) {
    alert('外送平台不能為空')
    return
  }

  // 檢查是否有重複的平台
  const uniquePlatforms = new Set(editDeliveryPlatforms.value)
  if (editDeliveryPlatforms.value.length !== uniquePlatforms.size) {
    alert('不能重複新增相同的外送平台')
    return
  }

  isUpdatingDeliveryPlatforms.value = true

  try {
    const response = await api.store.updateStore({
      brandId: brandId.value,
      id: store.value._id,
      data: { deliveryPlatforms: editDeliveryPlatforms.value },
    })

    if (response && response.store) {
      // 更新數據
      store.value.deliveryPlatforms = response.store.deliveryPlatforms

      // 關閉模態窗口
      showDeliveryPlatformsModal.value = false
    }
  } catch (err) {
    console.error('更新外送平台設定失敗:', err)
    alert('更新外送平台設定時發生錯誤')
  } finally {
    isUpdatingDeliveryPlatforms.value = false
  }
}

// 初始化編輯用數據
const initEditData = () => {
  // 深複製營業時間數據
  editBusinessHours.value = JSON.parse(JSON.stringify(store.value.businessHours || []))

  // 確保每天的時段都有正確的結構
  editBusinessHours.value.forEach((day) => {
    if (!day.periods || day.periods.length === 0) {
      day.periods = [
        {
          open: '09:00',
          close: '18:00',
        },
      ]
    }
  })

  // 深複製公告數據
  editAnnouncements.value = JSON.parse(JSON.stringify(store.value.announcements || []))

  // 深複製外送平台數據
  editDeliveryPlatforms.value = JSON.parse(JSON.stringify(store.value.deliveryPlatforms || []))
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '無資料'

  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 切換店鋪啟用狀態
const toggleStoreActive = async () => {
  if (!store.value) return

  try {
    const newStatus = !store.value.isActive
    await api.store.toggleStoreActive({
      brandId: brandId.value,
      id: store.value._id,
      isActive: newStatus,
    })

    // 更新本地狀態
    store.value.isActive = newStatus

    // 觸發列表刷新
    window.dispatchEvent(new CustomEvent('refresh-store-list'))
  } catch (err) {
    console.error('切換店鋪狀態失敗:', err)
    alert('切換店鋪狀態時發生錯誤')
  }
}

// 處理刪除確認
const handleDelete = async () => {
  if (!store.value) return

  isDeleting.value = true

  try {
    await api.store.deleteStore({
      brandId: brandId.value,
      id: store.value._id,
    })

    // 關閉模態對話框
    showDeleteModal.value = false

    // 延遲導航
    setTimeout(() => {
      // 返回店鋪列表
      router.push(`/admin/${brandId.value}/stores`)

      // 觸發刷新列表事件
      window.dispatchEvent(new CustomEvent('refresh-store-list'))
    }, 300)
  } catch (err) {
    console.error('刪除店鋪失敗:', err)

    if (err.response && err.response.data && err.response.data.message) {
      alert(`刪除失敗: ${err.response.data.message}`)
    } else {
      alert('刪除店鋪時發生錯誤')
    }
  } finally {
    isDeleting.value = false
  }
}

// 添加營業時段
const addPeriod = (day) => {
  day.periods.push({
    open: '09:00',
    close: '18:00',
  })
}

// 移除營業時段
const removePeriod = (day, periodIndex) => {
  day.periods.splice(periodIndex, 1)
}

// 更新營業時間
const updateBusinessHours = async () => {
  if (!store.value) return

  isUpdatingHours.value = true

  try {
    const response = await api.store.updateBusinessHours({
      brandId: brandId.value,
      storeId: store.value._id,
      businessHours: editBusinessHours.value,
    })

    if (response && response.store) {
      // 更新數據
      store.value.businessHours = response.store.businessHours

      // 關閉模態窗口
      showBusinessHoursModal.value = false
    }
  } catch (err) {
    console.error('更新營業時間失敗:', err)
    alert('更新營業時間時發生錯誤')
  } finally {
    isUpdatingHours.value = false
  }
}

// 添加模態窗中的公告
const addModalAnnouncement = () => {
  editAnnouncements.value.push({
    title: '',
    content: '',
  })
}

// 移除模態窗中的公告
const removeModalAnnouncement = (index) => {
  editAnnouncements.value.splice(index, 1)
}

// 更新公告
const updateAnnouncements = async () => {
  if (!store.value) return

  // 驗證表單
  let isValid = true
  for (const announcement of editAnnouncements.value) {
    if (!announcement.title.trim() || !announcement.content.trim()) {
      isValid = false
      break
    }
  }

  if (!isValid) {
    alert('公告標題和內容不能為空')
    return
  }

  isUpdatingAnnouncements.value = true

  try {
    const response = await api.store.updateAnnouncements({
      brandId: brandId.value,
      storeId: store.value._id,
      announcements: editAnnouncements.value,
    })

    if (response && response.store) {
      // 更新數據
      store.value.announcements = response.store.announcements

      // 關閉模態窗口
      showAnnouncementsModal.value = false
    }
  } catch (err) {
    console.error('更新公告失敗:', err)
    alert('更新公告時發生錯誤')
  } finally {
    isUpdatingAnnouncements.value = false
  }
}

// 生命週期鉤子
onMounted(() => {
  // 獲取店鋪資料
  fetchStoreData()

  // 監聽模態對話框打開事件
  // 當營業時間編輯模態框開啟時重新初始化數據
  watch(showBusinessHoursModal, (newValue) => {
    if (newValue) {
      editBusinessHours.value = JSON.parse(JSON.stringify(store.value.businessHours || []))

      // 確保每天的時段都有正確的結構
      editBusinessHours.value.forEach((day) => {
        if (!day.periods || day.periods.length === 0) {
          day.periods = [
            {
              open: '09:00',
              close: '18:00',
            },
          ]
        }
      })
    }
  })

  // 當公告編輯模態框開啟時重新初始化數據
  watch(showAnnouncementsModal, (newValue) => {
    if (newValue) {
      editAnnouncements.value = JSON.parse(JSON.stringify(store.value.announcements || []))
    }
  })

  // 當外送平台編輯模態框開啟時重新初始化數據
  watch(showDeliveryPlatformsModal, (newValue) => {
    if (newValue) {
      editDeliveryPlatforms.value = JSON.parse(JSON.stringify(store.value.deliveryPlatforms || []))
    }
  })

  // 當平台管理模態框關閉時重置選中的平台
  watch(showPlatformManagerModal, (newValue) => {
    if (!newValue) {
      selectedPlatform.value = ''
    }
  })
})

// 確保組件正確註冊
defineOptions({
  components: {
    QRTableCardGenerator,
    PlatformStoreManager,
  },
})
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-title {
  font-weight: 600;
}

/* 表格樣式 */
.table th {
  font-weight: 600;
  background-color: #f8f9fa;
}

.table td,
.table th {
  vertical-align: middle;
}

/* 必填欄位標記 */
.required::after {
  content: ' *';
  color: #dc3545;
}

/* 時間輸入組件 */
.time-input-group {
  min-width: 100px;
}

/* 公告樣式 */
.announcement-item {
  background-color: #f8f9fa;
  transition: all 0.2s;
}

.announcement-item:hover {
  background-color: #f1f3f5;
}

.announcement-title {
  font-weight: 600;
}

/* 快速操作卡片 */
.action-card {
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #dee2e6;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: #0d6efd;
}

.action-icon {
  font-size: 2rem;
  color: #0d6efd;
}

/* 連結輸入框樣式 */
.input-group .form-control[readonly] {
  background-color: #f8f9fa;
  cursor: default;
}

.input-group .btn {
  border-left: 0;
  transition: all 0.3s ease;
}

.input-group .btn:not(:last-child) {
  border-right: 0;
}

/* 複製按鈕過渡效果 */
.input-group .btn i {
  transition: all 0.2s ease;
}
</style>
