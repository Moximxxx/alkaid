import React, { useState, useEffect, useRef } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { Toolbar } from "@/components/layout/Toolbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { WelcomePage } from "@/pages/Welcome"
import { HomePage } from "@/pages/Home"
import { SettingsPage } from "@/pages/Settings"
import { VideoChatPage } from "@/pages/VideoChat"
import { AboutPage } from "@/pages/About"
import { useTheme } from "@/hooks/useTheme"
import { useSettings } from "@/hooks/useSettings"

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function AppContent() {
  const { theme, toggleTheme } = useTheme()
  const { isConfigured, settings } = useSettings()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const prevSetupCompleted = useRef(settings.setupCompleted)

  useEffect(() => {
    if (!prevSetupCompleted.current && settings.setupCompleted) {
      prevSetupCompleted.current = true
      navigate("/", { replace: true })
    }
  }, [settings.setupCompleted, navigate])

  if (!isConfigured) {
    return <WelcomePage />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toolbar
        theme={theme}
        onThemeToggle={toggleTheme}
        onMenuToggle={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/video-chat" element={<VideoChatPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
