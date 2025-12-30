<template>
  <div class="main-container">
    <!-- 頂部導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper">
        <nav class="navbar navbar-light">
          <div class="container-fluid px-3">
            <a class="navbar-brand" href="#" @click.prevent="goBack">
              <i class="bi bi-arrow-left me-2"></i>返回
            </a>
            <div class="navbar-title">會員註冊</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="auth-card">
        <form @submit.prevent="handleSubmit" :class="{ 'was-validated': wasValidated }" novalidate>
          <!-- 姓名 -->
          <div class="mb-3">
            <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="userData.name"
              :class="{ 'is-invalid': fieldErrors.name, 'is-valid': isFieldValid('name') }"
              placeholder="請輸入您的姓名"
              @blur="validateField('name')"
              @input="clearFieldError('name')"
              required
            />
            <div class="invalid-feedback">
              {{ fieldErrors.name }}
            </div>
          </div>

          <!-- 手機號碼 -->
          <div class="mb-3">
            <label for="phone" class="form-label"
              >手機號碼 <span class="text-danger">*</span></label
            >
            <div class="input-group">
              <input
                type="tel"
                class="form-control"
                id="phone"
                v-model="userData.phone"
                :class="{ 'is-invalid': fieldErrors.phone, 'is-valid': isFieldValid('phone') }"
                placeholder="請輸入您的手機號碼"
                @blur="validateField('phone')"
                @input="clearFieldError('phone')"
                required
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="sendVerificationCode"
                :disabled="isCodeSending || countdown > 0 || fieldErrors.phone"
              >
                <span
                  v-if="isCodeSending"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ getVerificationButtonText() }}
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.phone }}
              </div>
            </div>
            <small class="form-text text-muted">驗證碼將發送到您的手機</small>
          </div>

          <!-- 驗證碼 -->
          <div class="mb-3">
            <label for="verificationCode" class="form-label"
              >驗證碼 <span class="text-danger">*</span></label
            >
            <input
              type="text"
              class="form-control"
              id="verificationCode"
              v-model="verificationCode"
              :class="{
                'is-invalid': fieldErrors.verificationCode,
                'is-valid': isFieldValid('verificationCode'),
              }"
              placeholder="請輸入收到的驗證碼"
              @blur="validateField('verificationCode')"
              @input="clearFieldError('verificationCode')"
              required
            />
            <div class="invalid-feedback">
              {{ fieldErrors.verificationCode }}
            </div>
          </div>

          <!-- 密碼 -->
          <div class="mb-3">
            <label for="password" class="form-label">密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                id="password"
                v-model="userData.password"
                :class="{
                  'is-invalid': fieldErrors.password,
                  'is-valid': isFieldValid('password'),
                }"
                placeholder="請設置密碼 6-32位，只能包含英文數字及!@#$%^&*"
                @blur="validateField('password')"
                @input="clearFieldError('password')"
                required
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.password }}
              </div>
            </div>
          </div>

          <!-- 確認密碼 -->
          <div class="mb-4">
            <label for="confirmPassword" class="form-label"
              >確認密碼 <span class="text-danger">*</span></label
            >
            <div class="input-group">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-control"
                id="confirmPassword"
                v-model="confirmPassword"
                :class="{
                  'is-invalid': fieldErrors.confirmPassword,
                  'is-valid': isFieldValid('confirmPassword'),
                }"
                placeholder="請再次輸入密碼"
                @blur="validateField('confirmPassword')"
                @input="clearFieldError('confirmPassword')"
                required
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="toggleConfirmPasswordVisibility"
              >
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.confirmPassword }}
              </div>
            </div>
          </div>

          <!-- 同意條款 -->
          <div class="mb-4 form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreeTerms"
              v-model="agreeTerms"
              :class="{ 'is-invalid': fieldErrors.agreeTerms }"
              @change="validateField('agreeTerms')"
              required
            />
            <label class="form-check-label" for="agreeTerms">
              我已閱讀並同意 <a href="#" @click.prevent="showTerms">用戶服務條款</a> 和
              <a href="#" @click.prevent="showPrivacyPolicy">隱私政策</a>
            </label>
            <div class="invalid-feedback">
              {{ fieldErrors.agreeTerms }}
            </div>
          </div>

          <!-- 表單整體錯誤訊息 -->
          <BAlert :show="formErrors.length > 0" variant="danger" class="mb-3">
            <div v-for="error in formErrors" :key="error" class="mb-1 last:mb-0">
              {{ error }}
            </div>
          </BAlert>

          <!-- 提交按鈕 -->
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading">
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              註冊
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 原有的模態框保持不變 -->
  <!-- 驗證碼已發送模態框 -->
  <BModal
    id="verificationCodeModal"
    title="驗證碼已發送"
    ok-title="我知道了"
    ok-variant="success"
    cancel-variant="outline-secondary"
    no-close-on-backdrop
    @ok="closeVerificationModal"
    ref="verificationCodeModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-envelope-check-fill text-success" style="font-size: 3rem"></i>
    </div>
    <p class="text-center">驗證碼已發送到您的手機，請注意查收</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      系統已向您的手機發送驗證簡訊，請在5分鐘內完成驗證。
    </div>
  </BModal>

  <!-- 用戶服務條款模態框 -->
  <BModal
    id="termsModal"
    title="用戶服務條款"
    ok-only
    ok-title="我知道了"
    ok-variant="primary"
    size="lg"
    scrollable
    ref="termsModal"
  >
    <div class="terms-content">
      <h6 class="fw-bold mb-3">歡迎使用本線上點餐系統</h6>
      <p class="text-muted small">
        在您使用本服務前，請仔細閱讀以下服務條款。使用本服務即表示您同意接受本條款的約束。
      </p>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">一、服務說明</h6>
        <ol class="small">
          <li>本系統提供線上點餐、預約、會員管理等服務</li>
          <li>您必須年滿 18 歲或在法定監護人同意下使用本服務</li>
          <li>您需提供真實、準確的個人資料進行註冊</li>
          <li>您有責任維護帳號及密碼的安全性</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">二、訂單與付款</h6>
        <ol class="small">
          <li>訂單送出後，我們會盡快為您處理，但不保證立即接受</li>
          <li>商品價格、規格以下單時頁面顯示為準</li>
          <li>我們保留接受或拒絕訂單的權利</li>
          <li>付款方式包含現金、信用卡、LINE Pay 等</li>
          <li>所有交易均受當地法律規範</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">三、取消與退款</h6>
        <ol class="small">
          <li>訂單確認後若需取消，請盡快聯繫店家</li>
          <li>已製作完成的餐點恕不接受退款</li>
          <li>若因店家原因無法提供服務，將全額退款</li>
          <li>退款將依原付款方式退回，處理時間約 7-14 個工作天</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">四、會員權益</h6>
        <ol class="small">
          <li>會員可享有點數累積、優惠券等權益</li>
          <li>點數及優惠券均有使用期限，逾期將自動失效</li>
          <li>會員權益不得轉讓或兌換現金</li>
          <li>我們保留修改會員權益內容的權利</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">五、用戶行為規範</h6>
        <ol class="small">
          <li>禁止使用本服務進行任何非法活動</li>
          <li>禁止濫用優惠活動或進行欺詐行為</li>
          <li>禁止干擾或破壞系統正常運作</li>
          <li>違反規定者，我們有權暫停或終止其帳號</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">六、智慧財產權</h6>
        <ol class="small">
          <li>本系統所有內容（包含文字、圖片、商標等）均受著作權法保護</li>
          <li>未經授權，不得複製、修改、散佈本系統內容</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">七、免責聲明</h6>
        <ol class="small">
          <li>我們盡力確保服務穩定，但不保證服務不會中斷</li>
          <li>因不可抗力因素造成的服務中斷，我們不承擔責任</li>
          <li>用戶應自行評估使用本服務的風險</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">八、條款修改</h6>
        <p class="small">
          我們保留隨時修改本條款的權利，修改後的條款將公布於本頁面。繼續使用本服務即表示您同意修改後的條款。
        </p>
      </div>

      <div class="mb-3">
        <h6 class="fw-bold mb-2">九、聯繫方式</h6>
        <p class="small">
          如對本條款有任何疑問，請透過系統內的客服功能聯繫我們。
        </p>
      </div>

      <div class="alert alert-info small">
        <i class="bi bi-info-circle-fill me-2"></i>
        最後更新日期：{{ new Date().toLocaleDateString('zh-TW') }}
      </div>
    </div>
  </BModal>

  <!-- 隱私政策模態框 -->
  <BModal
    id="privacyPolicyModal"
    title="隱私政策"
    ok-only
    ok-title="我知道了"
    ok-variant="primary"
    size="lg"
    scrollable
    ref="privacyPolicyModal"
  >
    <div class="privacy-content">
      <h6 class="fw-bold mb-3">個人資料保護聲明</h6>
      <p class="text-muted small">
        我們重視您的隱私權，本政策說明我們如何收集、使用、揭露及保護您的個人資料。
      </p>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">一、資料收集</h6>
        <p class="small fw-bold">我們收集的個人資料包括：</p>
        <ol class="small">
          <li><strong>基本資料</strong>：姓名、手機號碼</li>
          <li><strong>訂單資料</strong>：訂購內容、配送地址、付款資訊</li>
          <li><strong>會員資料</strong>：點數記錄、優惠券使用記錄</li>
          <li><strong>技術資料</strong>：IP 位址、瀏覽器類型、裝置資訊、Cookie</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">二、資料使用目的</h6>
        <p class="small">我們使用您的個人資料用於：</p>
        <ol class="small">
          <li>處理您的訂單及提供服務</li>
          <li>帳戶管理及身份驗證</li>
          <li>發送訂單確認、取餐通知等訊息</li>
          <li>提供客戶服務及處理您的詢問</li>
          <li>進行會員權益管理（點數、優惠券等）</li>
          <li>改善服務品質及用戶體驗</li>
          <li>遵守法律規定及防止詐欺</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">三、資料分享與揭露</h6>
        <p class="small">我們不會出售您的個人資料，但在以下情況可能分享您的資料：</p>
        <ol class="small">
          <li><strong>服務提供商</strong>：為完成服務所需的第三方（如付款處理商、簡訊服務商）</li>
          <li><strong>法律要求</strong>：遵守法律程序、法院命令或政府要求</li>
          <li><strong>保護權益</strong>：保護我們或他人的權利、財產或安全</li>
          <li><strong>企業交易</strong>：若發生合併、收購等企業交易</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">四、Cookie 使用</h6>
        <p class="small">我們使用 Cookie 及類似技術來：</p>
        <ol class="small">
          <li>維持您的登入狀態</li>
          <li>記住您的偏好設定</li>
          <li>分析網站流量及使用情況</li>
          <li>提供個人化的服務體驗</li>
        </ol>
        <p class="small">您可以透過瀏覽器設定管理 Cookie，但這可能影響某些功能的使用。</p>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">五、資料安全</h6>
        <p class="small">我們採取以下措施保護您的資料：</p>
        <ol class="small">
          <li>使用加密技術傳輸敏感資料</li>
          <li>實施存取控制，限制授權人員存取</li>
          <li>定期進行安全性檢測與更新</li>
          <li>員工須遵守保密義務</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">六、資料保存期限</h6>
        <ol class="small">
          <li><strong>會員資料</strong>：帳號存續期間及刪除後 3 年（依法律規定）</li>
          <li><strong>訂單資料</strong>：訂單完成後 5 年（依稅務及會計法規）</li>
          <li><strong>行銷資料</strong>：直到您撤回同意或帳號刪除為止</li>
        </ol>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">七、您的權利</h6>
        <p class="small">依據個人資料保護法，您享有以下權利：</p>
        <ol class="small">
          <li><strong>查詢權</strong>：查詢或請求閱覽您的個人資料</li>
          <li><strong>更正權</strong>：請求更正或補充您的個人資料</li>
          <li><strong>刪除權</strong>：請求刪除您的個人資料</li>
          <li><strong>停止處理權</strong>：請求停止處理或利用您的個人資料</li>
          <li><strong>資料可攜權</strong>：請求提供您的個人資料副本</li>
        </ol>
        <p class="small">
          如需行使上述權利，請透過系統內的客服功能聯繫我們。我們會在合理期限內回應您的請求。
        </p>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">八、兒童隱私</h6>
        <p class="small">
          本服務不針對 13 歲以下兒童。我們不會故意收集兒童的個人資料。若您發現兒童在未經同意的情況下提供了個人資料，請立即聯繫我們。
        </p>
      </div>

      <div class="mb-4">
        <h6 class="fw-bold mb-2">九、政策變更</h6>
        <p class="small">
          我們可能會不時更新本隱私政策。重大變更時，我們會透過網站公告或其他方式通知您。請定期查閱本政策以了解最新內容。
        </p>
      </div>

      <div class="mb-3">
        <h6 class="fw-bold mb-2">十、聯繫我們</h6>
        <p class="small">
          如對本隱私政策有任何疑問或需要行使您的權利，請透過以下方式聯繫我們：
        </p>
        <ul class="small">
          <li>透過系統內的客服功能</li>
          <li>或聯繫您所訂購的店家</li>
        </ul>
      </div>

      <div class="alert alert-info small">
        <i class="bi bi-info-circle-fill me-2"></i>
        最後更新日期：{{ new Date().toLocaleDateString('zh-TW') }}
      </div>
    </div>
  </BModal>

  <!-- 註冊成功模態框 -->
  <BModal
    id="successModal"
    title="註冊成功"
    ok-title="立即登入"
    ok-variant="success"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc
    @ok="redirectToLogin"
    ref="successModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
    </div>
    <h5 class="text-center mb-3">恭喜您完成註冊！</h5>
    <p class="text-center">您的帳號已成功建立，請立即登入開始使用我們的服務。</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      您的會員資料已成功儲存，您可以在登入後隨時查看或修改。
    </div>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BModal, BAlert } from 'bootstrap-vue-next'
