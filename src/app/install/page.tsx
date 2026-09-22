import type { Metadata } from "next"
import Link from "next/link"
import { InstallButton } from "@/components/install-button"

export const metadata: Metadata = {
  title: "Download Cove",
  description: "Install the Cove retirement income calculator on your phone or computer.",
}

export default function InstallPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Back to the calculator
      </Link>
      <div className="grid gap-3">
        <p className="font-heading text-4xl tracking-tight text-primary italic">Cove</p>
        <h1 className="text-2xl font-medium tracking-tight">Download the app</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Install Cove on this phone or computer. It opens in its own window, and the numbers you enter stay on this device.
        </p>
      </div>
      <InstallButton />
      <div id="install-steps" className="grid gap-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <section className="grid gap-2">
          <h2 className="text-sm font-medium">On a phone</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Open this page in Safari or Chrome.</li>
            <li>On iPhone, tap Share, then Add to Home Screen.</li>
            <li>On Android, tap Download app, or choose Install app from the browser menu.</li>
          </ol>
        </section>
        <section className="grid gap-2">
          <h2 className="text-sm font-medium">On a computer</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            In Chrome or Edge, use the install icon in the address bar. In Safari on a Mac, choose File, then Add to Dock.
          </p>
        </section>
      </div>
    </main>
  )
}
