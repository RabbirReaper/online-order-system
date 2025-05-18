<template>
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">{{ isEditMode ? '編輯店鋪' : '新增店鋪' }}</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="submitForm" novalidate>
        <!-- 基本資訊區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">基本資訊</h6>

          <!-- 店鋪名稱 -->
          <div class="mb-3">
            <label for="storeName" class="form-label required">店鋪名稱</label>
            <BFormInput id="storeName" v-model="formData.name" :state="errors.name ? false : null" required />
            <BFormInvalidFeedback v-if="errors.name">{{ errors.name }}</BFormInvalidFeedback>
            <BFormText>請輸入店鋪名稱，不可超過50個字元</BFormText>
          </div>

          <!-- 店鋪地址 -->
          <div class="mb-3">
            <label for="storeAddress" class="form-label required">店鋪地址</label>
            <BFormInput id="storeAddress" v-model="formData.address" :state="errors.address ? false : null" required />
            <BFormInvalidFeedback v-if="errors.address">{{ errors.address }}</BFormInvalidFeedback>
            <BFormText>請輸入完整的店鋪地址，不可超過200個字元</BFormText>
          </div>

          <!-- 店鋪狀態 (僅在編輯模式顯示) -->
          <div class="mb-3" v-if="isEditMode">
            <label class="form-label d-block">店鋪狀態</label>
            <BFormCheckbox v-model="formData.isActive" switch>
              {{ formData.isActive ? '啟用' : '停用' }}
            </BFormCheckbox>
            <BFormText>啟用狀態決定店鋪是否可見及可下單</BFormText>
          </div>

          <!-- 店鋪圖片 -->
          <div class="mb-3">
            <label for="storeImage" class="form-label required">店鋪圖片</label>
            <BInputGroup>
              <BFormFile id="storeImage" ref="fileInputRef" @change="handleImageChange"
                :state="errors.image ? false : null" accept="image/*" />
              <BButton variant="outline-secondary" @click="clearImage"
                v-if="formData.newImage || (formData.image && formData.image.url)">
                清除
              </BButton>
            </BInputGroup>
            <BFormInvalidFeedback v-if="errors.image">{{ errors.image }}</BFormInvalidFeedback>
            <BFormText v-else>
              <i class="bi bi-info-circle me-1"></i>
              請上傳店鋪圖片，檔案大小限制為 1MB，支援 JPG、PNG 格式
            </BFormText>

            <!-- 圖片預覽 -->
            <div class="mt-2" v-if="formData.newImage">
              <img :src="formData.newImage" alt="圖片預覽" class="img-thumbnail" style="max-height: 200px" />
            </div>
            <!-- 現有圖片 (編輯模式) -->
            <div class="mt-2" v-else-if="formData.image && formData.image.url">
              <div class="d-flex align-items-center">
                <img :src="formData.image.url" alt="現有圖片" class="img-thumbnail me-2" style="max-height: 200px" />
                <span class="text-muted">現有圖片</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 營業時間區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>營業時間</span>
            <BButton size="sm" variant="outline-primary" @click="addDefaultBusinessHours"
              v-if="formData.businessHours.length === 0">
              <i class="bi bi-plus-circle me-1"></i>設置預設時間
            </BButton>
          </h6>

          <!-- 營業時間表格 -->
          <div class="table-responsive mb-3">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>星期</th>
                  <th>營業時段</th>
                  <th width="100px">公休日</th>
                  <th width="120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(day, index) in sortedBusinessHours" :key="day.day">
                  <td>{{ getDayName(day.day) }}</td>
                  <td>
                    <div v-if="!day.isClosed">
                      <div v-for="(period, pIndex) in day.periods" :key="pIndex" class="mb-2">
                        <div class="d-flex align-items-center">
                          <div class="time-input-group">
                            <BFormInput type="time" size="sm" v-model="day.periods[pIndex].open"
                              :state="hasTimeError(day, pIndex, 'open') ? false : null" />
                          </div>
                          <span class="mx-2">至</span>
                          <div class="time-input-group">
                            <BFormInput type="time" size="sm" v-model="day.periods[pIndex].close"
                              :state="hasTimeError(day, pIndex, 'close') ? false : null" />
                          </div>

                          <!-- 刪除時段按鈕 -->
                          <BButton size="sm" variant="outline-danger" class="ms-2" @click="removePeriod(day, pIndex)"
                            v-if="day.periods.length > 1">
                            <i class="bi bi-trash"></i>
                          </BButton>
                        </div>
                        <BFormInvalidFeedback :state="false"
                          v-if="hasTimeError(day, pIndex, 'open') || hasTimeError(day, pIndex, 'close')">
                          時間格式不正確或關店時間早於開店時間
                        </BFormInvalidFeedback>
                      </div>

                      <!-- 新增時段按鈕 -->
                      <BButton size="sm" variant="outline-primary" class="mt-1" @click="addPeriod(day)">
                        <i class="bi bi-plus-circle me-1"></i>新增時段
                      </BButton>
                    </div>
                    <div v-else class="text-muted">
                      公休日
                    </div>
                  </td>
                  <td>
                    <BFormCheckbox :id="`isClosed-${day.day}`" v-model="day.isClosed" switch>
                    </BFormCheckbox>
                  </td>
                  <td>
                    <BButton size="sm" variant="outline-danger" @click="removeBusinessDay(index)"
                      v-if="formData.businessHours.length > 1">
                      <i class="bi bi-trash me-1"></i>刪除
                    </BButton>
                  </td>
                </tr>

                <!-- 無營業時間提示 -->
                <tr v-if="formData.businessHours.length === 0">
                  <td colspan="4" class="text-center py-3">
                    <div class="text-muted">尚未設置營業時間</div>
                    <BButton size="sm" variant="primary" class="mt-2" @click="addDefaultBusinessHours">
                      <i class="bi bi-plus-circle me-1"></i>設置預設時間
                    </BButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 店鋪公告區塊 -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3 d-flex justify-content-between">
            <span>店鋪公告</span>
            <BButton size="sm" variant="outline-primary" @click="addAnnouncement">
              <i class="bi bi-plus-circle me-1"></i>新增公告
            </BButton>
          </h6>

          <!-- 公告列表 -->
          <div v-if="formData.announcements.length > 0">
            <div v-for="(announcement, index) in formData.announcements" :key="index" class="card mb-3">
              <div class="card-body">
                <div class="mb-3">
                  <label :for="`announcement-title-${index}`" class="form-label required">公告標題</label>
                  <BFormInput :id="`announcement-title-${index}`" v-model="announcement.title"
                    :state="getAnnouncementError(index, 'title') ? false : null" />
                  <BFormInvalidFeedback v-if="getAnnouncementError(index, 'title')">
                    {{ getAnnouncementError(index, 'title') }}
                  </BFormInvalidFeedback>
                </div>

                <div class="mb-3">
                  <label :for="`announcement-content-${index}`" class="form-label required">公告內容</label>
                  <BFormTextarea :id="`announcement-content-${index}`" v-model="announcement.content"
                    :state="getAnnouncementError(index, 'content') ? false : null" rows="3" />
                  <BFormInvalidFeedback v-if="getAnnouncementError(index, 'content')">
                    {{ getAnnouncementError(index, 'content') }}
                  </BFormInvalidFeedback>
                </div>

                <div class="text-end">
                  <BButton size="sm" variant="outline-danger" @click="removeAnnouncement(index)">
                    <i class="bi bi-trash me-1"></i>刪除公告
                  </BButton>
                </div>
              </div>
            </div>
          </div>

          <!-- 無公告提示 -->
          <div class="alert alert-light text-center py-3" v-else>
            <div class="text-muted">尚未設置店鋪公告</div>
            <BButton size="sm" variant="primary" class="mt-2" @click="addAnnouncement">
              <i class="bi bi-plus-circle me-1"></i>新增公告
            </BButton>
          </div>
        </div>

        <!-- 表單驗證錯誤訊息 -->
        <BAlert :show="formErrors.length > 0" variant="danger">
          <p class="mb-1"><strong><i class="bi bi-exclamation-triangle-fill me-2"></i>請修正以下錯誤：</strong></p>
          <ul class="mb-0 ps-3">
            <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
          </ul>
        </BAlert>

        <!-- 提交結果訊息 -->
        <BAlert :show="!!successMessage" variant="success">
          <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
        </BAlert>

        <!-- 按鈕組 -->
        <div class="d-flex justify-content-between">
          <!-- 左側 - 重置按鈕 -->
          <div>
            <BButton variant="secondary" @click="resetForm" :disabled="isSubmitting">
              <i class="bi bi-arrow-counterclockwise me-1"></i>重置
            </BButton>
          </div>

          <!-- 右側 - 取消和儲存按鈕 -->
          <div>
            <RouterLink :to="`/admin/${brandId}/stores`" class="btn btn-secondary me-2" :disabled="isSubmitting">
              <i class="bi bi-x-circle me-1"></i>取消
            </RouterLink>
            <BButton type="submit" variant="primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-save me-1"></i>
              {{ isSubmitting ? '處理中...' : (isEditMode ? '更新店鋪' : '建立店鋪') }}
            </BButton>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  BButton,
  BFormInput,
  BFormTextarea,
  BFormCheckbox,
  BFormFile,
  BFormInvalidFeedback,
  BFormText,
  BInputGroup,
  BAlert
} from 'bootstrap-vue-next';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 判斷是否為編輯模式
const isEditMode = computed(() => !!route.params.id);

