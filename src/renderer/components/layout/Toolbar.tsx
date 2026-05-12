import { Link, useLocation } from "react-router-dom"
import { ChevronDown, Menu, Mic, Moon, Settings, Sun, Target, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { useSettings } from "@/hooks/useSettings"

interface ToolbarProps {
  theme: "light" | "dark"
  onThemeToggle: () => void
  onMenuToggle?: () => void
  className?: string
}

export function Toolbar({ theme, onThemeToggle, onMenuToggle, className }: ToolbarProps) {
  const location = useLocation()
  const { settings, updateSettings } = useSettings()
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([])
  const [showCameraList, setShowCameraList] = useState(false)
  const [showMicList, setShowMicList] = useState(false)
  const camRef = useRef<HTMLDivElement>(null)
  const micRef = useRef<HTMLDivElement>(null)

  // 获取设备列表
  const fetchDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    setCameraDevices(devices.filter(d => d.kind === 'videoinput'))
    setMicDevices(devices.filter(d => d.kind === 'audioinput'))
  }

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (camRef.current && !camRef.current.contains(e.target as Node)) setShowCameraList(false)
      if (micRef.current && !micRef.current.contains(e.target as Node)) setShowMicList(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navItems = [
    { path: "/", label: "首页" },
    { path: "/video-chat", label: "视频通话" },
  ]

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6",
        className
      )}
    >
      {/* Left: Logo and Mobile Menu */}
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link to="/" className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold hidden sm:inline">摇光</span>
        </Link>
      </div>

      {/* Center: Navigation */}
      <nav className="hidden lg:flex items-center gap-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              size="sm"
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onThemeToggle}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>

        {/* 摄像头选择 */}
        <div ref={camRef} className="relative">
          <button
            onClick={() => { fetchDevices(); setShowCameraList(!showCameraList); setShowMicList(false) }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded"
            title="选择摄像头"
          >
            <Video className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showCameraList && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {cameraDevices.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">无可用设备</div>}
              {cameraDevices.map(d => (
                <button
                  key={d.deviceId}
                  onClick={() => { updateSettings({ cameraDeviceId: d.deviceId }); setShowCameraList(false) }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 ${
                    settings.cameraDeviceId === d.deviceId ? 'text-blue-400 bg-gray-700' : 'text-gray-300'
                  }`}
                >
                  {d.label || `摄像头 ${d.deviceId.slice(0, 8)}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 麦克风选择 */}
        <div ref={micRef} className="relative">
          <button
            onClick={() => { fetchDevices(); setShowMicList(!showMicList); setShowCameraList(false) }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded"
            title="选择麦克风"
          >
            <Mic className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showMicList && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {micDevices.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">无可用设备</div>}
              {micDevices.map(d => (
                <button
                  key={d.deviceId}
                  onClick={() => { updateSettings({ audioDeviceId: d.deviceId }); setShowMicList(false) }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 ${
                    settings.audioDeviceId === d.deviceId ? 'text-green-400 bg-gray-700' : 'text-gray-300'
                  }`}
                >
                  {d.label || `麦克风 ${d.deviceId.slice(0, 8)}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
