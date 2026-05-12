import { Link, useLocation } from "react-router-dom"
import { Menu, Moon, Sun, Settings, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  theme: "light" | "dark"
  onThemeToggle: () => void
  onMenuToggle?: () => void
  className?: string
}

export function Toolbar({ theme, onThemeToggle, onMenuToggle, className }: ToolbarProps) {
  const location = useLocation()

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
      </div>
    </header>
  )
}
