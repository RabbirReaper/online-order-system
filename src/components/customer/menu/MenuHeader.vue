<template>
  <div class="menu-header">
    <!-- 店家圖片 -->
    <div class="store-banner" :style="bannerStyle">
      <div class="banner-overlay"></div>
    </div>

    <!-- 店家信息 -->
    <div class="container position-relative">
      <div class="store-info-card">
        <div v-if="isLoading" class="text-center py-3">
          <BSpinner variant="primary" label="載入中..."></BSpinner>
        </div>
        <template v-else-if="store">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h1 class="store-name">{{ store.name }}</h1>
            <span class="store-status badge" :class="isOpen ? 'bg-success' : 'bg-danger'">
              {{ isOpen ? '營業中' : '已打烊' }}
            </span>
          </div>

          <!-- 店家公告 -->
          <div v-if="store.announcements && store.announcements.length > 0" class="store-announcements mb-3">
            <div class="announcement-wrapper">
              <div class="announcement-container">
                <i class="bi bi-megaphone-fill text-primary me-2"></i>
                <div class="announcement-content">
                  <span v-for="(announcement, index) in store.announcements" :key="index">
                    {{ announcement.content }}
                    <span v-if="index < store.announcements.length - 1" class="mx-2">|</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 營業時間摘要 -->
          <div class="store-business-hours d-flex align-items-center" @click="$emit('view-hours')">
            <i class="bi bi-clock me-2"></i>
            <span class="me-2">
              {{ isOpen ? '今日營業至 ' + todayClosingTime : '查看營業時間' }}
            </span>
            <i class="bi bi-chevron-right"></i>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定義 props
const props = defineProps({
  store: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

// 定義 emits
const emit = defineEmits(['view-hours']);

// 計算店家圖片背景樣式
const bannerStyle = computed(() => {
  if (props.store && props.store.image && props.store.image.url) {
    return {
      backgroundImage: `url(${props.store.image.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }

  return {
    backgroundColor: '#e9ecef'
  };
});

// 計算今日營業結束時間
const todayClosingTime = computed(() => {
  if (!props.store || !props.store.businessHours || !props.isOpen) return '';

  const today = new Date().getDay();
  const todayHours = props.store.businessHours.find(hours => hours.day === today);

  if (!todayHours || todayHours.isClosed || !todayHours.periods || todayHours.periods.length === 0) {
    return '';
  }

  // 找出今天的最後一個營業時段的結束時間
  let latestClosingTime = '';

  todayHours.periods.forEach(period => {
    if (!latestClosingTime || period.close > latestClosingTime) {
      latestClosingTime = period.close;
    }
  });

  return latestClosingTime;
});
</script>

<style scoped>
.store-banner {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
}

.store-info-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-top: -50px;
  position: relative;
  z-index: 10;
}

.store-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.store-status {
  font-size: 0.8rem;
  padding: 5px 10px;
}

.store-announcements {
  background-color: rgba(13, 110, 253, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
}

.announcement-wrapper {
  overflow: hidden;
}

.announcement-container {
  display: flex;
  align-items: center;
}

.announcement-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-business-hours {
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  padding: 5px 0;
}

.store-business-hours:hover {
  color: #0d6efd;
}
</style>
