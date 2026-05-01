import React from "react"
import { cn } from "@/lib/utils"

export interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  reverse?: boolean
  duration?: number
  radius?: number
  path?: boolean
  iconSize?: number
  speed?: number
}

export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed
  const childCount = React.Children.count(children)

  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-white/20 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}

      {React.Children.map(children, (child, index) => {
        const angle = childCount > 0 ? (360 / childCount) * index : 0
        return (
          <div key={index} className="absolute left-1/2 top-1/2">
            <div
              style={
                {
                  "--duration": calculatedDuration,
                  "--radius": radius,
                  "--angle": angle,
                  "--icon-size": `${iconSize}px`,
                } as React.CSSProperties
              }
              className={cn(
                "animate-orbit absolute -left-[calc(var(--icon-size)/2)] -top-[calc(var(--icon-size)/2)] flex size-(--icon-size) transform-gpu items-center justify-center rounded-full will-change-transform",
                reverse && "[animation-direction:reverse]",
                className
              )}
              {...props}
            >
              {child}
            </div>
          </div>
        )
      })}
    </>
  )
}

