import { useState, useEffect, useCallback } from "react"

export interface Settings {
  apiProvider: "openai" | "claude" | "doubao"
  apiKey: string
  model: string
  visionProvider: "azure" | "google"
  visionApiKey: string
  visionEndpoint: string
}

const DEFAULT_SETTINGS: Settings = {
  apiProvider: "doubao",
  apiKey: "",
  model: "doubao-1.6-thinking",
  visionProvider: "azure",
  visionApiKey: "",
  visionEndpoint: "",
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

  const isConfigured = settings.apiKey.trim() !== ""

  return {
    settings,
    updateSettings,
    resetSettings,
    isConfigured,
  }
}
