import { Target, Github, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">关于</h1>
        <p className="mt-2 text-muted-foreground">了解更多关于摇光的信息</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">摇光</h2>
            <p className="text-muted-foreground">版本 0.2.0</p>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>项目介绍</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              摇光是一款基于 Electron + React 构建的智能摄像头AI助手。
              它集成了多模态AI能力，支持拍照分析、实时视频通话和自然语言对话功能。
            </p>
            <p className="mt-4">
              支持多种AI服务提供商，包括豆包 (Volcengine)、OpenAI 和 Claude，
              让您可以根据需求灵活选择。
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>功能特点</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• 多模态AI对话支持</li>
              <li>• 实时视频流分析</li>
              <li>• 图像识别与描述</li>
              <li>• 深色/浅色主题切换</li>
              <li>• 响应式设计，支持移动端</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>技术栈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Electron", "React", "TypeScript", "Tailwind CSS", "Vite", "shadcn/ui"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>链接</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="https://github.com/Moximxxx/alkaid"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Github className="w-4 h-4" />
              GitHub 仓库
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            用 <Heart className="w-4 h-4 text-red-500" /> 制作
          </p>
        </div>
      </div>
    </div>
  )
}
