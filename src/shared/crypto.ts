/**
 * @deprecated API Key 加密已被移除，现直接明文存储到 localStorage。
 * 此文件保留仅用于避免已存在的引用报错，所有函数均为空壳。
 * 已废弃：跨会话密钥丢失导致 API Key 解密失败→401，改为明文存储
 */

export async function encrypt(plaintext: string): Promise<string> {
  // 已废弃：直接返回原文
  return plaintext
}

export async function decrypt(encryptedData: string): Promise<string> {
  // 已废弃：直接返回原文
  return encryptedData
}

export function isEncrypted(_data: string): boolean {
  // 已废弃：始终返回 false
  return false
}
