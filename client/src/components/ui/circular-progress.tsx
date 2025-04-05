import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  max,
  size = 80,
  strokeWidth = 5,
  className,
  trackClassName,
  progressClassName,
  children
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(0, value), max);
  const progressOffset = circumference - (progress / max) * circumference;
  
  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn("fill-transparent stroke-muted", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          className={cn("fill-transparent stroke-primary transition-all duration-300 ease-in-out", progressClassName)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
