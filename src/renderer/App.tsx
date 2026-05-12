import { useState, useEffect, useRef } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Toolbar } from "@/components/layout/Toolbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { WelcomePage } from "@/pages/Welcome"
import { HomePage } from "@/pages/Home"
import { SettingsPage } from "@/pages/Settings"
import { VideoChatPage } from "@/pages/VideoChat"
import { AboutPage } from "@/pages/About"
import { useTheme } from "@/hooks/useTheme"
import { useSettings } from "@/hooks/useSettings"
import { useChatHistory } from "@/hooks/useChatHistory"

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
  const location = useLocation()
  const isVideoChat = location.pathname === '/video-chat'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const prevSetupCompleted = useRef(settings.setupCompleted)
  const { conversations, remove } = useChatHistory()

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
      {!isVideoChat && (
        <Toolbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onMenuToggle={() => setSidebarOpen(true)}
        />
      )}
      {!isVideoChat && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations.map(c => ({ id: c.id, title: c.title }))}
          onDeleteConversation={remove}
        />
      )}

      <main className={isVideoChat ? 'flex-1' : 'flex-1 flex flex-col'}>
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
