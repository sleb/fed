"use client"

import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden"
import * as React from "react"

import { cn } from "@/lib/utils"

function VisuallyHidden({
  className,
  ...props
}: React.ComponentProps<typeof VisuallyHiddenPrimitive.Root>) {
  return (
    <VisuallyHiddenPrimitive.Root
      className={cn(className)}
      {...props}
    />
  )
}

export { VisuallyHidden }
