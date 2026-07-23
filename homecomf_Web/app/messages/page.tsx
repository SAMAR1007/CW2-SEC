"use client"

import { Navbar } from "@/components/layout/navbar"
import MessagesCenter from "@/components/messages-center"

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar isLoggedIn={true} currentPage="messages" />
      <MessagesCenter mode="travelling" />
    </div>
  )
}
