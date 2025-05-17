<template>
  <div class="dish-detail-view">
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
        </div>

        <!-- Image -->
        <div class="image-container" style="height: 240px; overflow: hidden; position: relative;">
          <img :src="dish.image && dish.image.url ? dish.image.url : '/placeholder.jpg'" :alt="dish.name"
            class="w-100 h-100" style="object-fit: cover;">
        </div>

        <!-- Item name and price -->
        <div class="p-3 border-bottom">
          <h3 class="mb-2">{{ dish.name }}</h3>
          <p class="text-danger fw-bold mb-2 fs-4">${{ dish.basePrice }}</p>
          <p class="text-muted fs-5" style="white-space: pre-line">{{ dish.description }}</p>
        </div>

        <OptionSelector :dish="dish" :option-categories="optionCategories" @add-to-cart="addToCart" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import OptionSelector from '@/components/customer/dishDetail/OptionSelector.vue';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const { brandId, storeId, dishId } = route.params;

const dish = ref({});
const optionCategories = ref([]);
const isLoading = ref(true);

const loadDishData = async () => {
  try {
    // 獲取餐點詳情
    const dishData = await api.dish.getDishTemplateById({ brandId, id: dishId });
    if (dishData && dishData.success) {
      dish.value = dishData.template; // 修改這裡：使用 template 而不是 data
      console.log('Loaded dish data:', dishData);

      // 其餘代碼不變...
    }
  } catch (error) {
    console.error('無法載入餐點詳情:', error);
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};

const addToCart = (dishInstance) => {
  cartStore.addItem(dishInstance);
  router.push({
    name: 'menu',
    params: { brandId, storeId }
  });
};

onMounted(async () => {
  await loadDishData();
});
</script>

<style scoped>
.dish-detail-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.container-wrapper {
  max-width: 540px;
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

@media (max-width: 576px) {
  .container-wrapper {
    max-width: 100%;
  }
}
</style>
