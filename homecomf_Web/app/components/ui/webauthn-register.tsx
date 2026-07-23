"use client"

import { useState } from "react"
import axios from "@/lib/api/axios"

export default function WebAuthnRegister() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [credentials, setCredentials] = useState<Array<{ id: string; createdAt: string }>>([])
  const [showList, setShowList] = useState(false)

  const registerPasskey = async () => {
    setLoading(true)
    setMessage("")

    try {
      // Step 1: Get registration options from server
      const optionsRes = await axios.post("/api/webauthn/register/options")
      const { options } = optionsRes.data

      // COURSEWORK NOTE: In production, use the WebAuthn API:
      // const credential = await navigator.credentials.create({ publicKey: options })
      // For demo, we simulate a successful WebAuthn credential creation

      const mockCredential = {
        id: "mock-" + Math.random().toString(36).substring(2, 15),
        rawId: btoa("mock-credential"),
        response: {
          clientDataJSON: btoa(JSON.stringify({ challenge: options.challenge, origin: window.location.origin })),
          attestationObject: btoa("mock-attestation"),
        },
        type: "public-key",
      }

      // Step 2: Verify registration with server
      const verifyRes = await axios.post("/api/webauthn/register/verify", mockCredential)
      if (verifyRes.data.verified) {
        setMessage("✅ Passkey registered successfully! You can now log in without a password.")
        loadCredentials()
      }
    } catch (err: any) {
      setMessage("❌ " + (err.response?.data?.message || "Failed to register passkey"))
    } finally {
      setLoading(false)
    }
  }

  const loadCredentials = async () => {
    try {
      const res = await axios.get("/api/webauthn/credentials")
      setCredentials(res.data.credentials || [])
    } catch { /* ignore */ }
  }

  const removeCredential = async (id: string) => {
    try {
      await axios.delete(`/api/webauthn/credentials/${id}`)
      setMessage("🗑️ Passkey removed")
      loadCredentials()
    } catch (err: any) {
      setMessage("❌ " + (err.response?.data?.message || "Failed to remove passkey"))
    }
  }

  const toggleList = async () => {
    if (!showList) await loadCredentials()
    setShowList(!showList)
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
        <h3 className="font-medium text-zinc-900 mb-1">Password-less Login (WebAuthn)</h3>
        <p className="text-sm text-zinc-600 mb-3">
          Register a passkey to log in using your device&apos;s fingerprint, face recognition, or security key.
        </p>
        <button
          onClick={registerPasskey}
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          {loading ? "Setting up..." : "Register a passkey"}
        </button>
      </div>

      {message && (
        <div className={`text-sm p-3 rounded-lg ${message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message}
        </div>
      )}

      <button onClick={toggleList} className="text-sm text-zinc-500 hover:text-zinc-700 underline">
        {showList ? "Hide" : "Show"} saved passkeys
      </button>

      {showList && credentials.length > 0 && (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200">
              <div>
                <p className="text-sm font-medium text-zinc-900">Passkey</p>
                <p className="text-xs text-zinc-500">Registered: {new Date(cred.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => removeCredential(cred.id)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
