"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { forgotPassword, resetPassword } from "@/lib/api/auth"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await forgotPassword(email)
      setMessage(res?.message || "OTP sent to your email")
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await resetPassword({ email, otp, password, confirmPassword })
      setMessage(res?.message || "Password reset successful")
      setTimeout(() => router.push("/auth/login"), 1200)
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="pointer-events-none absolute right-6 top-6 hidden lg:block">
        <div className="relative h-44 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <Image
            src="/images/attachments-gen-images-public-mountain-view-terrace.jpg"
            alt="Mountain view"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-zinc-100">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center text-white font-bold italic">
              N
            </div>
            <span className="text-xl font-bold text-[#FF5A1F]">homecomf</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Forgot password</h1>
          <p className="mt-2 text-zinc-500">We will email you an OTP to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#FF5A1F] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all"
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {message && <div className="text-emerald-600 text-sm text-center">{message}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#FF5A1F] py-3 font-semibold text-white hover:bg-[#e44e1a] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="my-6 border-t border-zinc-100" />

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="6-digit code"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#FF5A1F] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#FF5A1F] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#FF5A1F] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#0f172a] py-3 font-semibold text-white hover:bg-[#0b1220] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  )
}