// 從路由中獲取品牌ID
const brandId = computed(() => route.params.brandId);

// 表單數據
const formData = reactive({
  name: '',
  brand: '',
  address: '',
  image: null,   // 現有圖片（編輯模式）
  newImage: null, // 新上傳的圖片
  businessHours: [],
  announcements: [],
  isActive: true
});

// 錯誤訊息
const errors = reactive({
  name: '',
  address: '',
  image: '',
  businessHours: [],
  announcements: []
});

// 狀態
const isSubmitting = ref(false);
const successMessage = ref('');
const formErrors = ref([]);
const fileInputRef = ref(null);


// 星期幾名稱
const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 取得星期幾名稱
const getDayName = (day) => {
  return dayNames[day] || `未知 (${day})`;
};

// 按照星期順序排序的營業時間
const sortedBusinessHours = computed(() => {
  return [...formData.businessHours].sort((a, b) => a.day - b.day);
});

// 檢查時間欄位錯誤
const hasTimeError = (day, periodIndex, field) => {
  const period = day.periods[periodIndex];

  // 檢查格式
  if (!period[field] || !period[field].match(/^\d{2}:\d{2}$/)) {
    return true;
  }

  // 如果是關閉時間，檢查是否晚於開店時間
  if (field === 'close' && period.open && period.close) {
    return period.close <= period.open;
  }

  return false;
};

