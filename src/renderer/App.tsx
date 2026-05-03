import React, { useState, useEffect } from "react"
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
  const { isConfigured } = useSettings()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isConfigured) {
      navigate("/", { replace: true })
    }
  }, [isConfigured, navigate])

  if (!isConfigured) {
    return <WelcomePage />
  }

  return (
    <div className="min-h-screen bg-background">
      <Toolbar
        theme={theme}
        onThemeToggle={toggleTheme}
        onMenuToggle={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main>
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
