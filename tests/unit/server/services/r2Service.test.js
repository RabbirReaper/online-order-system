import { describe, it, expect } from 'vitest';
import { uploadImage, getImage, deleteImage, getImageUrl } from '@server/services/image/r2Service.js';
import { randomUUID } from 'crypto'; // node 18+ 內建

// 測試圖片數據（可以是隨便一個小文字檔案內容）
const dummyImageData = Buffer.from('Hello, world!', 'utf-8');
const dummyContentType = 'text/plain';

describe('r2Service 基本功能測試', () => {
  const key = `test/${randomUUID()}.txt`; // 每次都用不同的 key，避免衝突
  const publicUrl = process.env.VITE_R2_PUBLIC_URL; // 你如果有設定公開 URL，方便測試 getImageUrl

  it('應該可以成功上傳圖片', async () => {
    const result = await uploadImage(dummyImageData, key, dummyContentType);
    expect(result).toHaveProperty('key', key);
  });

  it('應該可以成功取得圖片', async () => {
    const result = await getImage(key);
    expect(result).not.toBeNull();
    expect(result?.contentType).toBe(dummyContentType);
    expect(result?.data.toString()).toBe('Hello, world!');
  });

  it('應該可以成功取得公開圖片網址', () => {
    if (publicUrl) {
      const url = getImageUrl(key, publicUrl);
      expect(url).toContain(key);
    }
  });

  it('應該可以成功刪除圖片', async () => {
    const result = await deleteImage(key);
    expect(result).toEqual({ key, deleted: true });
  });

  it('刪除後應該找不到圖片', async () => {
    const result = await getImage(key);
    expect(result).toBeNull(); // 因為圖片被刪了
  });
});
