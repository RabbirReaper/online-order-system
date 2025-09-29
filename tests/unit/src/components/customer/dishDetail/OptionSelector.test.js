import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock console methods
const originalConsole = { ...console }
beforeEach(() => {
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
})

let OptionSelector

describe('OptionSelector.vue', () => {
  let wrapper

  beforeEach(async () => {
    // 重置所有 mocks
    vi.clearAllMocks()

    // 動態導入組件
    const module = await import('@/components/customer/dishDetail/OptionSelector.vue')
    OptionSelector = module.default
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  const createWrapper = (props = {}) => {
    const defaultProps = {
      dish: {
        _id: 'dish-1',
        name: '測試餐點',
        basePrice: 100,
        description: '測試描述'
      },
      optionCategories: [
        {
          _id: 'category-1',
          name: '測試類別',
          inputType: 'single',
          options: [
            {
              _id: 'option-1',
              name: '普通選項',
              price: 20,
              refDishTemplate: null
            },
            {
              _id: 'option-2',
              name: '關聯選項',
              price: 30,
              refDishTemplate: { _id: 'ref-dish-1', name: '關聯餐點' }
            }
          ]
        }
      ],
      isEditMode: false,
      existingItem: null,
      inventoryData: {},
      isLoadingInventory: false
    }

    return mount(OptionSelector, {
      props: {
        ...defaultProps,
        ...props
      }
    })
  }

  describe('初始狀態', () => {
    it('應該正確初始化基本資料', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.quantity).toBe(1)
      expect(wrapper.vm.note).toBe('')
      // selectedOptions 會在組件初始化時設置默認值
      expect(typeof wrapper.vm.selectedOptions).toBe('object')
      expect(typeof wrapper.vm.multiSelectedOptions).toBe('object')
    })

    it('應該在單選類型中選擇第一個選項作為默認值', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.selectedOptions['category-1']).toBe('option-1')
    })

    it('應該在多選類型中初始化為空數組', () => {
      const multiSelectCategory = {
        _id: 'category-multi',
        name: '多選類別',
        inputType: 'multiple',
        options: [
          { _id: 'option-a', name: '選項A', price: 10 },
          { _id: 'option-b', name: '選項B', price: 15 }
        ]
      }

      wrapper = createWrapper({
        optionCategories: [multiSelectCategory]
      })

      expect(wrapper.vm.multiSelectedOptions['category-multi']).toEqual([])
    })
  })

  describe('庫存檢查功能', () => {
    const mockInventoryData = {
      'ref-dish-1': {
        inventoryId: 'inventory-1',
        enableAvailableStock: true,
        availableStock: 0,
        isSoldOut: false,
        isInventoryTracked: true
      },
      'ref-dish-2': {
        inventoryId: 'inventory-2',
        enableAvailableStock: false,
        availableStock: 10,
        isSoldOut: true,
        isInventoryTracked: true
      }
    }

    it('應該在沒有關聯餐點時不禁用選項', () => {
      wrapper = createWrapper()

      const normalOption = { _id: 'option-1', refDishTemplate: null }
      expect(wrapper.vm.isOptionDisabled(normalOption)).toBe(false)
    })

    it('應該在載入庫存時暫時不禁用選項', () => {
      wrapper = createWrapper({
        isLoadingInventory: true,
        inventoryData: mockInventoryData
      })

      const linkedOption = { _id: 'option-2', refDishTemplate: { _id: 'ref-dish-1' } }
      expect(wrapper.vm.isOptionDisabled(linkedOption)).toBe(false)
    })

    it('應該在沒有庫存資料時不禁用選項', () => {
      wrapper = createWrapper({
        inventoryData: {} // 空的庫存資料
      })

      const linkedOption = { _id: 'option-2', refDishTemplate: { _id: 'unknown-dish' } }
      expect(wrapper.vm.isOptionDisabled(linkedOption)).toBe(false)
    })

    it('應該在商品售罄時禁用選項', () => {
      wrapper = createWrapper({
        inventoryData: mockInventoryData
      })

      const soldOutOption = { _id: 'option-3', refDishTemplate: { _id: 'ref-dish-2' } }
      expect(wrapper.vm.isOptionDisabled(soldOutOption)).toBe(true)
    })

    it('應該在啟用庫存追蹤且可用庫存為0時禁用選項', () => {
      wrapper = createWrapper({
        inventoryData: mockInventoryData
      })

      const noStockOption = { _id: 'option-2', refDishTemplate: { _id: 'ref-dish-1' } }
      expect(wrapper.vm.isOptionDisabled(noStockOption)).toBe(true)
    })

    it('應該在未啟用庫存追蹤時不禁用選項', () => {
      const inventoryData = {
        'ref-dish-1': {
          enableAvailableStock: false,
          availableStock: 0,
          isSoldOut: false,
          isInventoryTracked: false
        }
      }

      wrapper = createWrapper({
        inventoryData
      })

      const option = { _id: 'option-2', refDishTemplate: { _id: 'ref-dish-1' } }
      expect(wrapper.vm.isOptionDisabled(option)).toBe(false)
    })

    it('應該在有庫存時不禁用選項', () => {
      const inventoryData = {
        'ref-dish-1': {
          enableAvailableStock: true,
          availableStock: 5,
          isSoldOut: false,
          isInventoryTracked: true
        }
      }

      wrapper = createWrapper({
        inventoryData
      })

      const option = { _id: 'option-2', refDishTemplate: { _id: 'ref-dish-1' } }
      expect(wrapper.vm.isOptionDisabled(option)).toBe(false)
    })
  })

  describe('編輯模式', () => {
    const existingItem = {
      quantity: 2,
      dishInstance: {
        note: '無洋蔥',
        options: [
          {
            optionCategoryId: 'category-1',
            selections: [{ optionId: 'option-2' }]
          }
        ]
      }
    }

    it('應該在編輯模式下載入現有的選項資料', () => {
      wrapper = createWrapper({
        isEditMode: true,
        existingItem
      })

      expect(wrapper.vm.quantity).toBe(2)
      expect(wrapper.vm.note).toBe('無洋蔥')
      expect(wrapper.vm.selectedOptions['category-1']).toBe('option-2')
    })

    it('應該處理多選選項的載入', () => {
      const multiSelectCategory = {
        _id: 'category-multi',
        name: '多選類別',
        inputType: 'multiple',
        options: [
          { _id: 'option-a', name: '選項A', price: 10 },
          { _id: 'option-b', name: '選項B', price: 15 }
        ]
      }

      const existingMultiItem = {
        quantity: 1,
        dishInstance: {
          note: '',
          options: [
            {
              optionCategoryId: 'category-multi',
              selections: [
                { optionId: 'option-a' },
                { optionId: 'option-b' }
              ]
            }
          ]
        }
      }

      wrapper = createWrapper({
        optionCategories: [multiSelectCategory],
        isEditMode: true,
        existingItem: existingMultiItem
      })

      expect(wrapper.vm.multiSelectedOptions['category-multi']).toEqual(['option-a', 'option-b'])
    })
  })

  describe('數量控制', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('應該能增加數量', async () => {
      const increaseBtn = wrapper.find('button:nth-of-type(2)')
      await increaseBtn.trigger('click')

      expect(wrapper.vm.quantity).toBe(2)
    })

    it('應該能減少數量但不低於1', async () => {
      wrapper.vm.quantity = 3
      await wrapper.vm.$nextTick()

      const decreaseBtn = wrapper.find('button:nth-of-type(1)')
      await decreaseBtn.trigger('click')

      expect(wrapper.vm.quantity).toBe(2)

      // 繼續減少到1
      await decreaseBtn.trigger('click')
      expect(wrapper.vm.quantity).toBe(1)

      // 嘗試減少到0，應該停在1
      await decreaseBtn.trigger('click')
      expect(wrapper.vm.quantity).toBe(1)
    })
  })

  describe('價格計算', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('應該正確計算基礎價格', () => {
      expect(wrapper.vm.calculateItemTotal()).toBe(120) // 100 + 20 (第一個選項)
    })

    it('應該在增加數量時計算正確總價', () => {
      wrapper.vm.quantity = 2
      expect(wrapper.vm.calculateItemTotal()).toBe(240) // (100 + 20) * 2
    })

    it('應該在選擇不同選項時計算正確價格', async () => {
      // 選擇第二個選項（價格 30）
      wrapper.vm.selectedOptions['category-1'] = 'option-2'
      expect(wrapper.vm.calculateItemTotal()).toBe(130) // 100 + 30
    })

    it('應該正確計算多選選項的價格', () => {
      const multiSelectCategory = {
        _id: 'category-multi',
        name: '多選類別',
        inputType: 'multiple',
        options: [
          { _id: 'option-a', name: '選項A', price: 10 },
          { _id: 'option-b', name: '選項B', price: 15 }
        ]
      }

      wrapper.unmount()
      wrapper = createWrapper({
        optionCategories: [multiSelectCategory]
      })

      // 選擇兩個多選選項
      wrapper.vm.multiSelectedOptions['category-multi'] = ['option-a', 'option-b']
      expect(wrapper.vm.calculateItemTotal()).toBe(125) // 100 + 10 + 15
    })
  })

  describe('選項詳情生成', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('應該正確生成單選選項詳情', () => {
      wrapper.vm.selectedOptions['category-1'] = 'option-2'

      const details = wrapper.vm.getSelectedOptionDetails()
      expect(details).toHaveLength(1)
      expect(details[0]).toEqual({
        _id: false,
        optionCategoryId: 'category-1',
        optionCategoryName: '測試類別',
        selections: [
          {
            optionId: 'option-2',
            name: '關聯選項',
            price: 30
          }
        ]
      })
    })

    it('應該正確生成多選選項詳情', () => {
      const multiSelectCategory = {
        _id: 'category-multi',
        name: '多選類別',
        inputType: 'multiple',
        options: [
          { _id: 'option-a', name: '選項A', price: 10 },
          { _id: 'option-b', name: '選項B', price: 15 }
        ]
      }

      wrapper.unmount()
      wrapper = createWrapper({
        optionCategories: [multiSelectCategory]
      })

      wrapper.vm.multiSelectedOptions['category-multi'] = ['option-a', 'option-b']

      const details = wrapper.vm.getSelectedOptionDetails()
      expect(details).toHaveLength(1)
      expect(details[0].selections).toHaveLength(2)
      expect(details[0].selections[0].name).toBe('選項A')
      expect(details[0].selections[1].name).toBe('選項B')
    })
  })

  describe('事件發射', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('應該在點擊加入購物車時發射正確的事件', async () => {
      wrapper.vm.quantity = 2
      wrapper.vm.note = '測試備註'

      const addBtn = wrapper.find('.btn-primary')
      await addBtn.trigger('click')

      const emitted = wrapper.emitted('add-to-cart')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0]).toEqual({
        dishInstance: {
          templateId: 'dish-1',
          name: '測試餐點',
          basePrice: 100,
          options: expect.any(Array),
          finalPrice: 120
        },
        quantity: 2,
        note: '測試備註',
        subtotal: 240
      })
    })

    it('應該在編輯模式下點擊確認修改時發射更新事件', async () => {
      wrapper = createWrapper({
        isEditMode: true
      })

      const updateBtn = wrapper.find('.btn-success')
      await updateBtn.trigger('click')

      const emitted = wrapper.emitted('update-cart')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0]).toEqual({
        dishInstance: {
          templateId: 'dish-1',
          name: '測試餐點',
          basePrice: 100,
          options: expect.any(Array),
          finalPrice: 120
        },
        quantity: 1,
        note: '',
        subtotal: 120
      })
    })
  })

  describe('UI 渲染', () => {
    it('應該顯示餐點選項', () => {
      wrapper = createWrapper()

      expect(wrapper.find('h5').text()).toBe('測試類別')
      expect(wrapper.findAll('label')).toHaveLength(2)
      expect(wrapper.find('label[for="option-option-1"]').text()).toContain('普通選項')
      expect(wrapper.find('label[for="option-option-2"]').text()).toContain('關聯選項')
    })

    it('應該在非編輯模式下顯示加入購物車按鈕', () => {
      wrapper = createWrapper({
        isEditMode: false
      })

      expect(wrapper.find('.btn-primary').text()).toContain('加入購物車')
      expect(wrapper.find('.btn-success').exists()).toBe(false)
    })

    it('應該在編輯模式下顯示確認修改按鈕', () => {
      wrapper = createWrapper({
        isEditMode: true
      })

      expect(wrapper.find('.btn-success').text()).toContain('確認修改')
      expect(wrapper.find('.btn-primary').exists()).toBe(false)
    })

    it('應該顯示特殊要求輸入框', () => {
      wrapper = createWrapper()

      const textarea = wrapper.find('textarea')
      expect(textarea.exists()).toBe(true)
      expect(textarea.attributes('placeholder')).toBe('例如：不要洋蔥...')
    })

    it('應該顯示數量控制', () => {
      wrapper = createWrapper()

      const quantityDisplay = wrapper.find('.input-group .form-control')
      expect(quantityDisplay.text()).toBe('1')

      const buttons = wrapper.findAll('.input-group button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0].text()).toBe('-')
      expect(buttons[1].text()).toBe('+')
    })

    it('應該在禁用選項上添加正確的 CSS 類別', () => {
      const inventoryData = {
        'ref-dish-1': {
          enableAvailableStock: true,
          availableStock: 0,
          isSoldOut: false,
          isInventoryTracked: true
        }
      }

      wrapper = createWrapper({
        inventoryData
      })

      // 第一個選項（普通選項）不應該有禁用類別
      const normalOption = wrapper.find('.form-check:first-child')
      expect(normalOption.classes()).not.toContain('option-disabled')

      // 第二個選項（關聯選項，無庫存）應該有禁用類別
      const disabledOption = wrapper.find('.form-check:nth-child(2)')
      expect(disabledOption.classes()).toContain('option-disabled')
    })

    it('應該禁用無庫存選項的輸入', () => {
      const inventoryData = {
        'ref-dish-1': {
          enableAvailableStock: true,
          availableStock: 0,
          isSoldOut: false,
          isInventoryTracked: true
        }
      }

      wrapper = createWrapper({
        inventoryData
      })

      const inputs = wrapper.findAll('input[type="radio"]')

      // 第一個選項應該啟用
      expect(inputs[0].attributes('disabled')).toBeUndefined()

      // 第二個選項應該禁用
      expect(inputs[1].attributes('disabled')).toBe('')
    })
  })

  describe('響應式行為', () => {
    it('應該在 props 改變時重新初始化選項', async () => {
      wrapper = createWrapper()

      // 初始選擇
      expect(wrapper.vm.selectedOptions['category-1']).toBe('option-1')

      // 改變選項類別
      const newCategories = [
        {
          _id: 'category-2',
          name: '新類別',
          inputType: 'single',
          options: [
            { _id: 'option-new', name: '新選項', price: 50 }
          ]
        }
      ]

      await wrapper.setProps({ optionCategories: newCategories })

      // 應該重新初始化
      expect(wrapper.vm.selectedOptions['category-2']).toBe('option-new')
      expect(wrapper.vm.selectedOptions['category-1']).toBeUndefined()
    })

    it('應該在非編輯模式下重置餐點時清空表單', async () => {
      wrapper = createWrapper()

      // 修改表單狀態
      wrapper.vm.quantity = 3
      wrapper.vm.note = '測試備註'

      // 改變餐點
      await wrapper.setProps({
        dish: {
          _id: 'dish-2',
          name: '新餐點',
          basePrice: 200
        }
      })

      // 應該重置表單狀態
      expect(wrapper.vm.quantity).toBe(1)
      expect(wrapper.vm.note).toBe('')
    })

    it('應該在編輯模式下不重置表單狀態', async () => {
      wrapper = createWrapper({
        isEditMode: true
      })

      // 修改表單狀態
      wrapper.vm.quantity = 3
      wrapper.vm.note = '測試備註'

      // 改變餐點
      await wrapper.setProps({
        dish: {
          _id: 'dish-2',
          name: '新餐點',
          basePrice: 200
        }
      })

      // 編輯模式下不應該重置
      expect(wrapper.vm.quantity).toBe(3)
      expect(wrapper.vm.note).toBe('測試備註')
    })
  })

  describe('錯誤處理', () => {
    it('應該處理無效的選項類別資料', () => {
      wrapper = createWrapper({
        optionCategories: null
      })

      expect(console.warn).toHaveBeenCalledWith('optionCategories is not an array:', null)
    })

    it('應該處理缺少選項的類別', () => {
      const invalidCategory = {
        _id: 'category-invalid',
        name: '無效類別',
        inputType: 'single',
        options: []
      }

      wrapper = createWrapper({
        optionCategories: [invalidCategory]
      })

      expect(console.warn).toHaveBeenCalledWith('No options found for category 無效類別:', [])
    })

    it('應該處理無效的類別物件', () => {
      // 這個測試主要驗證 initializeOptions 函數中的錯誤處理
      // 由於 Vue 模板會在渲染時嘗試讀取 category._id，直接測試會導致渲染錯誤
      // 我們改為測試組件能正確處理有效的類別但缺少 _id 的情況

      const invalidCategories = [
        { name: 'no-id', inputType: 'single', options: [] }
      ]

      wrapper = createWrapper({
        optionCategories: invalidCategories
      })

      // 測試警告訊息
      expect(console.warn).toHaveBeenCalledWith('Invalid category object:', { name: 'no-id', inputType: 'single', options: [] })
    })
  })
})