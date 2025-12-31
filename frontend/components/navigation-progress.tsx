"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Reset on route change complete
    setIsNavigating(false)
    setProgress(0)
  }, [pathname, searchParams])

  useEffect(() => {
    let progressInterval: NodeJS.Timeout

    if (isNavigating) {
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [isNavigating])

  // Listen for navigation start
  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true)
      setProgress(10)
    }

    // Use click event on links to detect navigation start
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href)
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          handleStart()
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  if (!isNavigating && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isNavigating ? 1 : 0,
        }}
      />
    </div>
  )
}