// 添加營業時段
const addPeriod = (day) => {
  day.periods.push({
    open: '09:00',
    close: '18:00'
  });
};

// 移除營業時段
const removePeriod = (day, periodIndex) => {
  day.periods.splice(periodIndex, 1);
};

// 移除營業日
const removeBusinessDay = (index) => {
  formData.businessHours.splice(index, 1);
};

// 設置預設營業時間 (週一至週五 9-18，週六日休息)
const addDefaultBusinessHours = () => {
  // 先清空現有資料
  formData.businessHours = [];

  // 添加週一至週五
  for (let i = 1; i <= 5; i++) {
    formData.businessHours.push({
      day: i,
      periods: [{
        open: '09:00',
        close: '18:00'
      }],
      isClosed: false
    });
  }

  // 添加週六、週日 (公休)
  formData.businessHours.push({
    day: 6,
    periods: [{
      open: '09:00',
      close: '18:00'
    }],
    isClosed: true
  });

  formData.businessHours.push({
    day: 0,
    periods: [{
      open: '09:00',
      close: '18:00'
    }],
    isClosed: true
  });
};

// 添加公告
const addAnnouncement = () => {
  formData.announcements.push({
    title: '',
    content: ''
  });
};

// 移除公告
const removeAnnouncement = (index) => {
  formData.announcements.splice(index, 1);
};

// 獲取公告錯誤訊息
const getAnnouncementError = (index, field) => {
  if (!errors.announcements || !errors.announcements[index]) {
    return '';
  }
  return errors.announcements[index][field] || '';
};

// 處理圖片上傳
const handleImageChange = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  // 檢查檔案大小 (最大 1MB)
  if (file.size > 1 * 1024 * 1024) {
    errors.image = '圖片大小超過限制，請上傳不超過 1MB 的檔案';
    return;
  }

  // 檢查檔案類型
  if (!file.type.match('image.*')) {
    errors.image = '請上傳有效的圖片檔案（JPG、PNG 格式）';
    return;
  }

  errors.image = '';

  // 直接轉換並儲存base64
  api.image.fileToBase64(file).then(base64 => {
    formData.newImage = base64; // 直接保存base64字符串
  });
};

