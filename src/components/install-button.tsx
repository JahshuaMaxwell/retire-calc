"use client"

import { useEffect, useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  async function download() {
    if (!promptEvent) {
      document.getElementById("install-steps")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    setDismissed(choice.outcome === "dismissed")
    setPromptEvent(null)
  }

  return (
    <div className="grid gap-3">
      <button type="button" className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")} onClick={() => void download()}>
        Download app
      </button>
      <p className="text-sm leading-6 text-muted-foreground">
        {promptEvent
          ? "This browser can install Cove directly."
          : "If this browser does not offer install yet, use the steps below."}
        {dismissed ? " Install was canceled. You can try again from the browser menu." : ""}
      </p>
    </div>
  )
}
