import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
// import { Navbar } from "@/components/layout/navbar"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "homecomf - Host Place or Experience in Nepal",
  description: "Login, Sign up, or Start hosting on homecomf",
  generator: "Next.js",
  manifest: "/manifest.webmanifest",
  applicationName: "homecomf",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "homecomf",
  },
  icons: {
    icon: [
      {
        url: "/images/logo.png",
        type: "image/png",
      },
    ],
    apple: "/images/logo.png",
    shortcut: "/images/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  )
}
