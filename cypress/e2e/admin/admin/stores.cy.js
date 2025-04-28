// cypress/e2e/admin/stores.cy.js
// 管理員店鋪管理 E2E 測試

describe('管理員店鋪管理', () => {
  beforeEach(() => {
    // 模擬管理員已登入
    cy.intercept('GET', '/api/auth/check-status', {
      statusCode: 200,
      body: {
        success: true,
        loggedIn: true,
        role: 'boss'
      }
    });

    // 模擬店鋪列表 API
    cy.intercept('GET', '/api/store', {
      statusCode: 200,
      body: {
        success: true,
        stores: [
          {
            _id: '123456',
            name: '台北店',
            brand: {
              _id: '111222',
              name: '測試品牌'
            },
            isActive: true,
            image: {
              url: 'https://example.com/taipei.jpg',
              alt: '台北店圖片'
            },
            businessHours: [
              {
                day: 1,
                periods: [{ open: '09:00', close: '18:00' }],
                isClosed: false
              }
            ]
          },
          {
            _id: '789012',
            name: '高雄店',
            brand: {
              _id: '111222',
              name: '測試品牌'
            },
            isActive: false,
            image: {
              url: 'https://example.com/kaohsiung.jpg',
              alt: '高雄店圖片'
            },
            businessHours: [
              {
                day: 1,
                periods: [{ open: '10:00', close: '19:00' }],
                isClosed: false
              }
            ]
          }
        ]
      }
    }).as('getStores');

    // 模擬品牌列表 API
    cy.intercept('GET', '/api/store/brands', {
      statusCode: 200,
      body: {
        success: true,
        brands: [
          {
            _id: '111222',
            name: '測試品牌'
          }
        ]
      }
    }).as('getBrands');

    // 訪問店鋪管理頁面
    cy.visit('/admin/stores');
    cy.wait('@getStores');
  });

  it('應該顯示店鋪列表', () => {
    // 檢查頁面標題
    cy.contains('h2', '店鋪列表').should('be.visible');

    // 檢查店鋪資料
    cy.contains('台北店').should('be.visible');
    cy.contains('高雄店').should('be.visible');
    cy.contains('測試品牌').should('be.visible');

    // 檢查狀態標籤
    cy.contains('台北店').parent().contains('啟用中').should('be.visible');
    cy.contains('高雄店').parent().contains('已停用').should('be.visible');
  });

  it('應該能夠篩選店鋪', () => {
    // 模擬篩選後的 API 回應
    cy.intercept('GET', '/api/store*', {
      statusCode: 200,
      body: {
        success: true,
        stores: [
          {
            _id: '123456',
            name: '台北店',
            brand: {
              _id: '111222',
              name: '測試品牌'
            },
            isActive: true
          }
        ]
      }
    }).as('filterStores');

    // 選擇篩選條件
    cy.get('select[name="brand"]').select('111222');
    cy.get('input[name="activeOnly"]').check();
    cy.get('button').contains('篩選').click();

    // 等待 API 請求完成
    cy.wait('@filterStores');

    // 檢查篩選結果
    cy.contains('台北店').should('be.visible');
    cy.contains('高雄店').should('not.exist');
  });

  it('應該能夠新增店鋪', () => {
    // 模擬新增店鋪 API
    cy.intercept('POST', '/api/store', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Store created successfully',
        store: {
          _id: '345678',
          name: '新店鋪',
          brand: {
            _id: '111222',
            name: '測試品牌'
          },
          isActive: true
        }
      }
    }).as('createStore');

    // 模擬圖片上傳（這部分比較複雜，僅作為示例）
    cy.intercept('POST', '/api/upload', {
      statusCode: 200,
      body: {
        success: true,
        url: 'https://example.com/new-store.jpg',
        key: 'new-store.jpg'
      }
    }).as('uploadImage');

    // 點擊新增按鈕
    cy.contains('新增店鋪').click();

    // 填寫表單
    cy.get('input[name="name"]').type('新店鋪');
    cy.get('select[name="brand"]').select('111222');

    // 選擇營業時間（假設有相關 UI）
    cy.get('[data-day="1"]').within(() => {
      cy.get('input[type="checkbox"]').check(); // 啟用星期一
      cy.get('input[name="openTime"]').type('09:00');
      cy.get('input[name="closeTime"]').type('18:00');
    });

    // 上傳圖片（模擬）
    const imageFile = new File(['dummy content'], 'store.jpg', { type: 'image/jpeg' });
    cy.get('input[type="file"]').attachFile({
      fileContent: imageFile,
      fileName: 'store.jpg',
      mimeType: 'image/jpeg'
    });
    cy.wait('@uploadImage');

    // 啟用店鋪
    cy.get('input[name="isActive"]').check();

    // 提交表單
    cy.get('button[type="submit"]').click();

    // 等待 API 請求完成
    cy.wait('@createStore');

    // 檢查成功訊息
    cy.contains('店鋪創建成功').should('be.visible');

    // 檢查列表是否更新
    cy.contains('新店鋪').should('be.visible');
  });

  it('應該能夠編輯店鋪', () => {
    // 模擬獲取單個店鋪詳情
    cy.intercept('GET', '/api/store/123456', {
      statusCode: 200,
      body: {
        success: true,
        store: {
          _id: '123456',
          name: '台北店',
          brand: {
            _id: '111222',
            name: '測試品牌'
          },
          isActive: true,
          image: {
            url: 'https://example.com/taipei.jpg',
            key: 'taipei.jpg',
            alt: '台北店圖片'
          },
          businessHours: [
            {
              day: 1,
              periods: [{ open: '09:00', close: '18:00' }],
              isClosed: false
            }
          ]
        }
      }
    }).as('getStore');

    // 模擬更新店鋪 API
    cy.intercept('PUT', '/api/store/123456', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Store updated successfully',
        store: {
          _id: '123456',
          name: '更新的店鋪名稱',
          brand: {
            _id: '111222',
            name: '測試品牌'
          },
          isActive: true
        }
      }
    }).as('updateStore');

    // 點擊編輯按鈕
    cy.contains('台北店').parent().find('button').contains('編輯').click();

    // 等待詳情載入
    cy.wait('@getStore');

    // 修改表單
    cy.get('input[name="name"]').clear().type('更新的店鋪名稱');

    // 提交表單
    cy.get('button[type="submit"]').click();

    // 等待 API 請求完成
    cy.wait('@updateStore');

    // 檢查成功訊息
    cy.contains('店鋪更新成功').should('be.visible');

    // 檢查列表是否更新
    cy.contains('更新的店鋪名稱').should('be.visible');
  });

  it('應該能夠刪除店鋪（僅限老闆權限）', () => {
    // 模擬刪除店鋪 API
    cy.intercept('DELETE', '/api/store/123456', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Store deleted successfully'
      }
    }).as('deleteStore');

    // 點擊刪除按鈕
    cy.contains('台北店').parent().find('button').contains('刪除').click();

    // 確認刪除
    cy.get('.modal').within(() => {
      cy.contains('確定要刪除這個店鋪嗎？').should('be.visible');
      cy.contains('確認').click();
    });

    // 等待 API 請求完成
    cy.wait('@deleteStore');

    // 檢查成功訊息
    cy.contains('店鋪刪除成功').should('be.visible');

    // 檢查列表是否更新
    cy.contains('台北店').should('not.exist');
  });

  it('應該能夠切換店鋪啟用狀態', () => {
    // 模擬更新店鋪狀態 API
    cy.intercept('PUT', '/api/store/789012', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Store updated successfully',
        store: {
          _id: '789012',
          name: '高雄店',
          isActive: true
        }
      }
    }).as('updateStoreStatus');

    // 找到高雄店的啟用開關
    cy.contains('高雄店').parent().find('input[type="checkbox"]').check();

    // 等待 API 請求完成
    cy.wait('@updateStoreStatus');

    // 檢查狀態是否更新
    cy.contains('高雄店').parent().contains('啟用中').should('be.visible');
  });
});
