import { useState, useEffect, useCallback } from "react"

export interface Settings {
  visionProvider: "doubao_vision" | "google_vision"
  visionApiKey: string
  visionModel: string
  textProvider: "doubao" | "openai" | "glm" | "minimax" | "xiaomi" | "kimi" | "deepseek" | "claude" | "google"
  textApiKey: string
  textModel: string
  setupCompleted?: boolean
  // 摄像头设置
  cameraDeviceId?: string
  cameraResolution?: string  // "1280x720"
  cameraFps?: number
  cameraMirror?: boolean
  // TTS 设置
  ttsEnabled?: boolean
  ttsRate?: number
  ttsPitch?: number
  ttsVoiceURI?: string
}

const DEFAULT_SETTINGS: Settings = {
  visionProvider: "doubao_vision",
  visionApiKey: "",
  visionModel: "doubao-2.0-vision-pro",
  textProvider: "openai",
  textApiKey: "",
  textModel: "gpt-4.1",
  cameraResolution: "1280x720",
  cameraFps: 30,
  cameraMirror: false,
  ttsEnabled: true,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoiceURI: '',
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 初始加载不解密（解密是异步的），挂载后由 decrypt effect 处理
        const decrypted: Partial<Settings> = {}
        if (parsed.visionApiKey && typeof parsed.visionApiKey === 'string') {
          decrypted.visionApiKey = parsed.visionApiKey
        }
        if (parsed.textApiKey && typeof parsed.textApiKey === 'string') {
          decrypted.textApiKey = parsed.textApiKey
        }
        return { ...DEFAULT_SETTINGS, ...parsed, ...decrypted }
      } catch {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

  // 保存时加密 API Key
  useEffect(() => {
    async function saveEncrypted() {
      const { encrypt } = await import('@shared/crypto')
      const dataToSave = { ...settings }
      if (dataToSave.visionApiKey) {
        dataToSave.visionApiKey = await encrypt(dataToSave.visionApiKey)
      }
      if (dataToSave.textApiKey) {
        dataToSave.textApiKey = await encrypt(dataToSave.textApiKey)
      }
      localStorage.setItem("settings", JSON.stringify(dataToSave))
    }
    saveEncrypted()
  }, [settings])

  // 挂载后解密已存储的加密数据
  useEffect(() => {
    async function decryptStored() {
      const saved = localStorage.getItem("settings")
      if (!saved) return
      const { decrypt } = await import('@shared/crypto')
      const { isEncrypted } = await import('@shared/crypto')
      try {
        const parsed = JSON.parse(saved)
        let needUpdate = false
        if (parsed.visionApiKey && typeof parsed.visionApiKey === 'string' && isEncrypted(parsed.visionApiKey)) {
          parsed.visionApiKey = await decrypt(parsed.visionApiKey)
          needUpdate = true
        }
        if (parsed.textApiKey && typeof parsed.textApiKey === 'string' && isEncrypted(parsed.textApiKey)) {
          parsed.textApiKey = await decrypt(parsed.textApiKey)
          needUpdate = true
        }
        if (needUpdate) {
          setSettings(prev => ({ ...prev, ...parsed }))
        }
      } catch {
        // ignore parse errors
      }
    }
    decryptStored()
  }, [])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const isConfigured = settings.setupCompleted || 
                         settings.textApiKey.trim() !== "" || 
                         settings.visionApiKey.trim() !== ""

  return {
    settings,
    updateSettings,
    resetSettings,
    isConfigured,
  }
}
