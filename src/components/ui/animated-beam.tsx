import { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedBeamProps {
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  startYOffset?: number
  endYOffset?: number
  curvature?: number
  reverse?: boolean
  className?: string
  duration?: number
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  startYOffset = 0,
  endYOffset = 0,
  curvature = 0,
  reverse = false,
  className,
  duration = 2.8,
}: AnimatedBeamProps) {
  const [path, setPath] = useState("")
  const gradientId = useId().replace(/:/g, "")

  useEffect(() => {
    const updatePath = () => {
      const container = containerRef.current
      const from = fromRef.current
      const to = toRef.current
      if (!container || !from || !to) return

      const containerRect = container.getBoundingClientRect()
      const fromRect = from.getBoundingClientRect()
      const toRect = to.getBoundingClientRect()

      const startX = fromRect.left - containerRect.left + fromRect.width / 2
      const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset
      const endX = toRect.left - containerRect.left + toRect.width / 2
      const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset

      const cx = (startX + endX) / 2
      const cy = (startY + endY) / 2 + curvature
      setPath(`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`)
    }

    updatePath()
    const resizeObserver = new ResizeObserver(updatePath)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    window.addEventListener("resize", updatePath)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePath)
    }
  }, [containerRef, fromRef, toRef, startYOffset, endYOffset, curvature])

  return (
    <svg className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {reverse ? (
            <>
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
              <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.1" />
              <stop offset="45%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="8 8"
        style={{ animation: `beam-flow ${duration}s linear infinite` }}
      />
    </svg>
  )
}

