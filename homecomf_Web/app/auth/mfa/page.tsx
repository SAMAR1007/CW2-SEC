"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import axios from "@/lib/api/axios"
import { API } from "@/lib/api/endpoints"
import { useRouter } from "next/navigation"

type MFAPhase = "idle" | "generating" | "show_qr" | "enabling" | "enabled" | "verify" | "error"

export default function MFAPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<MFAPhase>("idle")
  const [secret, setSecret] = useState("")
  const [otpauthUrl, setOtpauthUrl] = useState("")
  const [otpToken, setOtpToken] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError("")
    setPhase("generating")
    try {
      const res = await axios.post(API.AUTH.MFA_GENERATE)
      setSecret(res.data.secret)
      setOtpauthUrl(res.data.otpauthUrl)
      setPhase("show_qr")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate MFA secret")
      setPhase("error")
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async () => {
    if (otpToken.length !== 6) {
      setError("Please enter a 6-digit code from your authenticator app")
      return
    }
    setLoading(true)
    setError("")
    setPhase("enabling")
    try {
      const res = await axios.post(API.AUTH.MFA_ENABLE, { otpToken, secret })
      setBackupCodes(res.data.backupCodes || [])
      setPhase("enabled")
      setMessage("MFA has been enabled successfully!")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to enable MFA")
      setPhase("show_qr")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!password) {
      setError("Please enter your password to disable MFA")
      return
    }
    setLoading(true)
    setError("")
    try {
      await axios.post(API.AUTH.MFA_DISABLE, { password })
      setPhase("idle")
      setSecret("")
      setOtpauthUrl("")
      setBackupCodes([])
      setPassword("")
      setMessage("MFA has been disabled.")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to disable MFA")
    } finally {
      setLoading(false)
    }
  }

  const renderQRCode = () => {
    // Generate QR code URL from otpauth URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    return (
      <div className="flex justify-center">
        <img
          src={qrUrl}
          alt="QR Code for MFA setup"
          className="rounded-lg border border-zinc-200"
          width={200}
          height={200}
          onError={(e) => {
            // Fallback if QR API fails
            e.currentTarget.style.display = "none"
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-zinc-100">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold italic">
              h
            </div>
            <span className="text-xl font-bold text-orange-500">homecomf</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Two-Factor Authentication</h1>
          <p className="mt-2 text-sm text-zinc-500">Add an extra layer of security to your account</p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {phase === "idle" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-sm text-zinc-700">
              <p className="font-medium mb-1">Protect your account</p>
              <p>Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Set up two-factor authentication"}
            </button>
          </div>
        )}

        {phase === "show_qr" && (
          <div className="space-y-4">
            <div className="text-sm text-zinc-600 space-y-2">
              <p className="font-medium text-zinc-900">Step 1: Scan the QR code</p>
              <p>Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code below.</p>
            </div>
            {renderQRCode()}
            <div className="p-3 rounded-lg bg-zinc-50 text-xs text-zinc-500 break-all font-mono">
              Secret: {secret}
            </div>
            <div className="text-sm text-zinc-600 space-y-2">
              <p className="font-medium text-zinc-900">Step 2: Verify the code</p>
              <p>Enter the 6-digit code from your authenticator app to confirm setup.</p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              onClick={handleEnable}
              disabled={loading || otpToken.length !== 6}
              className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Enable two-factor authentication"}
            </button>
            <button
              onClick={() => setPhase("idle")}
              className="w-full text-sm text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>
        )}

        {phase === "enabled" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">Backup codes</p>
              <p className="text-xs text-green-700 mb-3">Save these codes somewhere safe. Each code can only be used once if you lose access to your authenticator app.</p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="p-2 bg-white rounded border border-green-200 text-xs font-mono text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 rounded-xl bg-zinc-900 py-3 font-semibold text-white hover:bg-zinc-800 transition-all"
              >
                Go home
              </button>
            </div>
          </div>
        )}

        {phase !== "idle" && phase !== "show_qr" && phase !== "enabled" && (
          <div>
            <p className="text-sm text-zinc-500">MFA is already configured.</p>
            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to disable MFA"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                onClick={handleDisable}
                disabled={loading || !password}
                className="w-full rounded-xl border-2 border-red-200 py-3 font-semibold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Disable two-factor authentication
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
