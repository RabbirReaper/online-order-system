// tests/unit/server/services/r2Service.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadImage,
  getImage,
  imageExists,
  listImages,
  updateImage,
  deleteImage,
  getImageUrl
} from '@server/services/image/r2Service.js';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

// 模擬 AWS S3 客戶端
vi.mock('@aws-sdk/client-s3', () => {
  // 創建模擬函數
  const mockSend = vi.fn();

  // 模擬 S3Client 類
  const MockS3Client = vi.fn(() => ({
    send: mockSend
  }));

  return {
    S3Client: MockS3Client,
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    ListObjectsV2Command: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    mockS3Send: mockSend // 導出模擬函數以便測試中使用
  };
});

// 取得模擬的 S3 send 函數
const mockS3Send = vi.mocked(new S3Client({})).send;

describe('r2Service 基本功能測試', () => {
  // 測試數據
  const testKey = `test/${randomUUID()}.txt`;
  const testImageData = Buffer.from('Hello, world!', 'utf-8');
  const testContentType = 'text/plain';

  // 正確的模擬響應
  const mockGetObjectResponse = {
    Body: {
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('Hello, world!', 'utf-8');
      }
    },
    ContentType: 'text/plain'
  };

  beforeEach(() => {
    // 重置所有模擬函數
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 每次測試後清理
    vi.resetAllMocks();
  });

  describe('uploadImage 函數', () => {
    it('應該可以成功上傳圖片', async () => {
      // 模擬成功上傳
      mockS3Send.mockResolvedValueOnce({});

      const result = await uploadImage(testImageData, testKey, testContentType);

      // 驗證結果
      expect(result).toHaveProperty('key', testKey);
      expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Key: testKey,
        ContentType: testContentType
      }));
    });

    it('應該在上傳失敗時拋出錯誤', async () => {
      // 模擬上傳失敗
      mockS3Send.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(uploadImage(testImageData, testKey, testContentType))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('getImage 函數', () => {
    it('應該可以成功取得圖片', async () => {
      // 模擬成功取得圖片
      mockS3Send.mockResolvedValueOnce(mockGetObjectResponse);

      const result = await getImage(testKey);

      // 驗證結果
      expect(result).not.toBeNull();
      expect(result.contentType).toBe(testContentType);
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.data.toString()).toBe('Hello, world!');
      expect(GetObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Key: testKey
      }));
    });

    it('當圖片不存在時應該返回 null', async () => {
      // 模擬圖片不存在
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockS3Send.mockRejectedValueOnce(error);

      const result = await getImage(testKey);

      // 驗證結果
      expect(result).toBeNull();
    });

    it('應該在獲取失敗時拋出錯誤 (非 NoSuchKey 錯誤)', async () => {
      // 模擬其他錯誤
      mockS3Send.mockRejectedValueOnce(new Error('Server error'));

      await expect(getImage(testKey))
        .rejects.toThrow('Server error');
    });
  });

  describe('imageExists 函數', () => {
    it('當圖片存在時應該返回 true', async () => {
      // 模擬圖片存在
      mockS3Send.mockResolvedValueOnce({});

      const result = await imageExists(testKey);

      // 驗證結果
      expect(result).toBe(true);
      expect(GetObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Key: testKey
      }));
    });

    it('當圖片不存在時應該返回 false', async () => {
      // 模擬圖片不存在
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockS3Send.mockRejectedValueOnce(error);

      const result = await imageExists(testKey);

      // 驗證結果
      expect(result).toBe(false);
    });

    it('應該在檢查失敗時拋出錯誤 (非 NoSuchKey 錯誤)', async () => {
      // 模擬其他錯誤
      mockS3Send.mockRejectedValueOnce(new Error('Server error'));

      await expect(imageExists(testKey))
        .rejects.toThrow('Server error');
    });
  });

  describe('listImages 函數', () => {
    it('應該可以正確列出資料夾中的圖片', async () => {
      // 模擬列表響應
      const mockContents = [
        { Key: 'test/image1.jpg' },
        { Key: 'test/image2.jpg' },
        { Key: 'test/image3.jpg' }
      ];

      mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

      const prefix = 'test/';
      const result = await listImages(prefix);

      // 驗證結果
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['test/image1.jpg', 'test/image2.jpg', 'test/image3.jpg']);
      expect(ListObjectsV2Command).toHaveBeenCalledWith(expect.objectContaining({
        Prefix: prefix
      }));
    });

    it('當資料夾為空時應該返回空陣列', async () => {
      // 模擬空目錄
      mockS3Send.mockResolvedValueOnce({});

      const prefix = 'empty/';
      const result = await listImages(prefix);

      // 驗證結果
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('應該在獲取列表失敗時拋出錯誤', async () => {
      // 模擬列表錯誤
      mockS3Send.mockRejectedValueOnce(new Error('Listing failed'));

      const prefix = 'test/';
      await expect(listImages(prefix))
        .rejects.toThrow('Listing failed');
    });
  });

  describe('updateImage 函數', () => {
    it('應該可以成功更新圖片', async () => {
      // 模擬成功更新
      mockS3Send.mockResolvedValueOnce({});

      const newImageData = Buffer.from('Updated content', 'utf-8');
      const result = await updateImage(newImageData, testKey, testContentType);

      // 驗證結果
      expect(result).toEqual({ key: testKey, updated: true });
      expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Key: testKey,
        ContentType: testContentType
      }));
    });

    it('應該在更新失敗時拋出錯誤', async () => {
      // 模擬更新失敗
      mockS3Send.mockRejectedValueOnce(new Error('Update failed'));

      const newImageData = Buffer.from('Updated content', 'utf-8');
      await expect(updateImage(newImageData, testKey, testContentType))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteImage 函數', () => {
    it('應該可以成功刪除圖片', async () => {
      // 模擬成功刪除
      mockS3Send.mockResolvedValueOnce({});

      const result = await deleteImage(testKey);

      // 驗證結果
      expect(result).toEqual({ key: testKey, deleted: true });
      expect(DeleteObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Key: testKey
      }));
    });

    it('應該在刪除失敗時拋出錯誤', async () => {
      // 模擬刪除失敗
      mockS3Send.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(deleteImage(testKey))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('getImageUrl 函數', () => {
    it('應該可以正確生成公開 URL', () => {
      const publicUrl = 'https://r2.example.com';
      const result = getImageUrl(testKey, publicUrl);

      // 驗證結果
      expect(result).toBe('https://r2.example.com/test/' + testKey.split('/')[1]);
    });

    it('應該在末尾沒有斜線的情況下正確處理 URL', () => {
      const publicUrl = 'https://r2.example.com';
      const result = getImageUrl(testKey, publicUrl);

      // 驗證結果
      expect(result).toBe('https://r2.example.com/test/' + testKey.split('/')[1]);
    });

    it('應該在末尾有斜線的情況下正確處理 URL', () => {
      const publicUrl = 'https://r2.example.com/';
      const result = getImageUrl(testKey, publicUrl);

      // 驗證結果
      expect(result).toBe('https://r2.example.com/test/' + testKey.split('/')[1]);
    });

    it('當未提供 publicUrl 時應該拋出錯誤', () => {
      expect(() => getImageUrl(testKey))
        .toThrow('需要提供公開訪問的基礎 URL');
    });
  });

  // 集成測試：模擬完整的上傳-獲取-刪除流程
  describe('集成測試', () => {
    it('應該可以上傳、獲取然後刪除圖片', async () => {
      const integrationKey = `test/integration-${randomUUID()}.txt`;

      // 步驟 1: 上傳圖片
      mockS3Send.mockResolvedValueOnce({});
      const uploadResult = await uploadImage(testImageData, integrationKey, testContentType);
      expect(uploadResult).toHaveProperty('key', integrationKey);

      // 步驟 2: 獲取圖片
      mockS3Send.mockResolvedValueOnce(mockGetObjectResponse);
      const getResult = await getImage(integrationKey);
      expect(getResult).not.toBeNull();
      expect(getResult.data.toString()).toBe('Hello, world!');

      // 步驟 3: 刪除圖片
      mockS3Send.mockResolvedValueOnce({});
      const deleteResult = await deleteImage(integrationKey);
      expect(deleteResult).toEqual({ key: integrationKey, deleted: true });

      // 步驟 4: 確認刪除後找不到圖片
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockS3Send.mockRejectedValueOnce(error);
      const finalResult = await getImage(integrationKey);
      expect(finalResult).toBeNull();
    });
  });
});
