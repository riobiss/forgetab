import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "@/styles/_variables.scss"
import "@/styles/_keyframe-animations.scss"
import Header from "@/components/header/Header"
import PerformanceMeasureGuard from "@/components/dev/PerformanceMeasureGuard"
import ScrollToTop from "@/components/ScrollToTop"
import ToastProvider from "@/components/providers/ToastProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ForgeTab",
  description: "forgeTab",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <PerformanceMeasureGuard />
        <ScrollToTop />
        <ToastProvider />
        <Header />
        {children}
      </body>
    </html>
  )
}
