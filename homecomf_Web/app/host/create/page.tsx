"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function HostCreateChooserPage() {
  const params = useSearchParams()
  const type = params.get("type")

  useEffect(() => {
    if (type === "stay") {
      window.location.href = "/host/listings?create=1"
    }
    if (type === "experience") {
      window.location.href = "/host/experiences?create=1"
    }
  }, [type])

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-semibold text-zinc-900 mb-3">What do you want to host?</h1>
        <p className="text-zinc-600 mb-10">Choose one option to continue.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/host/listings?create=1" className="rounded-2xl border border-zinc-200 p-8 hover:border-zinc-400 text-left">
            <h2 className="text-2xl font-semibold mb-2">Stay</h2>
            <p className="text-zinc-600">Create and publish a place where guests can book nights.</p>
          </Link>

          <Link href="/host/experiences?create=1" className="rounded-2xl border border-zinc-200 p-8 hover:border-zinc-400 text-left">
            <h2 className="text-2xl font-semibold mb-2">Experience</h2>
            <p className="text-zinc-600">Create and publish activities guests can join.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
