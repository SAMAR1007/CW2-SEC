"use client"

import { useState, useEffect, useRef } from "react"
import { applyAsHost, getMyHostStatus } from "@/lib/api/host"
import { AlertCircle, Loader2, FileText } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getDocumentUrl = (path?: string) => {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`
}

type HostProfileData = {
  legalName?: string
  phoneNumber?: string
  address?: string
  governmentId?: string
  idDocument?: string
  verificationStatus?: "pending" | "verified" | "rejected"
}

interface HostVerificationPageProps {
  onNavigate: (page: string) => void
  onHostStatusRefresh: () => Promise<void>
}

type HostStatus = "none" | "pending" | "verified" | "rejected"

export default function HostVerificationPage({ onNavigate, onHostStatusRefresh }: HostVerificationPageProps) {
  const [status, setStatus] = useState<HostStatus>("none")
  const [hostProfile, setHostProfile] = useState<HostProfileData | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [blockedNotice, setBlockedNotice] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const noticeLabelMap: Record<string, string> = {
    hostDashboard: "Today",
    hostCalendar: "Calendar",
    hostListings: "Listings",
    hostExperiences: "Listings",
    hostMessages: "Messages",
    hostOverview: "Dashboard",
  }

  const fetchStatus = async () => {
    try {
      const res = await getMyHostStatus()
      if (!res.hostProfile) {
        setStatus("none")
        setHostProfile(null)
        setRejectionReason(null)
        return
      }
      const s = res.hostProfile.verificationStatus
      setHostProfile(res.hostProfile)
      setStatus(s === "pending" ? "pending" : s === "verified" ? "verified" : "rejected")
      setRejectionReason(res.hostProfile.rejectionReason || null)
      if (s === "verified") {
        await onHostStatusRefresh()
      }
    } catch {
      setStatus("none")
      setHostProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const blockedPage = window.localStorage.getItem("hostVerificationNotice")
      if (blockedPage) {
        const label = noticeLabelMap[blockedPage] || "This section"
        setBlockedNotice(`${label} is available after verification.`)
        window.localStorage.removeItem("hostVerificationNotice")
      }
    }
    fetchStatus()
  }, [])

  useEffect(() => {
    if (status === "pending") {
      pollRef.current = setInterval(fetchStatus, 5000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [status])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const legalName = (formData.get("legalName") as string)?.trim()
    const phoneNumber = (formData.get("phoneNumber") as string)?.trim()
    const address = (formData.get("address") as string)?.trim()
    const governmentId = (formData.get("governmentId") as string)?.trim()
    const idDocument = formData.get("idDocument") as File | null

    if (!legalName || !phoneNumber || !address) {
      setError("Legal name, phone number, and address are required.")
      setSubmitting(false)
      return
    }

    try {
      await applyAsHost({
        legalName,
        phoneNumber,
        address,
        governmentId: governmentId || undefined,
        idDocument: idDocument?.size ? idDocument : undefined,
      })
      setStatus("pending")
      setRejectionReason(null)
      await onHostStatusRefresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A1F]" />
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-6">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Application under review</h1>
          <p className="text-zinc-600 mb-8">
            Your host application is pending. We will notify you once an admin has verified your details. This page will update automatically.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("explore")}
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back to explore
          </button>
        </div>
      </div>
    )
  }

  if (status === "verified") {
    const documentUrl = getDocumentUrl(hostProfile?.idDocument)

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Host verification</h1>
            <p className="text-zinc-600">Your account is successfully verified as host.</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800">Successfully verified</p>
            <p className="text-sm text-emerald-700 mt-1">You can now access all host features.</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <p className="text-sm font-semibold text-zinc-900">Submitted details</p>
            <p className="text-sm text-zinc-700"><span className="font-medium">Legal name:</span> {hostProfile?.legalName || "-"}</p>
            <p className="text-sm text-zinc-700"><span className="font-medium">Phone number:</span> {hostProfile?.phoneNumber || "-"}</p>
            <p className="text-sm text-zinc-700"><span className="font-medium">Address:</span> {hostProfile?.address || "-"}</p>
            <p className="text-sm text-zinc-700"><span className="font-medium">Government ID:</span> {hostProfile?.governmentId || "-"}</p>
            {documentUrl ? (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <FileText className="w-4 h-4" />
                View submitted document
              </a>
            ) : (
              <p className="text-sm text-zinc-500">No document uploaded.</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onNavigate("hostOverview")}
              className="rounded-full bg-[#FF5A1F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#e44e1a]"
            >
              Go to host dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate("explore")}
              className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Switch to travelling
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Become a host</h1>
        <p className="text-zinc-600 mb-8">
          Enter your legal details. An admin will verify your application before you can host.
        </p>

        {blockedNotice && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {blockedNotice}
          </div>
        )}

        {status === "rejected" && rejectionReason && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Application not approved</p>
              <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
              <p className="text-sm text-red-600 mt-2">You can correct the information and submit again.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="legalName" className="block text-sm font-medium text-zinc-700 mb-1">
              Legal name
            </label>
            <input
              id="legalName"
              name="legalName"
              type="text"
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
              placeholder="As on government ID"
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 mb-1">
              Phone number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
              placeholder="+977 ..."
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-zinc-700 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              required
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
              placeholder="Full address"
            />
          </div>
          <div>
            <label htmlFor="governmentId" className="block text-sm font-medium text-zinc-700 mb-1">
              Government ID number (optional)
            </label>
            <input
              id="governmentId"
              name="governmentId"
              type="text"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
              placeholder="e.g. citizenship number"
            />
          </div>
          <div>
            <label htmlFor="idDocument" className="block text-sm font-medium text-zinc-700 mb-1">
              Government ID document (optional)
            </label>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
              <FileText className="w-4 h-4" />
              Image or PDF, max 5MB
            </div>
            <input
              id="idDocument"
              name="idDocument"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 file:mr-4 file:rounded file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#FF5A1F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#e44e1a] disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for verification"
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("explore")}
              className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
