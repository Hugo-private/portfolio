import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineNode {
  id: string
  itemNumber: number
  name: string
  isActive?: boolean
  label?: string
}

interface TimelineProps {
  nodes: TimelineNode[]
  className?: string
}

const Timeline: React.FC<TimelineProps> = ({ nodes, className }) => {
  return (
    <div className={cn("relative w-full py-16", className)}>
      {/* 彎曲的弧線 */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
        style={{ height: "100%", width: "100%" }}
      >
        <path
          d="M 100 50 Q 400 150, 700 250"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-border"
        />
      </svg>

      {/* 節點容器 */}
      <div className="relative grid grid-cols-3 gap-4 h-full">
        {nodes.map((node, index) => (
          <div
            key={node.id}
            className={cn(
              "relative flex flex-col items-center",
              index === 0 && "items-start",
              index === 1 && "items-center",
              index === 2 && "items-end"
            )}
            style={{
              marginTop: index === 0 ? "0" : index === 1 ? "8rem" : "16rem",
            }}
          >
            <div
              className={cn(
                "flex flex-col items-center gap-2",
                index === 0 && "items-start",
                index === 2 && "items-end"
              )}
            >
              <div
                className={cn(
                  "rounded-full border-2 flex items-center justify-center relative z-10",
                  node.isActive
                    ? "w-12 h-12 bg-foreground border-foreground shadow-lg"
                    : "w-8 h-8 bg-background border-border"
                )}
              >
                {node.isActive && (
                  <div className="w-4 h-4 rounded-full bg-background" />
                )}
              </div>
              <div
                className={cn(
                  "text-sm whitespace-nowrap",
                  node.isActive ? "font-bold" : "text-muted-foreground"
                )}
              >
                {node.itemNumber}_{node.name}
              </div>
              {node.label && node.isActive && (
                <div className="text-xs text-muted-foreground">
                  {node.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Timeline
