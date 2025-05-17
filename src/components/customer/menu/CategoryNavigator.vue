<template>
  <div ref="navContainer" class="category-navigator">
    <div class="category-nav-wrapper">
      <nav class="navbar navbar-expand-lg navbar-light bg-light p-0">
        <div class="container-fluid p-0">
          <ul class="navbar-nav category-nav" ref="categoryNav">
            <li class="nav-item" v-for="(category, index) in categories" :key="index">
              <a class="nav-link" :class="{ active: activeCategory === category.categoryId }"
                :href="'#category-' + category.categoryId" @click.prevent="scrollToCategory(category.categoryId)">
                {{ category.categoryName }}
              </a>
            </li>
          </ul>
        </div>
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
const categoryNav = ref(null);
const activeCategory = ref('');
const observer = ref(null);
const scrollHandler = ref(null);

// 滾動到指定類別
const scrollToCategory = (categoryId) => {
  const element = document.getElementById('category-' + categoryId);
  if (element) {
    // 考慮頂部固定導航欄的高度
    const navHeight = navContainer.value.offsetHeight;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = rect.top + scrollTop - navHeight - 10; // 10px 緩衝

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // 更新激活狀態
    activeCategory.value = categoryId;
  }
};

// 設置滾動監聽
const setupScrollSpy = () => {
  // 創建 IntersectionObserver 實例
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        // 當元素進入視口時
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('category-', '');
          activeCategory.value = id;

          // 滾動導航欄以顯示當前活躍項目
          scrollNavToActiveItem();
        }
      });
    },
    {
      rootMargin: '-50px 0px -50% 0px',  // 元素頂部進入視口的 50px 內會觸發
      threshold: 0
    }
  );

  // 為每個類別添加觀察
  props.categories.forEach(category => {
    const element = document.getElementById('category-' + category.categoryId);
    if (element) {
      observer.value.observe(element);
    }
  });

  // 初始化時設置第一個類別為活躍
  if (props.categories.length > 0) {
    activeCategory.value = props.categories[0].categoryId;
  }
};

// 當激活類別變化時，滾動導航欄以確保激活項目可見
const scrollNavToActiveItem = () => {
  if (!categoryNav.value) return;

  const activeItem = categoryNav.value.querySelector('.nav-link.active');
  if (activeItem) {
    const navRect = categoryNav.value.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();

    // 檢查項目是否在視口中
    if (activeRect.left < navRect.left || activeRect.right > navRect.right) {
      // 計算滾動位置，使項目居中
      categoryNav.value.scrollLeft = activeItem.offsetLeft - (navRect.width / 2) + (activeRect.width / 2);
    }
  }
};

// 設置粘性導航
const setupStickyNav = () => {
  if (!navContainer.value) return;

  const stickyOffset = navContainer.value.offsetTop;

  // 滾動處理函數
  scrollHandler.value = () => {
    if (window.pageYOffset >= stickyOffset) {
      navContainer.value.classList.add('sticky');
    } else {
      navContainer.value.classList.remove('sticky');
    }
  };

  // 添加滾動事件監聽
  window.addEventListener('scroll', scrollHandler.value);
};

onMounted(async () => {
  // 等待 DOM 更新
  await nextTick();

  // 設置粘性導航和滾動監聽
  setupStickyNav();
  setupScrollSpy();
});

onUnmounted(() => {
  // 清理所有監聽
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
  overflow-x: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-nav {
  display: flex;
  overflow-x: auto;
  margin: 0;
  padding: 0;
  white-space: nowrap;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

/* Hide scrollbar for Chrome, Safari and Opera */
.category-nav::-webkit-scrollbar {
  display: none;
}

.category-nav .nav-item {
  display: inline-block;
}

.category-nav .nav-link {
  padding: 1rem 1.2rem;
  color: #555;
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.category-nav .nav-link:hover {
  color: #d35400;
}

.category-nav .nav-link.active {
  color: #d35400;
  border-bottom: 3px solid #d35400;
}

.sticky {
  position: sticky;
  top: 0;
  width: 100%;
  max-width: 540px;
  background-color: #fff;
  z-index: 99;
}
</style>
