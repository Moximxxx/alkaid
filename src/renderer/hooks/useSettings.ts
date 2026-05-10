import { useState, useEffect, useCallback } from "react"

export interface Settings {
  visionProvider: "doubao_vision"
  visionApiKey: string
  visionModel: string
  textProvider: "doubao" | "openai" | "glm" | "minimax" | "xiaomi" | "kimi" | "deepseek" | "claude"
  textApiKey: string
  textModel: string
  setupCompleted?: boolean
}

const DEFAULT_SETTINGS: Settings = {
  visionProvider: "doubao_vision",
  visionApiKey: "",
  visionModel: "doubao-2.0-vision-pro",
  textProvider: "openai",
  textApiKey: "",
  textModel: "gpt-4.1",
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("settings")
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      } catch {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

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
