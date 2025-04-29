// r2Service.js - 簡化版圖片操作服務
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";

// 創建 R2 客戶端
const r2 = new S3Client({
  region: process.env.VITE_R2_REGION,
  endpoint: process.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.VITE_R2_BUCKET;

/**
 * 上傳圖片到 R2
 * @param {Buffer | Uint8Array | Blob | string} imageData - 圖片數據
 * @param {string} key - 存儲路徑 (例如: images/product/123.jpg)
 * @param {string} contentType - 圖片類型 (例如: image/jpeg, image/png)
 * @returns {Promise<{key: string}>} - 成功上傳的圖片路徑
 */
export async function uploadImage(imageData, key, contentType = "image/jpeg") {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: imageData,
    ContentType: contentType,
  });

  await r2.send(command);
  return { key };
}

/**
 * 取得圖片
 * @param {string} key - 圖片路徑
 * @returns {Promise<{data: Uint8Array, contentType: string} | null>} - 圖片數據與類型，若不存在則返回 null
 */
export async function getImage(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  try {
    const response = await r2.send(command);

    // 將圖片數據從串流轉為完整的 buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    // 合併所有片段為一個完整的 buffer
    const imageBuffer = Buffer.concat(chunks);

    return {
      data: imageBuffer,
      contentType: response.ContentType || 'image/jpeg',
    };
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return null; // 圖片不存在
    }
    throw error; // 其他錯誤直接拋出
  }
}

/**
 * 檢查圖片是否存在
 * @param {string} key - 圖片路徑
 * @returns {Promise<boolean>} - 圖片是否存在
 */
export async function imageExists(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await r2.send(command);
    return true; // 如果沒有錯誤，表示圖片存在
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return false; // 圖片不存在
    }
    throw error; // 其他錯誤直接拋出
  }
}

/**
 * 列出指定資料夾下的所有圖片
 * @param {string} prefix - 資料夾路徑 (例如: images/product/)
 * @returns {Promise<string[]>} - 圖片路徑列表
 */
export async function listImages(prefix) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  });

  const response = await r2.send(command);
  return response.Contents?.map(item => item.Key) || [];
}

/**
 * 更新圖片 (替換圖片內容)
 * @param {Buffer | Uint8Array | Blob | string} newImageData - 新的圖片數據
 * @param {string} key - 圖片路徑
 * @param {string} contentType - 圖片類型 (例如: image/jpeg, image/png)
 * @returns {Promise<{key: string, updated: boolean}>} - 更新結果
 */
export async function updateImage(newImageData, key, contentType = "image/jpeg") {
  // 更新圖片就是重新上傳，覆蓋原有的圖片
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: newImageData,
    ContentType: contentType,
  });

  await r2.send(command);
  return { key, updated: true };
}

/**
 * 刪除圖片
 * @param {string} key - 圖片路徑
 * @returns {Promise<{key: string, deleted: boolean}>} - 刪除結果
 */
export async function deleteImage(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await r2.send(command);
  return { key, deleted: true };
}

/**
 * 獲取圖片的公開 URL (如果已啟用公開訪問)
 * @param {string} key - 圖片路徑
 * @param {string} publicUrl - R2 的公開訪問基礎 URL
 * @returns {string} - 圖片的公開 URL
 */
export function getImageUrl(key, publicUrl) {
  if (!publicUrl) {
    throw new Error('需要提供公開訪問的基礎 URL');
  }

  const baseUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
  return `${baseUrl}${key}`;
}
