/**
 * 請求參數驗證中介軟體
 * 接受驗證規則並檢查請求數據
 * @param {Object} schema - 指定字段的驗證規則
 * @param {String} location - 檢查的位置: 'body'(預設), 'query', 'params'
 */
export const validate = (schema, location = 'body') => (req, res, next) => {
  try {
    // 根據指定位置取得待驗證的數據
    const data = req[location];

    // 錯誤收集
    const errors = {};

    // 驗證每個字段
    for (const [field, rules] of Object.entries(schema)) {
      // 檢查必填項
      if (rules.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
        errors[field] = `${field}為必填欄位`;
        continue;
      }

      // 如果字段不存在且非必填，跳過後續驗證
      if (data[field] === undefined || data[field] === null) {
        continue;
      }

      // 檢查類型
      if (rules.type) {
        let typeValid = true;

        switch (rules.type) {
          case 'string':
            typeValid = typeof data[field] === 'string';
            break;
          case 'number':
            typeValid = !isNaN(Number(data[field]));
            // 如果是字串類型的數字，轉換為數字類型
            if (typeValid && typeof data[field] === 'string') {
              data[field] = Number(data[field]);
            }
            break;
          case 'boolean':
            if (typeof data[field] === 'string') {
              if (data[field].toLowerCase() === 'true') {
                data[field] = true;
                typeValid = true;
              } else if (data[field].toLowerCase() === 'false') {
                data[field] = false;
                typeValid = true;
              } else {
                typeValid = false;
              }
            } else {
              typeValid = typeof data[field] === 'boolean';
            }
            break;
          case 'array':
            typeValid = Array.isArray(data[field]);
            break;
          case 'object':
            typeValid = typeof data[field] === 'object' && !Array.isArray(data[field]) && data[field] !== null;
            break;
          default:
            typeValid = true;
        }

        if (!typeValid) {
          errors[field] = `${field}的類型不正確，應為${rules.type}`;
          continue;
        }
      }

      // 檢查最小值
      if (rules.min !== undefined && typeof data[field] === 'number') {
        if (data[field] < rules.min) {
          errors[field] = `${field}不能小於${rules.min}`;
          continue;
        }
      }

      // 檢查最大值
      if (rules.max !== undefined && typeof data[field] === 'number') {
        if (data[field] > rules.max) {
          errors[field] = `${field}不能大於${rules.max}`;
          continue;
        }
      }

      // 檢查字串長度最小值
      if (rules.minLength !== undefined && typeof data[field] === 'string') {
        if (data[field].length < rules.minLength) {
          errors[field] = `${field}長度不能少於${rules.minLength}個字元`;
          continue;
        }
      }

      // 檢查字串長度最大值
      if (rules.maxLength !== undefined && typeof data[field] === 'string') {
        if (data[field].length > rules.maxLength) {
          errors[field] = `${field}長度不能超過${rules.maxLength}個字元`;
          continue;
        }
      }

      // 檢查枚舉值
      if (rules.enum !== undefined && Array.isArray(rules.enum)) {
        if (!rules.enum.includes(data[field])) {
          errors[field] = `${field}必須是以下值之一: ${rules.enum.join(', ')}`;
          continue;
        }
      }

      // 檢查Email格式
      if (rules.isEmail && typeof data[field] === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data[field])) {
          errors[field] = `${field}必須是有效的電子郵件地址`;
          continue;
        }
      }

      // 檢查手機號碼格式 (台灣)
      if (rules.isPhone && typeof data[field] === 'string') {
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(data[field])) {
          errors[field] = `${field}必須是有效的手機號碼格式`;
          continue;
        }
      }

      // 自定義驗證函數
      if (typeof rules.custom === 'function') {
        const customResult = rules.custom(data[field], data);
        if (customResult !== true) {
          errors[field] = customResult || `${field}驗證失敗`;
          continue;
        }
      }
    }

    // 如果存在驗證錯誤，返回錯誤信息
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors
      });
    }

    // 沒有錯誤，繼續執行下一個中介軟體或路由處理器
    next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 常用驗證規則
 */
export const ValidationRules = {
  // 通用驗證
  required: { required: true },

  // 字串驗證
  string: { type: 'string' },
  email: { type: 'string', isEmail: true },
  phone: { type: 'string', isPhone: true },

  // 數字驗證
  number: { type: 'number' },
  positiveNumber: { type: 'number', min: 0 },

  // 布林驗證
  boolean: { type: 'boolean' },

  // 陣列驗證
  array: { type: 'array' },

  // 物件驗證
  object: { type: 'object' },

  // 組合使用範例
  //  - 必填的電子郵件：{ ...ValidationRules.required, ...ValidationRules.email }
  //  - 必填的正整數：{ ...ValidationRules.required, ...ValidationRules.positiveNumber }
};
