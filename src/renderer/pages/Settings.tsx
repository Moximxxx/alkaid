import { useState, useEffect, useCallback } from "react"
import { Save, RotateCcw, Info, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings, type Settings } from "@/hooks/useSettings"
import { APP_VERSION, VISION_MODELS, TEXT_PROVIDERS, TEXT_MODELS } from '@shared/constants'
import { DEFAULT_SHORTCUTS } from '@shared/types'

/** 分辨率选项 */
const RESOLUTION_OPTIONS = [
  { value: "640x480", label: "480p (640×480)" },
  { value: "1280x720", label: "720p (1280×720)" },
  { value: "1920x1080", label: "1080p (1920×1080)" },
]

interface MediaDeviceInfo {
  deviceId: string
  label: string
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState<Settings>(settings)
  const [activeTab, setActiveTab] = useState("ai")
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 摄像头设备列表
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  // TTS 语音列表
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // 加载摄像头设备
  useEffect(() => {
    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `摄像头 ${d.deviceId.slice(0, 8)}...` }))
        setCameraDevices(videoDevices)
      } catch {
        // 枚举设备失败时保持空列表
      }
    }
    loadDevices()
  }, [])

  // 加载 TTS 语音（支持语音变化时重新加载）
  useEffect(() => {
    function loadVoices() {
      const allVoices = window.speechSynthesis?.getVoices() ?? []
      // 过滤中文语音（包含 zh 的语音）
      const chineseVoices = allVoices.filter((v) => v.lang.startsWith("zh"))
      setVoices(chineseVoices.length > 0 ? chineseVoices : allVoices)
    }
    // 某些浏览器异步加载语音列表
    loadVoices()
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

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
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleReset = () => {
    resetSettings()
    setLocalSettings(settings)
  }

  const updateLocal = useCallback((updates: Partial<Settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }))
  }, [])

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
          <TabsTrigger value="tts">语音合成</TabsTrigger>
          <TabsTrigger value="shortcuts">快捷键</TabsTrigger>
          <TabsTrigger value="about">关于</TabsTrigger>
        </TabsList>

        {/* ============ AI Settings ============ */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>视觉模型配置</CardTitle>
              <CardDescription>选择视觉模型和API密钥</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>视觉模型</Label>
                <select
                  id="visionModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.visionModel}
                  onChange={(e) => updateLocal({ visionModel: e.target.value })}
                >
                  {VISION_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visionApiKey">视觉模型 API Key</Label>
                <Input
                  id="visionApiKey"
                  type="password"
                  placeholder="输入视觉模型 API Key"
                  value={localSettings.visionApiKey}
                  onChange={(e) => updateLocal({ visionApiKey: e.target.value })}
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

              <div className="space-y-2">
                <Label htmlFor="textApiKey">文本模型 API Key</Label>
                <Input
                  id="textApiKey"
                  type="password"
                  placeholder="输入文本模型 API Key"
                  value={localSettings.textApiKey}
                  onChange={(e) => updateLocal({ textApiKey: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="textModel">模型</Label>
                <select
                  id="textModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.textModel}
                  onChange={(e) => updateLocal({ textModel: e.target.value })}
                >
                  {TEXT_MODELS[localSettings.textProvider].map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 items-center">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </Button>
                {saveSuccess && (
                  <span className="text-green-500 text-sm">保存成功</span>
                )}
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Camera Settings ============ */}
        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle>摄像头设置</CardTitle>
              <CardDescription>配置摄像头设备和画面参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 设备选择 */}
              <div className="space-y-2">
                <Label htmlFor="cameraDevice">摄像头设备</Label>
                <select
                  id="cameraDevice"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.cameraDeviceId ?? ""}
                  onChange={(e) => updateLocal({ cameraDeviceId: e.target.value || undefined })}
                >
                  <option value="">默认摄像头</option>
                  {cameraDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {cameraDevices.length === 0 ? "未检测到摄像头设备，请确保已连接摄像头" : `检测到 ${cameraDevices.length} 个摄像头`}
                </p>
              </div>

              {/* 分辨率选择 */}
              <div className="space-y-2">
                <Label htmlFor="cameraResolution">分辨率</Label>
                <select
                  id="cameraResolution"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.cameraResolution ?? "1280x720"}
                  onChange={(e) => updateLocal({ cameraResolution: e.target.value })}
                >
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* FPS 滑块 */}
              <div className="space-y-2">
                <Label htmlFor="cameraFps">
                  帧率：{localSettings.cameraFps ?? 30} FPS
                </Label>
                <input
                  id="cameraFps"
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={localSettings.cameraFps ?? 30}
                  onChange={(e) => updateLocal({ cameraFps: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 FPS</span>
                  <span>60 FPS</span>
                </div>
              </div>

              {/* 镜像翻转 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cameraMirror">镜像翻转</Label>
                  <p className="text-xs text-muted-foreground">水平翻转摄像头画面</p>
                </div>
                <Switch
                  id="cameraMirror"
                  checked={localSettings.cameraMirror ?? false}
                  onCheckedChange={(checked) => updateLocal({ cameraMirror: checked })}
                />
              </div>
            </CardContent>
          </Card>
          {/* 底部保存/重置按钮 */}
          <div className="flex gap-4 items-center mt-6">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              保存设置
            </Button>
            {saveSuccess && (
              <span className="text-green-500 text-sm">保存成功</span>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
          </div>
        </TabsContent>

        {/* ============ TTS Settings ============ */}
        <TabsContent value="tts">
          <Card>
            <CardHeader>
              <CardTitle>语音合成设置</CardTitle>
              <CardDescription>配置朗读语音参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 启用/禁用 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ttsEnabled">启用语音合成</Label>
                  <p className="text-xs text-muted-foreground">AI 回复时朗读文本</p>
                </div>
                <Switch
                  id="ttsEnabled"
                  checked={localSettings.ttsEnabled ?? true}
                  onCheckedChange={(checked) => updateLocal({ ttsEnabled: checked })}
                />
              </div>

              {/* 语速 */}
              <div className="space-y-2">
                <Label htmlFor="ttsRate">
                  语速：{localSettings.ttsRate ?? 1}x
                </Label>
                <input
                  id="ttsRate"
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={localSettings.ttsRate ?? 1}
                  onChange={(e) => updateLocal({ ttsRate: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* 音高 */}
              <div className="space-y-2">
                <Label htmlFor="ttsPitch">
                  音高：{localSettings.ttsPitch ?? 1}
                </Label>
                <input
                  id="ttsPitch"
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={localSettings.ttsPitch ?? 1}
                  onChange={(e) => updateLocal({ ttsPitch: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>低沉</span>
                  <span>正常</span>
                  <span>尖锐</span>
                </div>
              </div>

              {/* 语音选择 */}
              <div className="space-y-2">
                <Label htmlFor="ttsVoice">发音人</Label>
                <select
                  id="ttsVoice"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.ttsVoiceURI ?? ""}
                  onChange={(e) => updateLocal({ ttsVoiceURI: e.target.value })}
                >
                  <option value="">系统默认</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {voices.length === 0 ? "未加载语音列表，请重试页面" : `已加载 ${voices.length} 个中文语音`}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-4 items-center mt-6">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              保存设置
            </Button>
            {saveSuccess && (
              <span className="text-green-500 text-sm">保存成功</span>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
          </div>
        </TabsContent>

        {/* ============ Shortcuts ============ */}
        <TabsContent value="shortcuts">
          <Card>
            <CardHeader>
              <CardTitle>快捷键</CardTitle>
              <CardDescription>查看应用程序快捷键</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">显示/隐藏窗口</p>
                    <p className="text-sm text-muted-foreground">切换主窗口的显示状态</p>
                  </div>
                  <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-2.5 py-1.5 text-sm font-mono font-medium text-muted-foreground shadow-sm">
                    <Keyboard className="w-3.5 h-3.5" />
                    {DEFAULT_SHORTCUTS.toggleWindow}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">发送消息</p>
                    <p className="text-sm text-muted-foreground">在聊天输入框中发送当前消息</p>
                  </div>
                  <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-2.5 py-1.5 text-sm font-mono font-medium text-muted-foreground shadow-sm">
                    <Keyboard className="w-3.5 h-3.5" />
                    {DEFAULT_SHORTCUTS.sendMessage}
                  </kbd>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <Info className="w-3.5 h-3.5 inline mr-1" />
                快捷键暂不支持自定义，后续版本将开放配置功能。
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ About ============ */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>关于摇光</CardTitle>
              <CardDescription>应用程序信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>版本：</strong>{APP_VERSION}</p>
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
