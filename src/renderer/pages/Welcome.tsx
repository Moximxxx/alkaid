import React, { useState, useEffect } from "react"
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

const AI_PROVIDERS = [
  { value: "doubao", label: "豆包 (Volcengine)" },
  { value: "openai", label: "OpenAI" },
  { value: "claude", label: "Claude (Anthropic)" },
] as const

const MODELS = {
  doubao: [
    { value: "doubao-seed-1.6-thinking", label: "豆包 Seed 1.6 深度思考" },
    { value: "doubao-seed-1.6-flash", label: "豆包 Seed 1.6 极速版" },
    { value: "doubao-1.6-thinking", label: "豆包 1.6 深度思考" },
    { value: "doubao-1.6-flash", label: "豆包 1.6 极速版" },
    { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
  ],
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "gpt-4.5", label: "GPT-4.5" },
    { value: "gpt-5", label: "GPT-5" },
  ],
  claude: [
    { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-7-sonnet-20250224", label: "Claude 3.7 Sonnet" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  ],
}

const STEPS = [
  { id: 1, title: "选择模型", description: "选择AI服务商和模型" },
  { id: 2, title: "配置密钥", description: "输入API密钥" },
  { id: 3, title: "完成", description: "准备就绪" },
]

function WelcomePage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const [currentStep, setCurrentStep] = useState(1)
  const [apiKey, setApiKey] = useState(settings.apiKey || "")
  const [apiProvider, setApiProvider] = useState<"doubao" | "openai" | "claude">(settings.apiProvider || "doubao")
  const [model, setModel] = useState(settings.model || MODELS.doubao[0].value)

  const handleProviderChange = (provider: "doubao" | "openai" | "claude") => {
    setApiProvider(provider)
    setModel(MODELS[provider][0].value)
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStart = () => {
    updateSettings({
      apiProvider,
      model,
      apiKey: apiKey.trim() || settings.apiKey,
    })
    navigate("/")
  }

  const selectedProvider = AI_PROVIDERS.find(p => p.value === apiProvider)
  const selectedModel = MODELS[apiProvider as keyof typeof MODELS].find(m => m.value === model)

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
        <Label>AI 提供商</Label>
        <div className="flex flex-wrap gap-2">
          {AI_PROVIDERS.map((provider) => (
            <Button
              key={provider.value}
              variant={apiProvider === provider.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleProviderChange(provider.value)}
            >
              {provider.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="model">模型</Label>
        <select
          id="model"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {MODELS[apiProvider as keyof typeof MODELS].map((m) => (
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

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="输入您的 API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
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

  const renderStep3 = () => (
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
          <span className="text-muted-foreground">AI 提供商</span>
          <span className="font-medium">{selectedProvider?.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">模型</span>
          <span className="font-medium">{selectedModel?.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">API Key</span>
          <span className="font-medium">{apiKey ? "已配置" : "未配置"}</span>
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export { WelcomePage }