import api from '@/api'

// 路由相關
const router = useRouter()
const route = useRoute()

// 模態框參考
const successModal = ref(null)
const verificationCodeModal = ref(null)
const termsModal = ref(null)
const privacyPolicyModal = ref(null)

// 新增 brandId 計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

// 表單資料 - 使用 reactive
const userData = reactive({
  name: '',
  phone: '',
  password: '',
})

const confirmPassword = ref('')
const verificationCode = ref('')
const agreeTerms = ref(false)

// 驗證狀態管理 - 符合用戶偏好架構
const fieldErrors = reactive({}) // 個別欄位錯誤
const formErrors = ref([]) // 表單整體錯誤
const touchedFields = reactive({}) // 追蹤已觸摸欄位
const wasValidated = ref(false) // Bootstrap 驗證狀態

// 其他狀態
const isLoading = ref(false)
const isCodeSending = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countdown = ref(0)
let countdownTimer = null

// 驗證規則 - 統一管理
const validationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 25,
    message: '姓名長度必須1-25個字元',
  },
  phone: {
    required: true,
    pattern: /^09\d{8}$/,
    message: '請輸入有效的手機號碼格式 (09xxxxxxxx)',
  },
  verificationCode: {
    required: true,
    minLength: 6,
    maxLength: 6,
    message: '請輸入6位數驗證碼',
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9!@#$%^&*]+$/,
    message: '密碼必須6-32個字元，只能包含英文、數字和符號 !@#$%^&*',
  },
  confirmPassword: {
    required: true,
    match: 'password',
    message: '確認密碼與密碼不相符',
  },
  agreeTerms: {
    required: true,
    message: '請同意服務條款和隱私政策',
  },
}

