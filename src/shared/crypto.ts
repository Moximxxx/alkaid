/**
 * 简单加密工具 — 使用 Web Crypto API AES-GCM 加密
 * 密钥存储在 sessionStorage（会话隔离，关闭窗口即清除）
 * 兼容 Node.js 和浏览器环境
 */

const ALGORITHM = { name: 'AES-GCM' as const, length: 256 }
const STORAGE_KEY = '__crypto_key__'

async function getKey(): Promise<CryptoKey> {
  // 尝试从 sessionStorage 恢复已有密钥
  const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
  if (stored) {
    const rawKey = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', rawKey, ALGORITHM, false, ['encrypt', 'decrypt'])
  }
  // 生成新密钥
  const key = await crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt'])
  const exported = await crypto.subtle.exportKey('raw', key)
  const rawKey = btoa(String.fromCharCode(...new Uint8Array(exported)))
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, rawKey)
  }
  return key
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return ''
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt({ ...ALGORITHM, iv }, key, encoded)
  // 返回格式: iv(base64):ciphertext(base64)
  const ivStr = btoa(String.fromCharCode(...iv))
  const cipherStr = btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  return `${ivStr}:${cipherStr}`
}

export async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData) return ''
  try {
    const key = await getKey()
    const [ivStr, cipherStr] = encryptedData.split(':')
    if (!ivStr || !cipherStr) return encryptedData // 可能是旧明文数据
    const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0))
    const ciphertext = Uint8Array.from(atob(cipherStr), (c) => c.charCodeAt(0))
    const decrypted = await crypto.subtle.decrypt({ ...ALGORITHM, iv }, key, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch {
    return encryptedData // 解密失败返回原文（兼容旧数据）
  }
}

// 同步版本（用于初始化时不可用 async 的场景）
export function isEncrypted(data: string): boolean {
  return data.includes(':') && data.split(':').length === 2
}
