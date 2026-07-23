"use client"

import HostHeader from "@/app/host/host-header"
import MessagesCenter from "@/components/messages-center"

export default function HostMessagesPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <HostHeader />
      <MessagesCenter mode="host" />
    </div>
  )
}
