"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { login, verify } from "@/lib/api/auth"
import Cookies from "js-cookie"
import RecaptchaWidget from "@/app/components/ui/recaptcha-widget"

const getRoleFromToken = (token: string | undefined) => {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload?.role || null
  } catch {
    return null
  }
}

export default function LoginPage({
  onSuccess,
  onNavigateRegister,
}: {
  onSuccess?: () => void
  onNavigateRegister?: () => void
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [recaptchaToken, setRecaptchaToken] = useState("")

  const handleRecaptchaToken = useCallback((token: string) => {
    setRecaptchaToken(token)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await verify()
        const role = res?.user?.role
        if (onSuccess) {
          onSuccess()
        } else {
          if (role === "admin") {
            router.push("/admin")
          } else {
            router.push("/")
          }
        }
      } catch (error) {
        // User is not logged in, stay on login page
      }
    }

    checkAuth()
  }, [onSuccess, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const loginData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      recaptchaToken: recaptchaToken || 'dev-bypass-token',
    }

    try {
      const result = await login(loginData)
      if (result.message === 'Login successful' && result.data?.token) {
        // Set cookie with the token
        Cookies.set('auth-token', result.data.token, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        const role = getRoleFromToken(result.data.token)
        if (onSuccess) {
          onSuccess()
        } else {
          if (role === "admin") {
            router.push("/admin")
          } else {
            router.push("/")
          }
        }
      } else {
        setError(result.message || "Login failed")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-zinc-100">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center text-white font-bold italic">
              N
            </div>
            <span className="text-xl font-bold text-[#FF5A1F]">homecomf</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
          <p className="mt-2 text-zinc-500">Log in to manage your bookings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#FF5A1F] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#FF5A1F] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all"
            />
            <div className="mt-2 text-right">
              <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#FF5A1F] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <RecaptchaWidget onToken={handleRecaptchaToken} action="login" />

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#FF5A1F] py-3 font-semibold text-white hover:bg-[#e44e1a] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <button
            onClick={() => (onNavigateRegister ? onNavigateRegister() : router.push("/auth/signup"))}
            className="font-semibold text-[#FF5A1F] hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  )
}
