import React from "react"
import { Link } from "react-router-dom"
import { Camera, MessageSquare, Video, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function HomePage() {
  const features = [
    {
      icon: Camera,
      title: "拍照分析",
      description: "拍摄照片，让AI分析图像内容",
      path: "/",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: MessageSquare,
      title: "AI对话",
      description: "与多模态AI进行自然语言对话",
      path: "/",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Video,
      title: "视频通话",
      description: "实时视频流分析与AI交互",
      path: "/video-chat",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">首页</h1>
        <p className="mt-2 text-muted-foreground">选择一个功能开始使用</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={feature.path}>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  开始
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