// 清除圖片
const clearImage = () => {
  formData.newImage = null;

  // 清除檔案輸入框的值
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 重置表單
const resetForm = () => {
  if (isEditMode.value) {
    // 重新獲取店鋪資料
    fetchStoreData();
  } else {
    // 清空表單
    formData.name = '';
    formData.brand = brandId.value;
    formData.address = '';
    formData.image = null;
    formData.businessHours = [];
    formData.announcements = [];
    formData.isActive = true;
  }
  clearImage();

  // 清除錯誤
  errors.name = '';
  errors.image = '';
  errors.businessHours = [];
  errors.announcements = [];
  formErrors.value = [];
  successMessage.value = '';
};

// 驗證表單
const validateForm = () => {
  // 清除先前的錯誤
  errors.name = '';
  errors.address = '';
  errors.businessHours = [];
  errors.announcements = [];
  formErrors.value = [];
  let isValid = true;

  // 驗證店鋪名稱
  if (!formData.name.trim()) {
    errors.name = '店鋪名稱為必填項';
    formErrors.value.push('店鋪名稱為必填項');
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = '店鋪名稱不能超過 50 個字元';
    formErrors.value.push('店鋪名稱不能超過 50 個字元');
    isValid = false;
  }

  // 驗證地址
  if (!formData.address.trim()) {
    errors.address = '店鋪地址為必填項';
    formErrors.value.push('店鋪地址為必填項');
    isValid = false;
  } else if (formData.address.length > 200) {
    errors.address = '店鋪地址不能超過 200 個字元';
    formErrors.value.push('店鋪地址不能超過 200 個字元');
    isValid = false;
  }

  // 驗證圖片
  if (errors.image) {
    formErrors.value.push(errors.image);
    isValid = false;
  } else if (!isEditMode.value && !formData.newImage && !formData.image) {
    errors.image = '請上傳店鋪圖片';
    formErrors.value.push('請上傳店鋪圖片');
    isValid = false;
  } else if (isEditMode.value && !formData.newImage && !formData.image) {
    errors.image = '請上傳店鋪圖片';
    formErrors.value.push('請上傳店鋪圖片');
    isValid = false;
  }

  // 驗證營業時間
  for (let i = 0; i < formData.businessHours.length; i++) {
    const day = formData.businessHours[i];
    if (!day.isClosed) {
      for (let j = 0; j < day.periods.length; j++) {
        const period = day.periods[j];
        // 檢查時間格式和邏輯
        if (!period.open || !period.open.match(/^\d{2}:\d{2}$/)) {
          formErrors.value.push(`${getDayName(day.day)} 的營業時間格式不正確`);
          isValid = false;
        }
        if (!period.close || !period.close.match(/^\d{2}:\d{2}$/)) {
          formErrors.value.push(`${getDayName(day.day)} 的打烊時間格式不正確`);
          isValid = false;
        }
        if (period.open && period.close && period.close <= period.open) {
          formErrors.value.push(`${getDayName(day.day)} 的打烊時間必須晚於開店時間`);
          isValid = false;
        }
      }
    }
  }

  // 驗證公告
  errors.announcements = [];
  for (let i = 0; i < formData.announcements.length; i++) {
    const announcement = formData.announcements[i];
    const announcementErrors = {};

    if (!announcement.title.trim()) {
      announcementErrors.title = '公告標題為必填項';
      formErrors.value.push(`公告 #${i + 1} 標題為必填項`);
      isValid = false;
    } else if (announcement.title.length > 100) {
      announcementErrors.title = '公告標題不能超過 100 個字元';
      formErrors.value.push(`公告 #${i + 1} 標題不能超過 100 個字元`);
      isValid = false;
    }

    if (!announcement.content.trim()) {
      announcementErrors.content = '公告內容為必填項';
      formErrors.value.push(`公告 #${i + 1} 內容為必填項`);
      isValid = false;
    } else if (announcement.content.length > 500) {
      announcementErrors.content = '公告內容不能超過 500 個字元';
      formErrors.value.push(`公告 #${i + 1} 內容不能超過 500 個字元`);
      isValid = false;
    }

    errors.announcements[i] = Object.keys(announcementErrors).length > 0 ? announcementErrors : null;
  }

  return isValid;
};

// 獲取店鋪數據 (編輯模式)
const fetchStoreData = async () => {
  if (!isEditMode.value || !route.params.id) return;

  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: route.params.id });
    if (response && response.store) {
      const store = response.store;
      formData.name = store.name;
      formData.brand = store.brand;
      formData.address = store.address || '';
      formData.image = store.image;

      // 處理營業時間
      formData.businessHours = store.businessHours && store.businessHours.length > 0
        ? store.businessHours
        : [];

      // 確保每天的時段都有正確的結構
      formData.businessHours.forEach(day => {
        if (!day.periods || day.periods.length === 0) {
          day.periods = [{
            open: '09:00',
            close: '18:00'
          }];
        }
      });

      // 處理公告
      formData.announcements = store.announcements && store.announcements.length > 0
        ? store.announcements
        : [];

      formData.isActive = store.isActive !== undefined ? store.isActive : true;
      formData._id = store._id;
    } else {
      // 顯示錯誤訊息
      formErrors.value = ['獲取店鋪資料失敗'];
      setTimeout(() => {
        router.push(`/admin/${brandId.value}/stores`);
      }, 2000);
    }
  } catch (error) {
    console.error('獲取店鋪資料時發生錯誤:', error);
    formErrors.value = ['獲取店鋪資料時發生錯誤，請稍後再試'];
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/stores`);
    }, 2000);
  }
};

// 提交表單
const submitForm = async () => {
  // 清除上一次的成功訊息
  successMessage.value = '';

  if (!validateForm()) {
    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  isSubmitting.value = true;

  try {
    // 設置品牌ID
    formData.brand = brandId.value;

    // 準備提交資料
    const submitData = {
      name: formData.name,
      brand: formData.brand,
      address: formData.address,
      businessHours: formData.businessHours,
      announcements: formData.announcements,
      isActive: formData.isActive
    };

    // 直接使用已轉換的base64圖片，不需要再次轉換
    if (formData.newImage) {
      submitData.imageData = formData.newImage;
    }

    let response;

    if (isEditMode.value) {
      // 更新店鋪
      response = await api.store.updateStore({
        id: route.params.id,
        data: submitData
      });
      successMessage.value = '店鋪更新成功！';
    } else {
      // 創建新店鋪
      response = await api.store.createStore(submitData);
      successMessage.value = '店鋪創建成功！';
    }

    console.log(isEditMode.value ? '店鋪更新成功:' : '店鋪創建成功:', response);

    // 延遲導航，讓用戶看到成功訊息
    setTimeout(() => {
      router.push(`/admin/${brandId.value}/stores`).then(() => {
        // 等待頁面導向完成後再刷新
        window.location.reload();
      });
    }, 1000);
  } catch (error) {
    console.error('儲存店鋪時發生錯誤:', error);

    // 處理 API 錯誤
    if (error.response && error.response.data) {
      const { message, errors: apiErrors } = error.response.data;

      if (apiErrors) {
        // 處理特定欄位錯誤
        Object.keys(apiErrors).forEach(key => {
          errors[key] = apiErrors[key];
          formErrors.value.push(apiErrors[key]);
        });
      } else if (message) {
        // 顯示一般錯誤訊息
        formErrors.value = [`錯誤: ${message}`];
      }
    } else {
      formErrors.value = ['儲存店鋪時發生未知錯誤，請稍後再試'];
    }

    // 滾動到頁面頂部顯示錯誤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    isSubmitting.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  // 如果是編輯模式，獲取店鋪資料
  if (isEditMode.value) {
    fetchStoreData();
  }
});
</script>

<style scoped>
/* 必填欄位標記 */
.required::after {
  content: " *";
  color: #dc3545;
}

/* 表單樣式增強 */
.form-control:focus,
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-text {
  font-size: 0.875rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/* 時間輸入組件 */
.time-input-group {
  min-width: 100px;
}

/* 提交按鈕效果 */
.btn-primary {
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0.25rem 0.5rem rgba(13, 110, 253, 0.3);
}
</style>
