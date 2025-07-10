<template>
  <div class="bundle-detail-view">
    <div class="container-wrapper">
      <div v-if="isLoading" class="loading-container d-flex justify-content-center align-items-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="detail-container">
        <div class="header d-flex align-items-center p-3 position-absolute top-0 start-0 w-100 bg-transparent"
          style="z-index: 10;">
          <button class="btn btn-sm rounded-circle shadow" @click="goBack"
            style="background-color: rgba(255, 255, 255, 0.8); width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
            <i class="bi bi-arrow-left fs-3"></i>
          </button>
          <h5 class="ms-3 mb-0 text-white" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
            商品詳情
          </h5>
        </div>

        <!-- Bundle Image -->
        <div class="image-container" style="height: 240px; overflow: hidden; position: relative;">
          <img :src="bundleImage" :alt="bundle.name" class="w-100 h-100" style="object-fit: cover;">
        </div>

        <!-- Bundle Info -->
        <div class="p-3 border-bottom">
          <h3 class="mb-2">{{ bundle.name }}</h3>

          <!-- 價格顯示 -->
          <div class="price-section mb-3">
            <!-- 現金價格 -->
            <div v-if="bundle.cashPrice?.original" class="price-item">
              <div class="price-current text-danger fw-bold fs-4">${{ bundle.cashPrice.original }}</div>
            </div>

            <!-- 點數價格 -->
            <div v-if="bundle.pointPrice?.original !== undefined" class="price-item mt-2">
              <div class="point-price text-primary fw-bold fs-5">{{ bundle.pointPrice.original }} 點數</div>
            </div>
          </div>

          <p class="text-muted fs-5" style="white-space: pre-line">{{ bundle.description }}</p>

          <!-- 有效期限 -->
          <div v-if="bundle.voucherValidityDays" class="validity-section mt-3 p-2 bg-light rounded">
            <i class="bi bi-calendar-check text-success me-2"></i>
            <span class="text-success fw-bold">有效期限：購買後 {{ bundle.voucherValidityDays }} 天內使用</span>
          </div>
        </div>

        <!-- Bundle Items -->
        <div class="bundle-items p-3">
          <h5 class="mb-3 fw-bold">購買內容</h5>

          <div v-if="bundle.bundleItems && bundle.bundleItems.length > 0" class="items-list">
            <div v-for="(bundleItem, index) in bundle.bundleItems" :key="index" class="bundle-item-card mb-3">
              <div class="d-flex align-items-center">
                <div class="item-icon me-3">
                  <i class="bi bi-ticket-perforated-fill text-warning fs-4"></i>
                </div>

                <div class="item-info flex-grow-1">
                  <h6 class="mb-1 fw-bold">{{ bundleItem.voucherName }}</h6>
                  <div class="item-meta">
                    <span class="badge bg-warning text-dark">
                      兌換券
                    </span>
                    <span class="ms-2 text-muted">x{{ bundleItem.quantity }}</span>
                  </div>

                  <!-- 兌換商品資訊 -->
                  <div v-if="bundleItem.voucherTemplate?.exchangeDishTemplate"
                    class="exchange-info mt-2 p-2 bg-light rounded">
                    <small class="text-muted">可兌換：</small>
                    <div class="d-flex align-items-center mt-1">
                      <img v-if="bundleItem.voucherTemplate.exchangeDishTemplate.image?.url"
                        :src="bundleItem.voucherTemplate.exchangeDishTemplate.image.url"
                        :alt="bundleItem.voucherTemplate.exchangeDishTemplate.name" class="exchange-dish-image me-2">
                      <div>
                        <div class="fw-bold">{{ bundleItem.voucherTemplate.exchangeDishTemplate.name }}</div>
                        <small class="text-muted">{{ bundleItem.voucherTemplate.exchangeDishTemplate.description
                        }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted py-4">
            <i class="bi bi-box-seam fs-1 opacity-50"></i>
            <p class="mt-2">此商品尚未設定內容</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section p-3 bg-light">
          <div class="row g-2">
            <div class="col">
              <button class="btn btn-outline-primary w-100" @click="addToCartCash"
                :disabled="!bundle.cashPrice?.original || isAddingToCart">
                <i class="bi bi-cash-stack me-2"></i>
                現金購買 ${{ bundle.cashPrice?.original }}
              </button>
            </div>

            <div v-if="bundle.pointPrice?.original !== undefined" class="col">
              <button class="btn btn-primary w-100" @click="addToCartPoints" :disabled="isAddingToCart">
                <i class="bi bi-star-fill me-2"></i>
                點數兌換 {{ bundle.pointPrice.original }}點
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const brandId = computed(() => route.params.brandId);
const storeId = computed(() => route.params.storeId);
const bundleId = computed(() => route.params.bundleId);

const bundle = ref({});
const isLoading = ref(true);
const isAddingToCart = ref(false);

const bundleImage = computed(() => {
  return bundle.value?.image?.url || '/placeholder.jpg';
});

const loadBundleData = async () => {
  try {
    console.log('載入商品詳情:', bundleId.value);

    // 使用真實 API 調用
    const response = await api.bundle.getBundleById({
      brandId: brandId.value,
      id: bundleId.value
    });

    if (response.success) {
      bundle.value = response.bundle;
    } else {
      throw new Error('無法載入商品詳情');
    }

  } catch (error) {
    console.error('無法載入商品詳情:', error);
    // 可以顯示錯誤訊息給用戶
    alert('載入商品詳情失敗，請稍後再試');
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};

const addToCartCash = async () => {
  if (isAddingToCart.value || !bundle.value.cashPrice?.original) return;

  isAddingToCart.value = true;

  try {
    // 創建符合 cartStore.addItem 期望格式的套餐購物車項目
    const bundleCartItem = {
      dishInstance: {
        templateId: bundle.value._id,
        name: bundle.value.name,
        basePrice: bundle.value.cashPrice.original,
        finalPrice: bundle.value.cashPrice.original,
        options: [], // 套餐沒有選項
        bundleType: 'cash' // 標記為現金購買套餐
      },
      quantity: 1,
      note: '',
      subtotal: bundle.value.cashPrice.original
    };

    cartStore.addItem(bundleCartItem);

    // 返回菜單頁面
    router.push({
      name: 'menu',
      params: {
        brandId: brandId.value,
        storeId: storeId.value
      }
    });

  } catch (error) {
    console.error('加入購物車失敗:', error);
    alert('加入購物車失敗，請稍後再試');
  } finally {
    isAddingToCart.value = false;
  }
};

const addToCartPoints = async () => {
  if (isAddingToCart.value) return;

  isAddingToCart.value = true;

  try {
    // 創建點數兌換套餐購物車項目
    const bundleCartItem = {
      dishInstance: {
        templateId: bundle.value._id,
        name: `${bundle.value.name} (點數兌換)`,
        basePrice: 0, // 點數兌換價格為0
        finalPrice: 0,
        options: [],
        bundleType: 'points', // 標記為點數兌換套餐
        pointCost: bundle.value.pointPrice.original
      },
      quantity: 1,
      note: '點數兌換商品',
      subtotal: 0 // 點數兌換不計入現金小計
    };

    cartStore.addItem(bundleCartItem);

    // 返回菜單頁面
    router.push({
      name: 'menu',
      params: {
        brandId: brandId.value,
        storeId: storeId.value
      }
    });

  } catch (error) {
    console.error('加入購物車失敗:', error);
    alert('加入購物車失敗，請稍後再試');
  } finally {
    isAddingToCart.value = false;
  }
};

onMounted(async () => {
  await loadBundleData();
});
</script>

<style scoped>
.bundle-detail-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 736px;
  width: 100%;
  background-color: white;
  min-height: 100vh;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.loading-container {
  min-height: 100vh;
}

.detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.bundle-type-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.price-section {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.point-price {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.point-price::before {
  content: '★';
  color: #ffc107;
}

.validity-section {
  border-left: 4px solid #198754;
}

.bundle-items {
  flex-grow: 1;
}

.bundle-item-card {
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.bundle-item-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 50%;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.exchange-info {
  border-left: 3px solid #ffc107;
}

.exchange-dish-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
}

.action-section {
  border-top: 1px solid #e9ecef;
  position: sticky;
  bottom: 0;
  background-color: #f8f9fa !important;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }

  .price-section {
    padding: 0.75rem;
  }

  .bundle-item-card {
    padding: 0.75rem;
  }

  .item-icon {
    width: 40px;
    height: 40px;
  }

  .exchange-dish-image {
    width: 32px;
    height: 32px;
  }
}
</style>
