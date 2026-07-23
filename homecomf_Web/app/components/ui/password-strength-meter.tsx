"use client"

import { useMemo } from "react"

interface PasswordStrengthMeterProps {
  password: string
  name?: string
  email?: string
}

type StrengthLevel = {
  score: number
  label: string
  color: string
  bgColor: string
  width: string
}

export default function PasswordStrengthMeter({ password, name, email }: PasswordStrengthMeterProps) {
  const strength = useMemo((): StrengthLevel => {
    if (!password) {
      return { score: 0, label: "", color: "bg-zinc-200", bgColor: "bg-zinc-200", width: "0%" }
    }

    let score = 0
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]/.test(password)

    // Length checks
    if (password.length >= 8) score++
    if (password.length >= 12) score++

    // Complexity checks
    let complexity = 0
    if (hasUpper) complexity++
    if (hasLower) complexity++
    if (hasDigit) complexity++
    if (hasSpecial) complexity++
    if (complexity >= 3) score++
    if (complexity >= 4 && password.length >= 12) score++

    // Common password check
    const commonPasswords = ['12345678', 'password', 'password1', '123456789', 'qwerty123', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football', 'iloveyou', 'admin123', 'passw0rd', 'shadow', '123123', '654321']
    if (commonPasswords.includes(password.toLowerCase())) {
      score = Math.min(score, 1)
    }

    // Personal info check
    if (name) {
      const nameParts = name.toLowerCase().split(/\s+/)
      for (const part of nameParts) {
        if (part.length > 2 && password.toLowerCase().includes(part)) {
          score = Math.min(score, 1)
          break
        }
      }
    }
    if (email) {
      const emailPrefix = email.split('@')[0].toLowerCase()
      if (emailPrefix.length > 2 && password.toLowerCase().includes(emailPrefix)) {
        score = Math.min(score, 1)
      }
    }

    switch (score) {
      case 0:
        return { score: 0, label: "Too weak", color: "bg-red-500", bgColor: "bg-red-100", width: "25%" }
      case 1:
        return { score: 1, label: "Weak", color: "bg-orange-500", bgColor: "bg-orange-100", width: "25%" }
      case 2:
        return { score: 2, label: "Fair", color: "bg-yellow-500", bgColor: "bg-yellow-100", width: "50%" }
      case 3:
        return { score: 3, label: "Strong", color: "bg-green-500", bgColor: "bg-green-100", width: "75%" }
      case 4:
        return { score: 4, label: "Very strong", color: "bg-emerald-600", bgColor: "bg-emerald-100", width: "100%" }
      default:
        return { score: 0, label: "", color: "bg-zinc-200", bgColor: "bg-zinc-200", width: "0%" }
    }
  }, [password, name, email])

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-600' : strength.score === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
          {strength.label}
        </p>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-2 h-2 rounded-full transition-all ${
                level <= strength.score ? strength.color : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>
      </div>
      {strength.score < 3 && (
        <ul className="text-[11px] text-zinc-500 space-y-0.5 mt-1">
          {password.length < 8 && <li>• At least 8 characters</li>}
          {!/[A-Z]/.test(password) && <li>• Add an uppercase letter</li>}
          {!/[a-z]/.test(password) && <li>• Add a lowercase letter</li>}
          {!/\d/.test(password) && <li>• Add a digit</li>}
          {!/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~]/.test(password) && <li>• Add a special character</li>}
        </ul>
      )}
    </div>
  )
}
