import React, { useState, useEffect } from "react"
import { Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings, type Settings } from "@/hooks/useSettings"

const AI_PROVIDERS = [
  { value: "doubao", label: "豆包 (Volcengine)" },
  { value: "openai", label: "OpenAI" },
  { value: "claude", label: "Claude (Anthropic)" },
] as const

const MODELS = {
  doubao: [
    { value: "doubao-vision-pro", label: "豆包视觉专业版" },
    { value: "doubao-seed-2.0", label: "豆包Seed 2.0" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  claude: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState<Settings>(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleProviderChange = (provider: Settings["apiProvider"]) => {
    setLocalSettings((prev) => ({
      ...prev,
      apiProvider: provider,
      model: MODELS[provider][0].value,
    }))
  }

  const handleSave = () => {
    updateSettings(localSettings)
  }

  const handleReset = () => {
    resetSettings()
    setLocalSettings(settings)
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="mt-2 text-muted-foreground">配置应用程序</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai">AI 模型</TabsTrigger>
          <TabsTrigger value="camera">摄像头</TabsTrigger>
          <TabsTrigger value="about">关于</TabsTrigger>
        </TabsList>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI 模型配置</CardTitle>
              <CardDescription>选择AI服务提供商并配置API密钥</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider */}
              <div className="space-y-2">
                <Label>AI 提供商</Label>
                <div className="flex flex-wrap gap-2">
                  {AI_PROVIDERS.map((provider) => (
                    <Button
                      key={provider.value}
                      variant={localSettings.apiProvider === provider.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleProviderChange(provider.value)}
                    >
                      {provider.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="输入您的 API Key"
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">模型</Label>
                <select
                  id="model"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.model}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, model: e.target.value }))}
                >
                  {MODELS[localSettings.apiProvider].map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Settings */}
        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle>摄像头设置</CardTitle>
              <CardDescription>配置摄像头选项</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">摄像头设置功能开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>关于摇光</CardTitle>
              <CardDescription>应用程序信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>版本：</strong>0.2.0</p>
              <p><strong>描述：</strong>智能摄像头AI助手</p>
              <p className="text-muted-foreground text-sm mt-4">
                摇光是一个基于 Electron + React 的多模态AI助手，支持拍照分析、实时视频通话和AI对话功能。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
