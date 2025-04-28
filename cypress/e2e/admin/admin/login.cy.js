// cypress/e2e/admin/login.cy.js
// 管理員登入頁面 E2E 測試

describe('管理員登入', () => {
  beforeEach(() => {
    // 在每個測試前訪問登入頁面
    cy.visit('/admin/login');

    // 如果需要，可以清除 cookie 和 localStorage
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('應該顯示登入表單', () => {
    // 檢查標題
    cy.contains('h1', '系統登入').should('be.visible');

    // 檢查表單元素
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').contains('登入');
  });

  it('應該在欄位為空時顯示錯誤訊息', () => {
    // 點擊提交按鈕而不填寫任何欄位
    cy.get('button[type="submit"]').click();

    // 檢查錯誤訊息
    cy.contains('請輸入用戶名').should('be.visible');
    cy.contains('請輸入密碼').should('be.visible');
  });

  it('應該在登入失敗時顯示錯誤訊息', () => {
    // 模擬 API 回應
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        message: '用戶名或密碼錯誤'
      }
    }).as('loginRequest');

    // 填寫表單並提交
    cy.get('input[name="name"]').type('wrongadmin');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // 等待 API 請求完成
    cy.wait('@loginRequest');

    // 檢查錯誤訊息
    cy.contains('用戶名或密碼錯誤').should('be.visible');
  });

  it('應該在登入成功時重定向到後台首頁', () => {
    // 模擬 API 回應
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        role: 'boss',
        manage: []
      }
    }).as('loginRequest');

    // 模擬檢查登入狀態的 API
    cy.intercept('GET', '/api/auth/check-status', {
      statusCode: 200,
      body: {
        success: true,
        loggedIn: true,
        role: 'boss'
      }
    });

    // 填寫表單並提交
    cy.get('input[name="name"]').type('admin');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // 等待 API 請求完成
    cy.wait('@loginRequest');

    // 檢查是否重定向到後台首頁
    cy.url().should('include', '/admin');
    cy.contains('首頁儀表板').should('be.visible');
  });

  it('應該記住登入狀態', () => {
    // 模擬 API 回應
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        role: 'boss',
        manage: []
      }
    }).as('loginRequest');

    // 模擬檢查登入狀態的 API
    cy.intercept('GET', '/api/auth/check-status', {
      statusCode: 200,
      body: {
        success: true,
        loggedIn: true,
        role: 'boss'
      }
    });

    // 勾選記住我並登入
    cy.get('input[name="name"]').type('admin');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="remember"]').check();
    cy.get('button[type="submit"]').click();

    // 等待 API 請求完成
    cy.wait('@loginRequest');

    // 重新載入頁面（模擬使用者重新訪問）
    cy.reload();

    // 檢查是否保持登入狀態（直接顯示後台首頁）
    cy.url().should('include', '/admin');
    cy.contains('首頁儀表板').should('be.visible');
  });
});
