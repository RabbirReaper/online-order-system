<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1">{{ storeName || '記帳管理' }}</h4>
        <small class="text-muted">店鋪記帳系統</small>
      </div>
      <router-link :to="`/admin/${brandId}/cash-flow`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i>返回店鋪選擇
      </router-link>
    </div>

    <!-- 導航選項卡 -->
    <div class="card mb-4">
      <div class="card-header bg-light">
        <ul class="nav nav-pills card-header-pills">
          <li class="nav-item">
            <router-link
              :to="`/admin/${brandId}/cash-flow/${storeId}/show`"
              class="nav-link"
              active-class="active"
            >
              <i class="bi bi-list-ul me-2"></i>記帳記錄
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/admin/${brandId}/cash-flow/${storeId}/create`"
              class="nav-link"
              active-class="active"
            >
              <i class="bi bi-plus-circle me-2"></i>新增記帳
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/admin/${brandId}/cash-flow/${storeId}/category`"
              class="nav-link"
              active-class="active"
            >
              <i class="bi bi-tags me-2"></i>分類管理
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/admin/${brandId}/cash-flow/${storeId}/statistics`"
              class="nav-link"
              active-class="active"
            >
              <i class="bi bi-bar-chart me-2"></i>統計報表
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- 子頁面內容 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

// 路由
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const storeName = ref('')

// 獲取店鋪資訊
const fetchStoreInfo = async () => {
  try {
    const response = await api.store.getStoreById({ brandId: brandId.value, id: storeId.value })
    storeName.value = response.store.name || '未知店鋪'
  } catch (err) {
    console.error('獲取店鋪資訊失敗:', err)
    storeName.value = '未知店鋪'
  }
}

// 生命週期
onMounted(() => {
  fetchStoreInfo()
})
</script>

<style scoped>
.nav-link {
  color: #6c757d;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
}

.nav-link:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.nav-link.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: #fff;
}

.nav-link.active:hover {
  background-color: #0b5ed7;
  border-color: #0b5ed7;
}

.card-header {
  border-bottom: 1px solid #dee2e6;
}

.main-content {
  min-height: 400px;
}
</style>
