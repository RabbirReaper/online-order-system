<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="text-center mb-4">會員註冊</h2>
      </div>
      <div class="auth-body">
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
        <form @submit.prevent="handleNextStep">
          <div class="mb-3">
            <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="name" v-model="userData.name" placeholder="請輸入您的姓名" required>
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">電子郵件</label>
            <input type="email" class="form-control" id="email" v-model="userData.email" placeholder="請輸入您的電子郵件">
            <small class="text-muted">選填，用於接收訂單通知</small>
          </div>
          <div class="mb-3">
            <label for="phone" class="form-label">手機號碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="tel" class="form-control" id="phone" v-model="userData.phone" placeholder="請輸入您的手機號碼"
                required>
              <button class="btn btn-outline-secondary" type="button" @click="sendVerificationCode"
                :disabled="isCodeSending || countdown > 0">
                <span v-if="isCodeSending" class="spinner-border spinner-border-sm me-1" role="status"
                  aria-hidden="true"></span>
                {{ countdown > 0 ? `重新發送(${countdown}s)` : '獲取驗證碼' }}
              </button>
            </div>
            <small class="form-text text-muted">驗證碼將發送到您的手機</small>
          </div>
          <div class="mb-3">
            <label for="verificationCode" class="form-label">驗證碼 <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="verificationCode" v-model="verificationCode"
              placeholder="請輸入收到的驗證碼" required>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                v-model="userData.password" placeholder="請設置密碼 (至少8位)" required minlength="8">
              <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
            <small class="form-text text-muted">密碼長度至少需要8個字元</small>
          </div>
          <div class="mb-4">
            <label for="confirmPassword" class="form-label">確認密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control" id="confirmPassword"
                v-model="confirmPassword" placeholder="請再次輸入密碼" required>
              <button class="btn btn-outline-secondary" type="button" @click="toggleConfirmPasswordVisibility">
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
          <div class="mb-4 form-check">
            <input class="form-check-input" type="checkbox" id="agreeTerms" v-model="agreeTerms" required>
            <label class="form-check-label" for="agreeTerms">
              我已閱讀並同意 <a href="#" @click.prevent="showTerms">用戶服務條款</a> 和 <a href="#"
                @click.prevent="showPrivacyPolicy">隱私政策</a>
            </label>
          </div>
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading || !isFormValid">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              註冊
            </button>
            <button type="button" class="btn btn-outline-secondary py-2 mt-2" @click="goToLogin">
              已有帳號？點此登入
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 驗證碼已發送模態框 -->
  <BModal id="verificationCodeModal" title="驗證碼已發送" ok-title="我知道了" ok-variant="success"
    cancel-variant="outline-secondary" no-close-on-backdrop @ok="closeVerificationModal" ref="verificationCodeModal">
    <div class="text-center mb-3">
      <i class="bi bi-envelope-check-fill text-success" style="font-size: 3rem;"></i>
    </div>
    <p class="text-center">驗證碼已發送到您的手機，請注意查收</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      系統已向您的手機發送驗證簡訊，請在5分鐘內完成驗證。
    </div>
  </BModal>

  <!-- 條款對話框 -->
  <BModal id="termsModal" title="用戶服務條款" ok-title="我同意" ok-variant="primary" size="lg" scrollable
    @ok="agreeTerms = true" ref="termsModal">
    <div style="font-size: 14px; line-height: 1.6; padding: 16px;">
      <h5 style="margin-top: 1em;">第一條：總則</h5>
      <p>本服務條款係由本公司為提供線上訂餐服務所制定。當您註冊並使用本平台，即視為您已閱讀、理解並同意本條款之所有內容。</p>

      <h5 style="margin-top: 1em;">第二條：用戶註冊與帳號安全</h5>
      <p>用戶須提供真實、準確的個人資料。註冊帳號後，用戶有責任妥善保管登入資訊，並對所有經由其帳號所發出的行為負責。</p>

      <h5 style="margin-top: 1em;">第三條：服務內容</h5>
      <p>本平台提供餐點資訊瀏覽、線上點餐、付款等功能，並可能依實際情況調整或增加新功能。所有服務均以平台當前提供內容為準。</p>

      <h5 style="margin-top: 1em;">第四條：訂單處理</h5>
      <p>用戶確認訂單後，系統將即時通知商家。商家有權在特殊情況下取消或更改訂單，並以適當方式通知用戶。</p>

      <h5 style="margin-top: 1em;">第五條：隱私政策</h5>
      <p>本公司依據個人資料保護法保護用戶資料，並不會未經授權將資料提供給第三方，除非基於法律義務或政府要求。</p>

      <h5 style="margin-top: 1em;">第六條：法律責任</h5>
      <p>用戶不得利用本平台從事違法行為。若有違法、違規或影響平台運作之情事，本公司得中止其帳號並保留法律追訴權。</p>

      <h5 style="margin-top: 1em;">第七條：條款修改</h5>
      <p>本公司保留隨時修改本服務條款之權利，並會將更新內容公告於平台，修訂後條款即時生效，請用戶定期查閱。</p>

      <h5 style="margin-top: 1em;">第八條：適用法律</h5>
      <p>本條款以中華民國法律為準據法，如有爭議，雙方同意以臺灣地方法院為第一審管轄法院。</p>
    </div>
  </BModal>

  <!-- 隱私政策對話框 -->
  <BModal id="privacyModal" title="隱私政策" ok-title="我同意" ok-variant="primary" size="lg" scrollable
    @ok="agreeTerms = true" ref="privacyModal">
    <div>
      <h5>隱私保護政策</h5>
      <p>
        本公司非常重視您的隱私保護，以下說明我們如何收集、使用和保護您的個人資料。本政策適用於您使用我們的網站、應用程式和服務時所提供的所有個人資料。請您仔細閱讀以下內容，以了解我們如何處理您的資料並保障您的權益。若有任何疑問，請隨時與我們聯絡。
      </p>

      <h5>1. 資料收集</h5>
      <p>
        我們收集的個人資料包括但不限於：姓名、電話號碼、電子郵件、配送地址、付款資訊、IP位址、裝置資訊、瀏覽紀錄、購物偏好、位置資訊等。我們透過您直接提供、自動收集技術及第三方合作夥伴等多種管道獲取這些資料。我們承諾只收集必要的資料，且收集過程遵守相關法律法規的規定。
      </p>

      <h5>2. 資料使用</h5>
      <p>
        我們使用您的個人資料用於訂單處理、客戶服務提供、系統通知發送、產品推薦、市場分析、服務改善、安全維護等目的。我們只會在必要範圍內使用您的資料，並確保使用方式符合您的合理期望。在某些情況下，我們可能會根據您的行為分析結果提供個人化的內容和服務，以提升您的使用體驗。
      </p>

      <h5>3. 資料保護</h5>
      <p>
        我們採取適當的技術和組織措施保護您的個人資料，防止未經授權的訪問、使用或披露。這些措施包括資料加密、防火牆設置、定期安全審核、嚴格的員工訪問控制等。我們定期更新和測試我們的安全系統，以確保您的資料得到最佳保護。儘管如此，網際網路傳輸不可能完全安全，我們無法保證資料傳輸的絕對安全性。
      </p>

      <h5>4. 第三方共享</h5>
      <p>
        在某些情況下，我們可能需要與第三方共享您的個人資料，如配送合作夥伴、支付處理商、IT服務提供商、行銷夥伴等。我們只會與履行特定服務所必需的第三方共享您的資料，並要求這些第三方遵循同等的資料保護標準。此外，如法律要求或業務轉讓情況下，我們也可能披露您的資料。在任何情況下，我們不會出售您的個人資料。
      </p>

      <h5>5. Cookie使用</h5>
      <p>
        我們使用Cookie技術記錄您的瀏覽偏好和購物行為，以提供更好的用戶體驗。Cookie是存儲在您裝置上的小型文本文件，可幫助我們識別您的瀏覽器和偏好設置。我們使用功能性Cookie（維持網站功能）、分析性Cookie（了解使用情況）和行銷Cookie（個性化廣告）。您可以在瀏覽器設置中修改或禁用Cookie，但這可能會影響某些服務的功能。
      </p>

      <h5>6. 權利聲明</h5>
      <p>
        您有權查閱、更正、刪除您的個人資料，以及撤回對資料使用的同意。您也有權要求限制處理、反對處理以及資料可攜性權利。若要行使這些權利，請透過下方聯絡方式與我們聯繫。我們將在法律規定的時間內回應您的請求。如您對我們的資料處理有任何疑慮，您有權向相關資料保護監管機構提出投訴。我們鼓勵您先與我們聯繫，以便我們能夠直接解決您的問題。
      </p>

      <h5>7. 政策變更</h5>
      <p>
        我們可能會不定期更新本隱私保護政策，以反映我們的資料處理實踐變化或法律要求的更新。更新後的政策將在本網站公布，重大變更時我們會透過電子郵件或網站通知您。我們建議您定期查閱本政策，以了解我們如何保護您的資料。最新更新日期將顯示在政策底部，您繼續使用我們的服務即表示接受更新後的政策內容。
      </p>

      <h5>8. 聯絡方式</h5>
      <p>
        如您對本隱私保護政策有任何疑問、建議或需行使您的資料權利，請隨時與我們聯繫。您可通過電子郵件(privacy@company.com)、客服電話(0800-123-456)或書面形式(高雄市○○區○○路123號)聯絡我們的資料保護專員。我們承諾在收到您的請求後，將盡快處理並回覆您的查詢。
      </p>
    </div>
  </BModal>

  <!-- 錯誤模態框 -->
  <BModal id="errorModal" title="操作失敗" ok-title="確認" ok-variant="danger" no-close-on-backdrop ref="errorModal">
    <div class="text-center mb-3">
      <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
    </div>
    <p class="text-center">{{ errorMessage }}</p>
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      請檢查您輸入的資料並稍後再試。
    </div>
  </BModal>

  <!-- 註冊成功模態框 -->
  <BModal id="successModal" title="註冊成功" ok-title="立即登入" ok-variant="success" hide-header-close no-close-on-backdrop
    no-close-on-esc @ok="redirectToLogin" ref="successModal">
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
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
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { BModal } from 'bootstrap-vue-next';
import api from '@/api';

