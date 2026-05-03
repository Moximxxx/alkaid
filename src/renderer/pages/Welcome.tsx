import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Target, Key, ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useSettings } from "@/hooks/useSettings"

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

const STEPS = [
  { id: 1, title: "视觉模型", description: "选择视觉模型" },
  { id: 2, title: "文本模型", description: "选择文本模型" },
  { id: 3, title: "配置密钥", description: "输入API密钥" },
  { id: 4, title: "完成", description: "准备就绪" },
]

function WelcomePage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const [currentStep, setCurrentStep] = useState(1)
  const [visionApiKey, setVisionApiKey] = useState(settings.visionApiKey || "")
  const [visionModel, setVisionModel] = useState(settings.visionModel || VISION_MODELS[0].value)
  const [textProvider, setTextProvider] = useState<typeof TEXT_PROVIDERS[number]["value"]>(settings.textProvider || "openai")
  const [textApiKey, setTextApiKey] = useState(settings.textApiKey || "")
  const [textModel, setTextModel] = useState(settings.textModel || TEXT_MODELS.openai[0].value)

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleTextProviderChange = (provider: typeof TEXT_PROVIDERS[number]["value"]) => {
    setTextProvider(provider)
    setTextModel(TEXT_MODELS[provider][0].value)
  }

  const handleStart = () => {
    updateSettings({
      visionApiKey: visionApiKey.trim() || settings.visionApiKey,
      visionModel,
      textProvider,
      textApiKey: textApiKey.trim() || settings.textApiKey,
      textModel,
    })
    navigate("/")
  }

  const selectedVisionModel = VISION_MODELS.find(m => m.value === visionModel)
  const selectedTextProvider = TEXT_PROVIDERS.find(p => p.value === textProvider)
  const selectedTextModel = TEXT_MODELS[textProvider].find(m => m.value === textModel)

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <div className="hidden sm:block text-sm font-medium">
              {step.title}
            </div>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 transition-colors ${
                currentStep > step.id ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>视觉模型</Label>
        <div className="space-y-2">
          {VISION_MODELS.map((model) => (
            <div
              key={model.value}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                visionModel === model.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setVisionModel(model.value)}
            >
              <span className="font-medium">{model.label}</span>
              {visionModel === model.value && <Check className="w-4 h-4 text-primary" />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNext}>
          下一步
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>文本供应商</Label>
        <div className="flex flex-wrap gap-2">
          {TEXT_PROVIDERS.map((provider) => (
            <Button
              key={provider.value}
              variant={textProvider === provider.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTextProviderChange(provider.value)}
            >
              {provider.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="textModel">模型</Label>
        <select
          id="textModel"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={textModel}
          onChange={(e) => setTextModel(e.target.value)}
        >
          {TEXT_MODELS[textProvider].map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNext}>
          下一步
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="visionApiKey">视觉模型 API Key</Label>
        <Input
          id="visionApiKey"
          type="password"
          placeholder="输入视觉模型 API Key"
          value={visionApiKey}
          onChange={(e) => setVisionApiKey(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="textApiKey">文本模型 API Key</Label>
        <Input
          id="textApiKey"
          type="password"
          placeholder="输入文本模型 API Key"
          value={textApiKey}
          onChange={(e) => setTextApiKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          您的 API Key 将安全存储在本地
        </p>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </Button>
        <Button onClick={handleNext}>
          下一步
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">配置完成</h3>
        <p className="text-muted-foreground text-sm mt-1">准备开始使用摇光</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">视觉模型</span>
          <span className="font-medium">{selectedVisionModel?.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">文本供应商</span>
          <span className="font-medium">{selectedTextProvider?.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">文本模型</span>
          <span className="font-medium">{selectedTextModel?.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">视觉 API Key</span>
          <span className="font-medium">{visionApiKey ? "已配置" : "未配置"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">文本 API Key</span>
          <span className="font-medium">{textApiKey ? "已配置" : "未配置"}</span>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </Button>
        <Button onClick={handleStart}>
          开始使用
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">欢迎使用摇光</h1>
            <p className="mt-2 text-muted-foreground">您的智能摄像头AI助手</p>
          </div>
        </div>

        <Dialog open={true}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>快速配置</DialogTitle>
              <DialogDescription>
                按照以下步骤完成初始配置
              </DialogDescription>
            </DialogHeader>
            {renderStepIndicator()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export { WelcomePage }
