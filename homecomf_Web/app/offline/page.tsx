export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white text-zinc-900">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-sm text-zinc-600">
          homecomf is showing cached pages and search results when available.
          Reconnect to refresh availability, bookings, and latest listings.
        </p>
      </div>
    </main>
  )
}
