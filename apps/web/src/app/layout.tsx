import type { Metadata } from "next"
import "./globals.css"
import "@/styles/_variables.scss"
import "@/styles/_keyframe-animations.scss"
import AuthHeader from "@/features/auth/presentation/AuthHeader"
import PerformanceMeasureGuard from "@/shared/presentation/performance/PerformanceMeasureGuard"
import ScrollToTop from "@/shared/presentation/navigation/ScrollToTop"
import ToastProvider from "@/shared/presentation/providers/ToastProvider"
import OfflineBootstrap from "@/features/offline/presentation/OfflineBootstrap"
import CampaignPresenceBubble from "@/features/world/campaign/presentation/presence/CampaignPresenceBubble"

export const metadata: Metadata = {
  title: "ForgeTab",
  description: "forgeTab",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  },
  manifest: "/favicon/site.webmanifest"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <body>
        <PerformanceMeasureGuard />
        <OfflineBootstrap />
        <ScrollToTop />
        <ToastProvider />
        <AuthHeader />
        <CampaignPresenceBubble />
        {children}
      </body>
    </html>
  )
}
