<template>
  <div ref="navContainer" class="category-navigator">
    <div class="category-nav-wrapper" ref="navWrapper">
      <nav class="nav nav-pills category-nav-custom" ref="categoryNav">
        <a v-for="category in categories" :key="category.categoryId" class="nav-link nav-link-custom"
          :class="{ 'active': activeCategory === category.categoryId }" :href="'#category-' + category.categoryId"
          @click.prevent="scrollToCategory(category.categoryId)">
          {{ category.categoryName }}
        </a>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
});

const navContainer = ref(null);
const navWrapper = ref(null);
const categoryNav = ref(null);
const activeCategory = ref('');
const observer = ref(null);
const scrollHandler = ref(null);

// 滾動到指定類別
const scrollToCategory = (categoryId) => {
  const element = document.getElementById('category-' + categoryId);
  if (element) {
    // 考慮頂部固定導航欄的高度
    const navHeight = navContainer.value?.offsetHeight || 0;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = rect.top + scrollTop - navHeight - 10; // 10px 緩衝

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // 更新激活狀態
    activeCategory.value = categoryId;

    // 立即滾動導航欄到當前項目
    setTimeout(() => {
      scrollNavToActiveItem();
    }, 100);
  }
};

// 設置滾動監聽
const setupScrollSpy = () => {
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('category-', '');
          activeCategory.value = id;
          scrollNavToActiveItem();
        }
      });
    },
    {
      rootMargin: '-50px 0px -50% 0px',
      threshold: 0
    }
  );

  props.categories.forEach(category => {
    const element = document.getElementById('category-' + category.categoryId);
    if (element) {
      observer.value.observe(element);
    }
  });

  if (props.categories.length > 0) {
    activeCategory.value = props.categories[0].categoryId;
  }
};

// 滾動導航欄到活躍項目
const scrollNavToActiveItem = () => {
  if (!navWrapper.value) return;

  const activeItem = navWrapper.value.querySelector('.nav-link-custom.active');
  if (!activeItem) return;

  const navRect = navWrapper.value.getBoundingClientRect();
  const activeItemOffsetLeft = activeItem.offsetLeft;
  const activeItemWidth = activeItem.offsetWidth;
  const navWidth = navRect.width;

  // 計算理想的滾動位置（將活躍項目置於中央）
  const idealScrollLeft = activeItemOffsetLeft - (navWidth / 2) + (activeItemWidth / 2);

  // 邊界檢查
  const maxScrollLeft = navWrapper.value.scrollWidth - navWidth;
  const targetScrollLeft = Math.max(0, Math.min(idealScrollLeft, maxScrollLeft));

  // 平滑滾動到目標位置
  navWrapper.value.scrollTo({
    left: targetScrollLeft,
    behavior: 'smooth'
  });
};

// 設置粘性導航
const setupStickyNav = () => {
  if (!navContainer.value) return;

  const stickyOffset = navContainer.value.offsetTop;

  scrollHandler.value = () => {
    if (window.pageYOffset >= stickyOffset) {
      navContainer.value.classList.add('sticky');
    } else {
      navContainer.value.classList.remove('sticky');
    }
  };

  window.addEventListener('scroll', scrollHandler.value);
};

onMounted(async () => {
  await nextTick();
  setupStickyNav();
  setupScrollSpy();

  if (props.categories.length > 0) {
    setTimeout(() => {
      scrollNavToActiveItem();
    }, 300);
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }

  if (scrollHandler.value) {
    window.removeEventListener('scroll', scrollHandler.value);
  }
});
</script>

<style scoped>
.category-navigator {
  position: relative;
  z-index: 100;
  background-color: #fff;
}

.category-nav-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 0;

  /* 自定義滾動條樣式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(211, 84, 0, 0.3) transparent;
}

/* Webkit 滾動條樣式 */
.category-nav-wrapper::-webkit-scrollbar {
  height: 4px;
}

.category-nav-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.category-nav-wrapper::-webkit-scrollbar-thumb {
  background-color: rgba(211, 84, 0, 0.3);
  border-radius: 2px;
}

.category-nav-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: rgba(211, 84, 0, 0.5);
}

/* 重寫 Bootstrap nav 樣式實現橫向滾動 */
.category-nav-custom {
  display: flex !important;
  flex-wrap: nowrap !important;
  flex-direction: row !important;
  justify-content: flex-start !important;
  min-width: max-content;
  padding: 0 1rem;
  margin-bottom: 0;
  list-style: none;
}

.nav-link-custom {
  display: inline-block !important;
  flex: 0 0 auto !important;
  padding: 0.75rem 1.25rem !important;
  margin-right: 0.5rem;
  color: #555 !important;
  font-weight: 600;
  font-size: 0.95rem;
  background-color: transparent !important;
  border: 2px solid transparent !important;
  border-radius: 25px !important;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-decoration: none !important;
  cursor: pointer;
  min-width: max-content;
}

.nav-link-custom:hover {
  color: #d35400 !important;
  background-color: rgba(211, 84, 0, 0.1) !important;
  border-color: rgba(211, 84, 0, 0.2) !important;
  text-decoration: none !important;
}

.nav-link-custom.active {
  color: #fff !important;
  background-color: #d35400 !important;
  border-color: #d35400 !important;
}

.sticky {
  position: sticky;
  top: 0;
  width: 100%;
  max-width: 736px;
  background-color: #fff;
  z-index: 1050;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sticky .nav-link-custom {
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

/* 響應式調整 */
@media (max-width: 576px) {
  .nav-link-custom {
    padding: 0.6rem 1rem !important;
    font-size: 0.9rem;
    margin-right: 0.25rem;
  }

  .category-nav-wrapper::-webkit-scrollbar {
    height: 3px;
  }

  .category-nav-custom {
    padding: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .nav-link-custom {
    padding: 0.5rem 0.8rem !important;
    font-size: 0.85rem;
  }

  .category-nav-custom {
    padding: 0 0.25rem;
  }
}

/* 為觸控設備增加滑動提示 */
@media (hover: none) and (pointer: coarse) {
  .category-nav-wrapper::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.8), transparent);
    pointer-events: none;
    z-index: 1;
  }
}

/* 確保在所有裝置上都能正確顯示橫向滾動 */
.category-nav-custom>* {
  flex-shrink: 0;
}
</style>