// 路由相關
const router = useRouter();
const route = useRoute();

// 模態框參考
const errorModal = ref(null);
const successModal = ref(null);
const verificationCodeModal = ref(null);
const termsModal = ref(null);
const privacyModal = ref(null);

// 新增 brandId 計算屬性
const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId');
});

// 表單資料
const userData = reactive({
  name: '',
  email: '',
  phone: '',
  password: ''
});
const confirmPassword = ref('');
const verificationCode = ref('');
const agreeTerms = ref(false);

// 狀態管理
const isLoading = ref(false);
const isCodeSending = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const countdown = ref(0);
let countdownTimer = null;

// 表單驗證
const isFormValid = computed(() => {
  return userData.name &&
    userData.phone &&
    userData.password &&
    confirmPassword.value &&
    userData.password === confirmPassword.value &&
    verificationCode.value &&
    agreeTerms.value;
});

// 切換密碼可見性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 跳轉到登入頁面
const goToLogin = () => {
  router.push('/auth/login');
};

// 註冊成功後跳轉到登入頁面
const redirectToLogin = () => {
  router.push({
    path: '/auth/login',
    query: { phone: userData.phone, registered: 'true' }
  });
};

// 顯示服務條款
const showTerms = () => {
  termsModal.value.show();
};

// 顯示隱私政策
const showPrivacyPolicy = () => {
  privacyModal.value.show();
};

