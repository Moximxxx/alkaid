import React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export function PageContainer({
  title,
  description,
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("container mx-auto max-w-6xl px-4 py-6 lg:py-8", className)} {...props}>
      {title && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
