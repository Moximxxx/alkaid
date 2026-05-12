import { encrypt, decrypt, isEncrypted } from '../crypto'
import { describe, it, expect } from 'vitest'

describe('crypto', () => {
  it('encrypt returns iv:cipher format', async () => {
    const result = await encrypt('hello')
    expect(result).toContain(':')
    expect(result.split(':').length).toBe(2)
  })

  it('decrypt reverses encrypt', async () => {
    const encrypted = await encrypt('test message')
    const decrypted = await decrypt(encrypted)
    expect(decrypted).toBe('test message')
  })

  it('encrypt returns empty for empty input', async () => {
    expect(await encrypt('')).toBe('')
  })

  it('decrypt returns empty for empty input', async () => {
    expect(await decrypt('')).toBe('')
  })

  it('decrypt returns original for plaintext (backward compat)', async () => {
    const result = await decrypt('plaintext-not-encrypted')
    expect(result).toBe('plaintext-not-encrypted')
  })

  it('isEncrypted detects encrypted format', () => {
    expect(isEncrypted('abc:def')).toBe(true)
    expect(isEncrypted('plaintext')).toBe(false)
  })
})
