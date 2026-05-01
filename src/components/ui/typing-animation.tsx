import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypingAnimationProps {
  children: string
  className?: string
  speed?: number
}

export function TypingAnimation({
  children,
  className,
  speed = 90,
}: TypingAnimationProps) {
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    setDisplayed("")
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setDisplayed(children.slice(0, index))
      if (index >= children.length) window.clearInterval(timer)
    }, speed)
    return () => window.clearInterval(timer)
  }, [children, speed])

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span>{displayed}</span>
      <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current" />
    </span>
  )
}

