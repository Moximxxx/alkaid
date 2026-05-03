import React, { useState, useEffect } from "react"
import { Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings, type Settings } from "@/hooks/useSettings"

const VISION_MODELS = [
  { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
  { value: "doubao-1.6-vision", label: "豆包 1.6 视觉" },
]

const TEXT_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "glm", label: "GLM" },
  { value: "minimax", label: "MiniMax" },
  { value: "xiaomi", label: "Xiaomi MiMo" },
  { value: "kimi", label: "Kimi" },
  { value: "deepseek", label: "DeepSeek" },
] as const

const TEXT_MODELS = {
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "gpt-4.5", label: "GPT-4.5" },
    { value: "gpt-5", label: "GPT-5" },
  ],
  glm: [
    { value: "glm-4.5", label: "GLM-4.5" },
    { value: "glm-4-plus", label: "GLM-4-Plus" },
    { value: "glm-z1-32b", label: "GLM-Z1-32B" },
    { value: "glm-4v-plus", label: "GLM-4V-Plus" },
  ],
  minimax: [
    { value: "minimax-m2.1", label: "MiniMax-M2.1" },
    { value: "minimax-text-01", label: "MiniMax-Text-01" },
  ],
  xiaomi: [
    { value: "mimo-v2-pro", label: "MiMo-V2-Pro" },
    { value: "mimo-v2-flash", label: "MiMo-V2-Flash" },
  ],
  kimi: [
    { value: "kimi-k2", label: "Kimi K2" },
    { value: "kimi-k2-thinking", label: "Kimi K2 Thinking" },
    { value: "kimi-1.5", label: "Kimi k1.5" },
  ],
  deepseek: [
    { value: "deepseek-v3-0324", label: "DeepSeek V3-0324" },
    { value: "deepseek-r1", label: "DeepSeek R1" },
  ],
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState<Settings>(settings)
  const [activeTab, setActiveTab] = useState("ai")

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleTextProviderChange = (provider: Settings["textProvider"]) => {
    setLocalSettings((prev) => ({
      ...prev,
      textProvider: provider,
      textModel: TEXT_MODELS[provider][0].value,
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai">AI 模型</TabsTrigger>
          <TabsTrigger value="camera">摄像头</TabsTrigger>
          <TabsTrigger value="about">关于</TabsTrigger>
        </TabsList>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>视觉模型配置</CardTitle>
              <CardDescription>选择视觉模型和API密钥</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vision Model */}
              <div className="space-y-2">
                <Label>视觉模型</Label>
                <select
                  id="visionModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.visionModel}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, visionModel: e.target.value }))}
                >
                  {VISION_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vision API Key */}
              <div className="space-y-2">
                <Label htmlFor="visionApiKey">视觉模型 API Key</Label>
                <Input
                  id="visionApiKey"
                  type="password"
                  placeholder="输入视觉模型 API Key"
                  value={localSettings.visionApiKey}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, visionApiKey: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>文本模型配置</CardTitle>
              <CardDescription>选择文本模型供应商和API密钥</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Provider */}
              <div className="space-y-2">
                <Label>文本供应商</Label>
                <div className="flex flex-wrap gap-2">
                  {TEXT_PROVIDERS.map((provider) => (
                    <Button
                      key={provider.value}
                      variant={localSettings.textProvider === provider.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTextProviderChange(provider.value as Settings["textProvider"])}
                    >
                      {provider.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Text API Key */}
              <div className="space-y-2">
                <Label htmlFor="textApiKey">文本模型 API Key</Label>
                <Input
                  id="textApiKey"
                  type="password"
                  placeholder="输入文本模型 API Key"
                  value={localSettings.textApiKey}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, textApiKey: e.target.value }))}
                />
              </div>

              {/* Text Model */}
              <div className="space-y-2">
                <Label htmlFor="textModel">模型</Label>
                <select
                  id="textModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.textModel}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, textModel: e.target.value }))}
                >
                  {TEXT_MODELS[localSettings.textProvider].map((model) => (
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
