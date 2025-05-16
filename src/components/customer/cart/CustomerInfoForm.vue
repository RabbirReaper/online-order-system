<template>
  <div class="customer-info-form">
    <BForm @submit.prevent>
      <!-- 姓名 -->
      <BFormGroup label="姓名" label-for="customer-name" :invalid-feedback="v$.name.$errors.length > 0 ? '請輸入您的姓名' : ''"
        :state="v$.name.$dirty ? !v$.name.$error : null">
        <BFormInput id="customer-name" v-model="localInfo.name" placeholder="請輸入您的姓名"
          :state="v$.name.$dirty ? !v$.name.$error : null" trim @blur="v$.name.$touch()"></BFormInput>
      </BFormGroup>

      <!-- 電話 -->
      <BFormGroup label="電話號碼" label-for="customer-phone"
        :invalid-feedback="v$.phone.$errors.length > 0 ? getPhoneErrorMessage() : ''"
        :state="v$.phone.$dirty ? !v$.phone.$error : null">
        <BFormInput id="customer-phone" v-model="localInfo.phone" placeholder="請輸入您的電話號碼"
          :state="v$.phone.$dirty ? !v$.phone.$error : null" trim @blur="v$.phone.$touch()"></BFormInput>
      </BFormGroup>

      <!-- 電子郵件 (選填) -->
      <BFormGroup label="電子郵件 (選填)" label-for="customer-email"
        :invalid-feedback="v$.email.$errors.length > 0 ? '請輸入有效的電子郵件地址' : ''"
        :state="v$.email.$dirty ? !v$.email.$error : null">
        <BFormInput id="customer-email" v-model="localInfo.email" placeholder="請輸入您的電子郵件"
          :state="v$.email.$dirty ? !v$.email.$error : null" trim @blur="v$.email.$touch()"></BFormInput>
      </BFormGroup>
    </BForm>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';

// 定義 props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      name: '',
      phone: '',
      email: ''
    })
  }
});

// 定義 emits
const emit = defineEmits(['update:modelValue']);

// 本地響應式數據
const localInfo = reactive({
  name: props.modelValue.name || '',
  phone: props.modelValue.phone || '',
  email: props.modelValue.email || ''
});

// 自定義電話號碼驗證器
const phoneValidator = helpers.regex(/^09\d{8}$|^0[1-8]\d{7,8}$/);

// 驗證規則
const rules = computed(() => ({
  name: { required },
  phone: { required, validPhone: phoneValidator },
  email: { email: helpers.withMessage('請輸入有效的電子郵件地址', email) }
}));

// 初始化 vuelidate
const v$ = useVuelidate(rules, localInfo);

// 獲取電話錯誤消息
const getPhoneErrorMessage = () => {
  if (v$.value.phone.required.$invalid) {
    return '請輸入您的電話號碼';
  }
  if (v$.value.phone.validPhone.$invalid) {
    return '請輸入有效的台灣手機號碼 (09xxxxxxxx) 或市話號碼';
  }
  return '';
};

// 監聽本地數據變化，更新父組件
watch(localInfo, (newVal) => {
  emit('update:modelValue', { ...newVal });
}, { deep: true });

// 監聽 props 變化，更新本地數據
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localInfo.name = newVal.name || '';
    localInfo.phone = newVal.phone || '';
    localInfo.email = newVal.email || '';
  }
}, { deep: true });
</script>

<style scoped>
.customer-info-form {
  margin-bottom: 1.5rem;
}
</style>
