import type React from "react"
import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ActiveSchoolWrapper } from "@/components/active-school-wrapper"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Class Memory Rooms - Collaborative Note-Taking",
  description: "A warm, collaborative space for students to compile and share lecture notes together.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${fraunces.variable} antialiased`}>
        <ActiveSchoolWrapper>{children}</ActiveSchoolWrapper>
        <Analytics />
      </body>
    </html>
  )
}