// 關閉驗證碼模態框
const closeVerificationModal = () => {
  // 可以在這裡添加模態框關閉後的邏輯
};

// 開始倒計時
const startCountdown = (seconds) => {
  countdown.value = seconds;
  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownTimer);
    }
  }, 1000);
};

// 發送驗證碼
const sendVerificationCode = async () => {
  // 驗證手機號碼
  if (!userData.phone || !/^\d{10,}$/.test(userData.phone)) {
    errorMessage.value = '請輸入有效的手機號碼';
    if (errorModal.value) {
      errorModal.value.show();
    }
    return;
  }

  try {
    errorMessage.value = '';
    isCodeSending.value = true;

    if (!brandId.value) {
      throw new Error('無法獲取品牌資訊');
    }

    // 調用發送驗證碼 API
    const response = await api.userAuth.sendVerificationCode({
      brandId: brandId.value,
      phone: userData.phone,
      purpose: 'register'
    });

    // 顯示成功訊息並開始倒計時
    if (verificationCodeModal.value) {
      verificationCodeModal.value.show();
    }

    startCountdown(60); // 60秒倒計時

  } catch (error) {
    console.error('發送驗證碼失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '發送驗證碼失敗，請稍後再試';
    } else {
      errorMessage.value = '發送驗證碼失敗，請稍後再試';
    }

    if (errorModal.value) {
      errorModal.value.show();
    }
  } finally {
    isCodeSending.value = false;
  }
};

// 處理註冊
const handleNextStep = async () => {
  // 表單驗證
  if (!isFormValid.value) {
    errorMessage.value = '請填寫所有必填欄位';
    if (errorModal.value) {
      errorModal.value.show();
    }
    return;
  }

  if (userData.password !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致';
    if (errorModal.value) {
      errorModal.value.show();
    }
    return;
  }

  try {
    errorMessage.value = '';
    isLoading.value = true;

    if (!brandId.value) {
      throw new Error('無法獲取品牌資訊');
    }

    // 然後註冊用戶
    const response = await api.userAuth.register({
      brandId: brandId.value,
      userData: {
        name: userData.name,
        email: userData.email || '', // 電子郵件現在可以為空
        phone: userData.phone,
        password: userData.password,
        brand: brandId.value
      },
      code: verificationCode.value
    });

    // 註冊成功後的處理
    console.log('註冊成功:', response);

    // 顯示註冊成功模態框
    if (successModal.value) {
      successModal.value.show();
    } else {
      // 如果模態框不可用，直接跳轉
      redirectToLogin();
    }

  } catch (error) {
    console.error('註冊失敗:', error);

    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '註冊失敗，請檢查您的資料';
    } else {
      errorMessage.value = '註冊失敗，請稍後再試';
    }

    if (errorModal.value) {
      errorModal.value.show();
    }
  } finally {
    isLoading.value = false;
  }
};

// 組件卸載時清除定時器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f8f9fa;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.auth-header {
  padding: 1.5rem 1.5rem 0.5rem;
}

.auth-body {
  padding: 1.5rem;
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

@media (max-width: 576px) {
  .auth-card {
    border-radius: 0;
    box-shadow: none;
  }

  .auth-container {
    padding: 0;
  }
}
</style>
