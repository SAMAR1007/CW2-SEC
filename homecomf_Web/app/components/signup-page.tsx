"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type PageType = "login" | "signup" | "host"

interface SignupPageProps {
  onNavigate: (page: PageType) => void
}

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("Nepal (+977)")
  const [isCountryOpen, setIsCountryOpen] = useState(false)

  const countries = ["Nepal (+977)", "India (+91)", "Bangladesh (+880)", "Pakistan (+92)", "Sri Lanka (+94)"]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <button
        onClick={() => onNavigate("signup")}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold">
            Sign up to{" "}
            <span className="text-orange-500">
              <span className="inline-block mr-2">🏠</span>homecomf
            </span>
          </h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Country Selector */}
          <div className="relative">
            <label className="block text-sm text-gray-600 mb-2">Country/Region</label>
            <button
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition bg-white"
            >
              <span>{selectedCountry}</span>
              <ChevronDown size={20} className="text-gray-400" />
            </button>

            {isCountryOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                {countries.map((country) => (
                  <button
                    key={country}
                    onClick={() => {
                      setSelectedCountry(country)
                      setIsCountryOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 transition first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-200"
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Sign Up Button */}
          <Button
            onClick={() => {}}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition text-lg"
          >
            Sign Up
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Log In Link */}
          <p className="text-center text-gray-700">
            Already have an account?{" "}
            <button onClick={() => onNavigate("login")} className="text-orange-500 font-semibold hover:underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
