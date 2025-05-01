<template>
  <div class="container-fluid p-0 vh-100 overflow-hidden">
    <div class="row g-0 vh-100">
      <!-- 側邊欄 -->
      <aside class="col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse">
        <div class="d-flex flex-column h-100">
          <div class="sidebar-header p-3 d-flex align-items-center">
            <img src="@/assets/logo.svg" alt="Logo" class="me-2" width="32" height="32" />
            <h1 class="h5 mb-0 text-white">系統總管理</h1>
          </div>

          <nav class="pt-2 pb-2 flex-grow-1">
            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>品牌管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'brand-list' }">
                    <i class="bi bi-list-ul me-2"></i>
                    品牌列表
                  </router-link>
                </li>
                <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'brand-create' }">
                    <i class="bi bi-plus-circle me-2"></i>
                    新增品牌
                  </router-link>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>管理員管理</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'admin-list' }">
                    <i class="bi bi-people me-2"></i>
                    管理員列表
                  </router-link>
                </li>
                <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'admin-create' }">
                    <i class="bi bi-person-plus me-2"></i>
                    新增管理員
                  </router-link>
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <h6 class="sidebar-heading px-3 mt-4 mb-1 text-muted">
                <span>系統設置</span>
              </h6>
              <ul class="nav flex-column">
                <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'system-settings' }">
                    <i class="bi bi-gear me-2"></i>
                    系統設置
                  </router-link>
                </li>
                <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'account-settings' }">
                    <i class="bi bi-person-gear me-2"></i>
                    帳號設置
                  </router-link>
                </li>
              </ul>
            </div>
          </nav>

          <div class="border-top p-3">
            <button class="btn btn-danger w-100" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-2"></i>
              登出系統
            </button>
          </div>
        </div>
      </aside>

      <!-- 主要內容區 -->
      <main class="col-md-9 col-lg-10 ms-sm-auto px-md-3 overflow-auto">
        <div
          class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h2>{{ getPageTitle() }}</h2>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
              data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle me-1"></i>
              系統管理員
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
              <li>
                <h6 class="dropdown-header">系統管理員</h6>
              </li>
              <li><router-link class="dropdown-item" :to="{ name: 'account-settings' }">設置</router-link></li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">登出</a></li>
            </ul>
          </div>
        </div>

        <div class="content">
          <!-- 使用 router-view 取代動態組件 -->
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';

// 路由
const router = useRouter();
const route = useRoute();

// 根據當前路由返回對應的頁面標題
const getPageTitle = () => {
  const routeName = route.name;
  switch (routeName) {
    case 'brand-list': return '品牌列表';
    case 'brand-create': return '新增品牌';
    case 'brand-edit': return '編輯品牌';
    case 'brand-detail': return '品牌詳情';
    case 'admin-list': return '管理員列表';
    case 'admin-create': return '新增管理員';
    case 'system-settings': return '系統設置';
    case 'account-settings': return '帳號設置';
    default: return '品牌列表';
  }
};

// 處理登出
const handleLogout = async () => {
  try {
    await api.auth.logout();
    router.push('/admin/login');
  } catch (error) {
    console.error('登出失敗', error);
    router.push('/admin/login');
  }
};

onMounted(() => {
  // 監聽頁面變更事件
  window.addEventListener('change-page', (event) => {
    if (event.detail && event.detail.name) {
      router.push({ name: event.detail.name, params: event.detail.params || {} });
    }
  });
});
</script>

<style scoped>
/* Bootstrap 5 已經提供了大部分樣式，只需添加一些自定義樣式 */
.sidebar {
  background-color: #212529;
}

.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  margin: 0.2rem 0;
  border-radius: 0.25rem;
}

.nav-link:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: #fff;
  background-color: #0d6efd;
}

.content {
  padding: 1rem;
  min-height: calc(100vh - 70px);
}

/* 確保側邊欄在移動設備上可折疊 */
@media (max-width: 767.98px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
  }

  .sidebar.show {
    transform: translateX(0);
  }
}
</style>
