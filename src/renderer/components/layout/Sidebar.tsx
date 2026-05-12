import { Link, useLocation } from "react-router-dom"
import { Home, Video, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open: boolean
  onClose: () => void
  className?: string
}

export function Sidebar({ open, onClose, className }: SidebarProps) {
  const location = useLocation()

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/video-chat", label: "视频通话", icon: Video },
    { path: "/settings", label: "设置", icon: Settings },
  ]

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r bg-background duration-300 lg:hidden",
          className
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">菜单</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
