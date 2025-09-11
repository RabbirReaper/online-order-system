<template>
  <div>
    <!-- 頁面標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1">記帳分類管理</h4>
        <small class="text-muted">{{ storeName || '記帳分類設定' }}</small>
      </div>
      <router-link 
        :to="`/admin/${brandId}/cash-flow/${storeId}/show`" 
        class="btn btn-outline-secondary"
      >
        <i class="bi bi-arrow-left me-1"></i>返回記帳管理
      </router-link>
    </div>

    <!-- 新增分類 -->
    <div class="card mb-4">
      <div class="card-header">
        <h6 class="card-title mb-0">新增分類</h6>
      </div>
      <div class="card-body">
        <form @submit.prevent="addCategory" class="row g-3">
          <div class="col-md-3">
            <label class="form-label">分類名稱</label>
            <input 
              type="text" 
              class="form-control"
              v-model="newCategory.name"
              placeholder="請輸入分類名稱"
              required
            />
          </div>
          <div class="col-md-3">
            <label class="form-label">類型</label>
            <select class="form-select" v-model="newCategory.type" required>
              <option value="">請選擇</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">&nbsp;</label>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-plus me-1"></i>新增
              </button>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">&nbsp;</label>
            <div class="d-grid">
              <button 
                type="button" 
                class="btn btn-outline-info"
                @click="addDefaultCategories"
              >
                <i class="bi bi-magic me-1"></i>新增預設類別
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- 分類列表 -->
    <div class="row">
      <!-- 收入分類 -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h6 class="card-title mb-0">
              <i class="bi bi-arrow-up-circle me-2"></i>收入分類 ({{ incomeCategories.length }})
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <div 
                v-for="category in incomeCategories" 
                :key="category.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div class="flex-grow-1" v-if="!category.editing">
                  <div class="fw-medium">{{ category.name }}</div>
                </div>
                
                <!-- 編輯模式 -->
                <div class="flex-grow-1" v-else>
                  <input 
                    type="text" 
                    class="form-control form-control-sm"
                    v-model="category.editName"
                  />
                </div>

                <!-- 操作按鈕 -->
                <div class="btn-group btn-group-sm ms-2" v-if="!category.editing">
                  <button 
                    class="btn btn-outline-primary" 
                    @click="startEdit(category)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button 
                    class="btn btn-outline-danger" 
                    @click="deleteCategory(category)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                
                <!-- 編輯按鈕 -->
                <div class="btn-group btn-group-sm ms-2" v-else>
                  <button 
                    class="btn btn-success" 
                    @click="saveEdit(category)"
                  >
                    <i class="bi bi-check"></i>
                  </button>
                  <button 
                    class="btn btn-secondary" 
                    @click="cancelEdit(category)"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
              
              <!-- 無資料提示 -->
              <div class="list-group-item text-center py-4" v-if="incomeCategories.length === 0">
                <i class="bi bi-inbox text-muted fs-4"></i>
                <p class="text-muted mt-2 mb-0">尚無收入分類</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 支出分類 -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-danger text-white">
            <h6 class="card-title mb-0">
              <i class="bi bi-arrow-down-circle me-2"></i>支出分類 ({{ expenseCategories.length }})
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <div 
                v-for="category in expenseCategories" 
                :key="category.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div class="flex-grow-1" v-if="!category.editing">
                  <div class="fw-medium">{{ category.name }}</div>
                </div>
                
                <!-- 編輯模式 -->
                <div class="flex-grow-1" v-else>
                  <input 
                    type="text" 
                    class="form-control form-control-sm"
                    v-model="category.editName"
                  />
                </div>

                <!-- 操作按鈕 -->
                <div class="btn-group btn-group-sm ms-2" v-if="!category.editing">
                  <button 
                    class="btn btn-outline-primary" 
                    @click="startEdit(category)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button 
                    class="btn btn-outline-danger" 
                    @click="deleteCategory(category)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                
                <!-- 編輯按鈕 -->
                <div class="btn-group btn-group-sm ms-2" v-else>
                  <button 
                    class="btn btn-success" 
                    @click="saveEdit(category)"
                  >
                    <i class="bi bi-check"></i>
                  </button>
                  <button 
                    class="btn btn-secondary" 
                    @click="cancelEdit(category)"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
              
              <!-- 無資料提示 -->
              <div class="list-group-item text-center py-4" v-if="expenseCategories.length === 0">
                <i class="bi bi-inbox text-muted fs-4"></i>
                <p class="text-muted mt-2 mb-0">尚無支出分類</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 路由
