"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border shadow-lg font-sans",
          description: "group-[.toast]:text-muted-foreground text-sm",
          success: "group toast group-[.toaster]:bg-[var(--spa-success)]/10 group-[.toaster]:text-[var(--spa-success)] group-[.toaster]:border-[var(--spa-success)]/20",
          error: "group toast group-[.toaster]:bg-[var(--spa-danger)]/10 group-[.toaster]:text-[var(--spa-danger)] group-[.toaster]:border-[var(--spa-danger)]/20",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
