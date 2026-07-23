"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { handleLogout } from "@/lib/actions/auth-action"

export default function HostHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogoutClick = async () => {
    try {
      await handleLogout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="homecomf" width={120} height={40} className="rounded-lg" />
        </Link>

        <div className="hidden md:flex items-center gap-10 text-2sm font-medium text-zinc-600">
          <Link 
            href="/host/listings"
            className={`hover:text-zinc-900 pb-1 ${
              pathname === "/host/listings" || pathname.startsWith("/host/listings/")
                ? "border-b-2 border-[#FF5A1F] text-[#FF5A1F]"
                : ""
            }`}
          >
            Listings
          </Link>
          <Link 
            href="/host/experiences"
            className={`hover:text-zinc-900 pb-1 ${
              pathname === "/host/experiences" || pathname.startsWith("/host/experiences/")
                ? "border-b-2 border-[#FF5A1F] text-[#FF5A1F]"
                : ""
            }`}
          >
            Experiences
          </Link>
          <Link
            href="/host/messages"
            className={`hover:text-zinc-900 pb-1 ${
              pathname === "/host/messages"
                ? "border-b-2 border-[#FF5A1F] text-[#FF5A1F]"
                : ""
            }`}
          >
            Messages
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg text-sm font-semibold text-[#FF5A1F] hover:bg-zinc-100 px-4 py-2 transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={handleLogoutClick}
            className="rounded-lg bg-zinc-100 text-zinc-900 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
