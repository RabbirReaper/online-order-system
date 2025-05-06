/**
 * 日期時間工具函數
 * 集中處理日期時間相關的工具函數
 */

import { DateTime } from 'luxon';

/**
 * 獲取台灣時區的當前日期時間
 * @returns {DateTime} Luxon DateTime 物件 (台灣時區)
 */
export const getTaiwanDateTime = () => {
  return DateTime.now().setZone('Asia/Taipei');
};

/**
 * 獲取指定日期的開始時間 (00:00:00.000)
 * @param {Date|DateTime} date - 日期物件
 * @returns {DateTime} 該日期的開始時間
 */
export const getStartOfDay = (date) => {
  let dateTime;

  if (date instanceof DateTime) {
    dateTime = date;
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  } else {
    throw new Error('無效的日期格式');
  }

  return dateTime.startOf('day');
};

/**
 * 獲取指定日期的結束時間 (23:59:59.999)
 * @param {Date|DateTime} date - 日期物件
 * @returns {DateTime} 該日期的結束時間
 */
export const getEndOfDay = (date) => {
  let dateTime;

  if (date instanceof DateTime) {
    dateTime = date;
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  } else {
    throw new Error('無效的日期格式');
  }

  return dateTime.endOf('day');
};

/**
 * 獲取指定月份的開始時間 (1日 00:00:00.000)
 * @param {Date|DateTime} date - 日期物件
 * @returns {DateTime} 該月份的開始時間
 */
export const getStartOfMonth = (date) => {
  let dateTime;

  if (date instanceof DateTime) {
    dateTime = date;
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  } else {
    throw new Error('無效的日期格式');
  }

  return dateTime.startOf('month');
};

/**
 * 獲取指定月份的結束時間 (最後一日 23:59:59.999)
 * @param {Date|DateTime} date - 日期物件
 * @returns {DateTime} 該月份的結束時間
 */
export const getEndOfMonth = (date) => {
  let dateTime;

  if (date instanceof DateTime) {
    dateTime = date;
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  } else {
    throw new Error('無效的日期格式');
  }

  return dateTime.endOf('month');
};

/**
 * 格式化日期時間為特定格式
 * @param {Date|DateTime} date - 日期物件
 * @param {String} format - 格式字串 (luxon 格式)
 * @returns {String} 格式化後的日期時間字串
 */
export const formatDateTime = (date, format = 'yyyy-MM-dd HH:mm:ss') => {
  let dateTime;

  if (date instanceof DateTime) {
    dateTime = date;
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  } else {
    throw new Error('無效的日期格式');
  }

  return dateTime.toFormat(format);
};

/**
 * 判斷日期是否為今天
 * @param {Date|DateTime} date - 日期物件
 * @returns {Boolean} 是否為今天
 */
export const isToday = (date) => {
  let dateTime;

  if (date instanceof DateTime) {
    dateTime = date;
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  } else {
    throw new Error('無效的日期格式');
  }

  const today = DateTime.now().setZone(dateTime.zone);
  return dateTime.hasSame(today, 'day');
};

/**
 * 計算兩個日期之間的差異 (天數)
 * @param {Date|DateTime} dateFrom - 開始日期
 * @param {Date|DateTime} dateTo - 結束日期
 * @returns {Number} 相差的天數
 */
export const daysDifference = (dateFrom, dateTo) => {
  let from, to;

  if (dateFrom instanceof DateTime) {
    from = dateFrom;
  } else if (dateFrom instanceof Date) {
    from = DateTime.fromJSDate(dateFrom);
  } else {
    throw new Error('無效的開始日期格式');
  }

  if (dateTo instanceof DateTime) {
    to = dateTo;
  } else if (dateTo instanceof Date) {
    to = DateTime.fromJSDate(dateTo);
  } else {
    throw new Error('無效的結束日期格式');
  }

  const diff = to.diff(from, 'days');
  return Math.round(diff.days);
};