// 核心驗證函數
const validateField = (fieldName) => {
  touchedFields[fieldName] = true
  const rule = validationRules[fieldName]
  if (!rule) return true

  let value
  if (fieldName === 'confirmPassword') {
    value = confirmPassword.value
  } else if (fieldName === 'verificationCode') {
    value = verificationCode.value
  } else if (fieldName === 'agreeTerms') {
    value = agreeTerms.value
  } else {
    value = userData[fieldName]
  }

  // 必填驗證
  if (rule.required) {
    if (fieldName === 'agreeTerms') {
      if (!value) {
        fieldErrors[fieldName] = rule.message
        return false
      }
    } else if (!value || value.trim() === '') {
      fieldErrors[fieldName] = rule.message
      return false
    }
  }

  // 如果不是必填且為空，則跳過其他驗證
  if (!rule.required && (!value || value.trim() === '')) {
    delete fieldErrors[fieldName]
    return true
  }

  // 最小長度驗證
  if (rule.minLength && value.length < rule.minLength) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  // 最大長度驗證
  if (rule.maxLength && value.length > rule.maxLength) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  // 正則表達式驗證
  if (rule.pattern && !rule.pattern.test(value)) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  // 匹配驗證（用於確認密碼）
  if (rule.match) {
    const matchValue = userData[rule.match]
    if (value !== matchValue) {
      fieldErrors[fieldName] = rule.message
      return false
    }
  }

  delete fieldErrors[fieldName]
  return true
}

