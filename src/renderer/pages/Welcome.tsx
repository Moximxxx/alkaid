import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Target, Key, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings } from "@/hooks/useSettings"

export function WelcomePage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const [apiKey, setApiKey] = useState(settings.apiKey)

  const handleStart = () => {
    if (apiKey.trim()) {
      updateSettings({ apiKey: apiKey.trim() })
    }
    navigate("/")
  }

  const features = [
    { icon: Target, title: "智能识别", desc: "支持多模态AI分析" },
    { icon: Sparkles, title: "多模型支持", desc: "OpenAI/Claude/豆包" },
    { icon: Key, title: "安全配置", desc: "API密钥本地存储" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">欢迎使用摇光</h1>
            <p className="mt-2 text-muted-foreground">您的智能摄像头AI助手</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader className="pb-2">
                <feature.icon className="w-6 h-6 mx-auto text-primary" />
                <CardTitle className="text-sm">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{feature.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Key Input */}
        <Card>
          <CardHeader>
            <CardTitle>快速配置</CardTitle>
            <CardDescription>
              输入您的 API Key 开始使用，或稍后在设置页面配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="输入您的 API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleStart}>
              开始使用
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
