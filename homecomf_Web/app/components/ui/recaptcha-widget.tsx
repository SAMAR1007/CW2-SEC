"use client"

import { useRef, useEffect, useState } from "react"

/**
 * reCAPTCHA v3 widget component.
 *
 * COURSEWORK NOTE: In production, replace the site key below with your actual
 * Google reCAPTCHA v3 site key. For development/testing without a real key,
 * this component provides a simulation mode that triggers a token callback.
 */

interface RecaptchaWidgetProps {
  onToken: (token: string) => void
  action?: string
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"

export default function RecaptchaWidget({ onToken, action = "submit" }: RecaptchaWidgetProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // If no real site key configured, use dev bypass
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      // Development mode: auto-generate a bypass token after a short delay
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          onToken("dev-bypass-token")
          setLoaded(true)
        }
      }, 500)
      return () => {
        mountedRef.current = false
        clearTimeout(timer)
      }
    }

    // Load reCAPTCHA script
    const script = document.createElement("script")
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    script.onload = () => {
      if (mountedRef.current) {
        setLoaded(true)
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action }).then((token: string) => {
              if (mountedRef.current) {
                onToken(token)
              }
            })
          })
        }
      }
    }
    script.onerror = () => {
      if (mountedRef.current) {
        setError(true)
        // Generate bypass token on error so form still works in dev
        onToken("dev-bypass-token")
      }
    }
    document.head.appendChild(script)

    return () => {
      mountedRef.current = false
    }
  }, [onToken, action])

  // Re-execute every 90 seconds to refresh token
  useEffect(() => {
    if (!loaded || !window.grecaptcha || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return

    const interval = setInterval(() => {
      window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action }).then((token: string) => {
        if (mountedRef.current) {
          onToken(token)
        }
      })
    }, 90000)

    return () => clearInterval(interval)
  }, [loaded, onToken, action])

  if (error) {
    return (
      <div className="text-[11px] text-amber-600 flex items-center gap-1">
        <span>⚠</span>
        <span>CAPTCHA unavailable — proceeding in development mode</span>
      </div>
    )
  }

  return (
    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
      <span>🔒</span>
      <span>Protected by reCAPTCHA</span>
      <span className="ml-auto">
        {loaded ? "✓" : "loading..."}
      </span>
    </div>
  )
}