const clearFieldError = (fieldName) => {
  delete fieldErrors[fieldName]
  formErrors.value = [] // 清除表單整體錯誤
}

const isFieldValid = (fieldName) => {
  return touchedFields[fieldName] && !fieldErrors[fieldName] && userData[fieldName]
}

const validateForm = () => {
  let isValid = true
  const fieldsToValidate = [
    'name',
    'phone',
    'verificationCode',
    'password',
    'confirmPassword',
    'agreeTerms',
  ]

  fieldsToValidate.forEach((field) => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  wasValidated.value = true
  return isValid
}

// 返回上一頁
const goBack = () => {
  router.back()
}

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// 註冊成功後跳轉到登入頁面
const redirectToLogin = () => {
  router.push({
    path: '/auth/login',
    query: { phone: userData.phone, registered: 'true' },
  })
}

// 顯示服務條款和隱私政策
const showTerms = () => {
  if (termsModal.value) {
    termsModal.value.show()
  }
}

const showPrivacyPolicy = () => {
  if (privacyPolicyModal.value) {
    privacyPolicyModal.value.show()
  }
}

// 關閉驗證碼模態框
const closeVerificationModal = () => {
  // 可以在這裡添加模態框關閉後的邏輯
}

// 獲取驗證碼按鈕文字
const getVerificationButtonText = () => {
  if (isCodeSending.value) {
    return '發送中...'
  }
  if (countdown.value > 0) {
    return `重新發送(${countdown.value}s)`
  }
  return '獲取驗證碼'
}

// 開始倒計時
const startCountdown = (seconds) => {
  countdown.value = seconds
  clearInterval(countdownTimer)

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// 發送驗證碼 - 優化錯誤處理
const sendVerificationCode = async () => {
  try {
    formErrors.value = [] // 清除之前的錯誤

    // 先驗證手機號碼
    if (!validateField('phone')) {
      return
    }

    // 檢查是否在倒計時中
    if (countdown.value > 0) {
      formErrors.value = [`請等待 ${countdown.value} 秒後再重新發送驗證碼`]
      return
    }

    // 檢查品牌ID
    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊，請重新整理頁面後再試']
      return
    }

    isCodeSending.value = true

    // 調用發送驗證碼 API
    const response = await api.userAuth.sendVerificationCode({
      brandId: brandId.value,
      phone: userData.phone.replace(/[\s\-\(\)]/g, ''),
      purpose: 'register',
    })
    console.log('驗證碼發送成功:', response)
    // 顯示成功訊息並開始倒計時
    if (verificationCodeModal.value) {
      verificationCodeModal.value.show()
    }

    startCountdown(60) // 60秒倒計時
  } catch (error) {
    console.error('發送驗證碼失敗:', error)

    if (error.response?.status === 429) {
      formErrors.value = ['發送驗證碼過於頻繁，請稍後再試']
    } else if (error.response?.status === 400) {
      formErrors.value = [error.response.data.message || '手機號碼格式不正確或已被註冊']
    } else if (error.response?.data?.message) {
      formErrors.value = [error.response.data.message]
    } else {
      formErrors.value = ['發送驗證碼失敗，請檢查網路連線後再試']
    }
  } finally {
    isCodeSending.value = false
  }
}

// 處理表單提交 - 重構驗證邏輯
const handleSubmit = async () => {
  try {
    formErrors.value = [] // 清除之前的錯誤

    // 驗證整個表單
    if (!validateForm()) {
      formErrors.value = ['請檢查並修正表單中的錯誤']
      return
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊']
      return
    }

    isLoading.value = true

    // 註冊用戶
    const response = await api.userAuth.register({
      brandId: brandId.value,
      userData: {
        name: userData.name,
        phone: userData.phone.replace(/[\s\-\(\)]/g, ''),
        password: userData.password,
        brand: brandId.value,
      },
      code: verificationCode.value,
    })

    // 註冊成功後的處理
    console.log('註冊成功:', response)

    // 顯示註冊成功模態框
    if (successModal.value) {
      successModal.value.show()
    } else {
      redirectToLogin()
    }
  } catch (error) {
    console.error('註冊失敗:', error)

    // 根據用戶偏好的錯誤處理邏輯
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      formErrors.value = error.response.data.errors
    } else if (error.response?.data?.message) {
      formErrors.value = [error.response.data.message]
    } else if (error.response?.status === 400) {
      const errorMsg = error.response.data.message
      if (errorMsg?.includes('驗證碼')) {
        formErrors.value = ['驗證碼錯誤或已過期，請重新獲取驗證碼']
      } else if (errorMsg?.includes('手機號碼')) {
        formErrors.value = ['該手機號碼已被註冊，請使用其他號碼或前往登入']
      } else {
        formErrors.value = [errorMsg || '註冊失敗，請檢查您的資料']
      }
    } else if (error.response?.status === 429) {
      formErrors.value = ['操作過於頻繁，請稍後再試']
    } else {
      formErrors.value = ['註冊失敗，請檢查網路連線後再試']
    }
  } finally {
    isLoading.value = false
  }
}

// 組件卸載時清除定時器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 導航欄樣式 */
.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.nav-placeholder {
  width: 30px;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

/* 內容容器 */
.content-wrapper {
  width: 100%;
  max-width: 736px;
  margin: 0 auto;
  padding: 80px 15px 30px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.auth-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
  font-weight: 500;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

.form-check-input:checked {
  background-color: #d35400;
  border-color: #d35400;
}

/* 針對性的驗證樣式 */
.form-control.is-valid,
.form-check-input.is-valid {
  border-color: #198754;
}

.form-control.is-invalid,
.form-check-input.is-invalid {
  border-color: #dc3545;
}

.last\:mb-0:last-child {
  margin-bottom: 0;
}

@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .auth-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}
</style>
