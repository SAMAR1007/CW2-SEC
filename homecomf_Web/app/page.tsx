"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/layout/navbar"
import ExplorePage from "@/components/explore-page"
import StaysSearchPage from "@/components/stays-search-page"
import ExperiencesSearchPage from "@/components/experiences-search-page"
import MapPage from "@/components/map-page"
import LoginPage from "./auth/login/page"
import SignupPage from "./auth/signup/page"
import DashboardPage from "./(dashboard)/dashboard/page"
import HostVerificationPage from "@/components/host-verification-page"
import HostDashboardPage from "@/components/host-dashboard-page"
import HostOverviewPage from "@/components/host-overview-page"
import HostCalendarPage from "@/components/host-calendar-page"
import HostListingsPage from "@/components/host-listings-page"
import HostExperiencesPage from "@/components/host-experiences-page"
import TripsPage from "@/components/trips-page"
import WishlistPage from "@/components/wishlist-page"
import MessagesCenter from "@/components/messages-center"
import AIAssistantWidget from "@/components/ai-assistant-widget"
import NotificationsPage from "@/components/notifications-page"
import ProfilePage from "./user/profile/page"
import { verify } from "@/lib/api/auth"

type PageType =
  | "explore"
  | "wishlist"
  | "trips"
  | "profile"
  | "stays"
  | "experiences"
  | "map"
  | "login"
  | "signup"
  | "dashboard"
  | "messages"
  | "notifications"
  | "hostNotifications"
  | "hostVerification"
  | "hostOverview"
  | "hostDashboard"
  | "hostCalendar"
  | "hostListings"
  | "hostExperiences"
  | "hostMessages"

const HOST_ONLY_PAGES: PageType[] = [
  "hostOverview",
  "hostDashboard",
  "hostCalendar",
  "hostListings",
  "hostExperiences",
  "hostMessages",
  "hostNotifications",
]

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>("login")
  const [isLoading, setIsLoading] = useState(true)
  const [hostStatus, setHostStatus] = useState<{
    status: string
    rejectionReason: string | null
    isVerifiedHost: boolean
  } | null>(null)

  const isHostOnlyPage = (page: PageType) => HOST_ONLY_PAGES.includes(page)

  const refreshHostStatus = useCallback(async () => {
    try {
      const res = (await verify()) as { user: unknown; hostStatus: typeof hostStatus }
      setHostStatus(res.hostStatus ?? null)
    } catch {
      setHostStatus(null)
    }
  }, [])

  const updatePage = useCallback((page: PageType) => {
    setCurrentPage(page)
    if (page !== "login" && page !== "signup") {
      localStorage.setItem("lastPage", page)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = (await verify()) as { user: unknown; hostStatus: typeof hostStatus }
        setHostStatus(res.hostStatus ?? null)

        const lastPage = localStorage.getItem("lastPage") as PageType | null
        const isVerifiedHost = res?.hostStatus?.isVerifiedHost === true
        const pageToShow = !isVerifiedHost && lastPage && isHostOnlyPage(lastPage)
          ? "hostVerification"
          : (lastPage || "explore")
        setCurrentPage(pageToShow)
      } catch {
        setCurrentPage("login")
        setHostStatus(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = () => {
    updatePage("explore")
    refreshHostStatus()
  }

  const handleRegisterSuccess = () => {
    setCurrentPage("login")
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const isMessagesPage = currentPage === "messages" || currentPage === "hostMessages"
  const showAssistant = ["explore", "stays", "experiences", "map"].includes(currentPage)
  const isVerifiedHost = hostStatus?.isVerifiedHost === true

  const HostFeatureLockedPage = ({ feature }: { feature: string }) => (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="text-xl font-bold text-zinc-900">{feature} is available after verification</h2>
        <p className="mt-2 text-sm text-zinc-700">Verify your host account to access all host features.</p>
        <button
          type="button"
          onClick={() => updatePage("hostVerification")}
          className="mt-5 rounded-full bg-[#FF5A1F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#e44e1a]"
        >
          Verify your account
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen bg-background ${isMessagesPage ? "overflow-hidden pb-0" : "pb-20 md:pb-0"}`}>
      {currentPage !== "login" && currentPage !== "signup" && (
        <Navbar
          onNavigate={(p) => updatePage(p as PageType)}
          isLoggedIn={true}
          hostStatus={hostStatus}
          currentPage={currentPage}
          onHostStatusRefresh={refreshHostStatus}
        />
      )}
      <main>
        {currentPage === "login" && (
          <LoginPage onSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage("signup")} />
        )}
        {currentPage === "signup" && (
          <SignupPage onSuccess={handleRegisterSuccess} onNavigateLogin={() => setCurrentPage("login")} />
        )}
        {currentPage === "explore" && (
          <ExplorePage onNavigate={(p: string) => updatePage(p as PageType)} />
        )}
        {currentPage === "stays" && (
          <StaysSearchPage onNavigate={(p: string) => updatePage(p as PageType)} />
        )}
        {currentPage === "experiences" && (
          <ExperiencesSearchPage onNavigate={(p: string) => updatePage(p as PageType)} />
        )}
        {currentPage === "map" && <MapPage onNavigate={(p: string) => updatePage(p as PageType)} />}
        {currentPage === "dashboard" && <DashboardPage />}
        {currentPage === "hostVerification" && (
          <HostVerificationPage
            onNavigate={(p: string) => updatePage(p as PageType)}
            onHostStatusRefresh={refreshHostStatus}
          />
        )}
        {currentPage === "hostOverview" && (isVerifiedHost ? <HostOverviewPage onNavigate={(p: string) => updatePage(p as PageType)} /> : <HostFeatureLockedPage feature="Host dashboard" />)}
        {currentPage === "hostDashboard" && (isVerifiedHost ? <HostDashboardPage onNavigate={(p: string) => updatePage(p as PageType)} /> : <HostFeatureLockedPage feature="Today" />)}
        {currentPage === "hostCalendar" && (isVerifiedHost ? <HostCalendarPage /> : <HostFeatureLockedPage feature="Calendar" />)}
        {currentPage === "hostListings" && (isVerifiedHost ? <HostListingsPage onNavigate={(p) => updatePage(p as PageType)} /> : <HostFeatureLockedPage feature="Listings" />)}
        {currentPage === "hostExperiences" && (isVerifiedHost ? <HostExperiencesPage onNavigate={(p) => updatePage(p as PageType)} /> : <HostFeatureLockedPage feature="Experiences" />)}
        {currentPage === "trips" && <TripsPage />}
        {currentPage === "wishlist" && <WishlistPage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "messages" && <MessagesCenter mode="travelling" />}
        {currentPage === "notifications" && <NotificationsPage mode="travelling" onNavigate={(p) => updatePage(p as PageType)} />}
        {currentPage === "hostNotifications" && (isVerifiedHost ? <NotificationsPage mode="host" onNavigate={(p) => updatePage(p as PageType)} /> : <HostFeatureLockedPage feature="Notifications" />)}
        {currentPage === "hostMessages" && (isVerifiedHost ? <MessagesCenter mode="host" /> : <HostFeatureLockedPage feature="Messages" />)}
      </main>
      {showAssistant && <AIAssistantWidget onNavigate={(p) => updatePage(p as PageType)} />}
    </div>
  )
}
