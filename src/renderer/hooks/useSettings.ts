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
        return { ...DEFAULT_SETTINGS, ...parsed }
      } catch {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

  // 存储时直接明文保存（不再加密）
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings))
  }, [settings])

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