const route = useRoute()
const brandId = computed(() => route.params.brandId)
const storeId = computed(() => route.params.storeId)

// 狀態
const categories = ref([])
const storeName = ref('')

// 新增分類表單
const newCategory = ref({
  name: '',
  type: ''
})

// 模擬店鋪資料
const mockStores = {
  'store1': '台北分店',
  'store2': '台中分店', 
  'store3': '高雄分店'
}

// 模擬分類資料
const mockCategories = [
  { id: '1', name: '食材採購', type: 'expense' },
  { id: '2', name: '租金', type: 'expense' },
  { id: '3', name: '水電費', type: 'expense' },
  { id: '4', name: '人事費用', type: 'expense' },
  { id: '5', name: '設備維護', type: 'expense' },
  { id: '6', name: '餐點銷售', type: 'income' },
  { id: '7', name: '外送收入', type: 'income' },
  { id: '8', name: '其他收入', type: 'income' }
]

// 計算屬性
const incomeCategories = computed(() => 
  categories.value.filter(category => category.type === 'income')
)

const expenseCategories = computed(() => 
  categories.value.filter(category => category.type === 'expense')
)

// 方法
const fetchData = async () => {
  try {
    // 使用假資料
    categories.value = mockCategories.map(category => ({
      ...category,
      editing: false,
      editName: category.name
    }))
    storeName.value = mockStores[storeId.value] || '未知店鋪'
  } catch (err) {
    console.error('獲取資料失敗:', err)
  }
}

const addCategory = () => {
  if (!newCategory.value.name || !newCategory.value.type) {
    alert('請填寫分類名稱和類型')
    return
  }
  
  const category = {
    id: Date.now().toString(),
    name: newCategory.value.name,
    type: newCategory.value.type,
    editing: false,
    editName: newCategory.value.name
  }
  
  categories.value.push(category)
  
  // 重置表單
  newCategory.value = {
    name: '',
    type: ''
  }
  
  console.log('新增分類:', category)
}

const startEdit = (category) => {
  category.editing = true
  category.editName = category.name
}

const saveEdit = (category) => {
  if (!category.editName) {
    alert('分類名稱不能為空')
    return
  }
  
  category.name = category.editName
  category.editing = false
  
  console.log('更新分類:', category)
}

const cancelEdit = (category) => {
  category.editing = false
  category.editName = category.name
}

const deleteCategory = (category) => {
  if (confirm(`確定要刪除分類「${category.name}」嗎？`)) {
    const index = categories.value.findIndex(c => c.id === category.id)
    if (index > -1) {
      categories.value.splice(index, 1)
      console.log('刪除分類:', category)
    }
  }
}

const addDefaultCategories = () => {
  if (confirm('確定要新增預設分類嗎？如果已存在相同名稱的分類將會跳過。')) {
    // 預設分類清單
    const defaultCategories = [
      // 支出類別
      { name: '食材採購', type: 'expense' },
      { name: '租金', type: 'expense' },
      { name: '水電費', type: 'expense' },
      { name: '人事費用', type: 'expense' },
      { name: '設備維護', type: 'expense' },
      { name: '清潔用品', type: 'expense' },
      { name: '包裝材料', type: 'expense' },
      { name: '廣告宣傳', type: 'expense' },
      // 收入類別
      { name: '餐點銷售', type: 'income' },
      { name: '外送收入', type: 'income' },
      { name: '飲料銷售', type: 'income' },
      { name: '其他收入', type: 'income' }
    ]
    
    let addedCount = 0
    
    defaultCategories.forEach(defaultCat => {
      // 檢查是否已存在相同名稱的分類
      const exists = categories.value.some(existingCat => 
        existingCat.name === defaultCat.name && existingCat.type === defaultCat.type
      )
      
      if (!exists) {
        const category = {
          id: Date.now().toString() + Math.random(),
          name: defaultCat.name,
          type: defaultCat.type,
          editing: false,
          editName: defaultCat.name
        }
        categories.value.push(category)
        addedCount++
      }
    })
    
    if (addedCount > 0) {
      alert(`成功新增 ${addedCount} 個預設分類！`)
    } else {
      alert('所有預設分類都已存在，無需新增。')
    }
    
    console.log(`新增了 ${addedCount} 個預設分類`)
  }
}

// 生命週期
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-title {
  font-size: 1rem;
}

.list-group-item {
  border-left: none;
  border-right: none;
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

.form-control-sm {
  font-size: 0.875rem;
}

.fw-medium {
  font-weight: 500;
}
</style>