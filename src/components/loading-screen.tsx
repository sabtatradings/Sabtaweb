"use client"

import { useEffect, useLayoutEffect, useState, useRef } from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"

// Routes worth having ready before the visitor ever clicks — the ones
// almost everyone lands on next from the homepage. Warming these here (in
// parallel with the boot animation, not blocking it) means the RSC payload
// and JS chunk for /products are already sitting in the router cache by the
// time someone clicks "Browse Products", instead of only starting the
// fetch on click.
const PREFETCH_ROUTES = ["/products", "/about", "/contact"]

export function LoadingScreen() {
  // The boot animation only plays on the homepage. Visitors who land on a
  // range, product or guide straight from search get the page immediately:
  // on every other page the overlay held back first paint by ~1.9s (measured
  // 2.7s vs 0.8s on a throttled mobile), which hurts Core Web Vitals and
  // makes searchers bounce. Decided once, from the landing URL.
  const pathname = usePathname()
  const [enabled] = useState(() => pathname === "/")
  const [pct, setPct] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [skip, setSkip] = useState(false)
  const router = useRouter()

  const isFullyLoadedRef = useRef(false)
  const progressTargetRef = useRef(15)

  // Runs before paint so a returning visitor (same tab session) never sees
  // the boot animation flash in.
  useLayoutEffect(() => {
    let booted = false
    try {
      booted = Boolean(sessionStorage.getItem("sabta-loaded"))
      // Landed off the homepage: mark the session as booted so the homepage
      // hero doesn't wait for a loader that never ran.
      if (!enabled && !booted) sessionStorage.setItem("sabta-loaded", "1")
    } catch {
      // Private-mode storage can throw; the hero has its own timeout fallback.
    }
    if (booted || !enabled) {
      setSkip(true)
      setHidden(true)
    }
  }, [enabled])

  // Fires on every page load — including the skipped/no-animation ones —
  // since this is about warming the router cache, not about the visual
  // boot sequence. Runs independent of the loading-progress effect below
  // so it starts immediately rather than waiting on asset checks.
  useEffect(() => {
    for (const route of PREFETCH_ROUTES) {
      router.prefetch(route)
    }
  }, [router])

  useEffect(() => {
    if (skip || !enabled) return

    let isMounted = true

    // Check DOM, Images, Video, Fonts readiness.
    // Only the LCP-critical assets are tracked here (images explicitly
    // marked priority, which next/image renders with fetchpriority="high"),
    // not every <img> on the page — most images below the fold use native
    // lazy-loading and never start fetching until scrolled into view, so
    // waiting on "every image complete" meant this screen almost always
    // fell through to the safety timeout below instead of resolving as
    // soon as the visible content was actually ready.
    const checkAssets = () => {
      if (!isMounted) return

      const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[fetchpriority="high"]'))
      const video = document.querySelector("video")

      let totalCount = 1 + images.length + (video ? 1 : 0)
      let loadedCount = document.readyState === "complete" ? 1 : 0

      images.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) {
          loadedCount++
        }
      })

      if (video) {
        if (video.readyState >= 3) {
          loadedCount++
        }
      }

      const ratio = loadedCount / Math.max(1, totalCount)
      const target = Math.min(95, Math.round(ratio * 95))

      if (target > progressTargetRef.current) {
        progressTargetRef.current = target
      }

      // Check if DOM & critical media are ready
      const isDomComplete = document.readyState === "complete"
      const isImagesComplete = images.every((img) => img.complete)
      const isVideoReady = !video || video.readyState >= 2

      if (isDomComplete && isImagesComplete && isVideoReady) {
        isFullyLoadedRef.current = true
        progressTargetRef.current = 100
      }
    }

    // Attach listeners
    const handleLoad = () => checkAssets()
    window.addEventListener("load", handleLoad)
    document.addEventListener("readystatechange", handleLoad)

    const videoEl = document.querySelector("video")
    if (videoEl) {
      videoEl.addEventListener("canplay", handleLoad)
      videoEl.addEventListener("loadeddata", handleLoad)
    }

    const interval = setInterval(checkAssets, 150)

    // Safety timeout: Ensure page opens after 2.5s even on super slow network
    const maxTimeout = setTimeout(() => {
      isFullyLoadedRef.current = true
      progressTargetRef.current = 100
    }, 2500)

    // Smooth progress animation tick
    let currentDisplayPct = 0
    let raf = 0

    function tick() {
      const targetPct = progressTargetRef.current

      if (currentDisplayPct < targetPct) {
        // Smoothly step towards target percentage
        const step = isFullyLoadedRef.current ? 4 : 2
        currentDisplayPct = Math.min(targetPct, currentDisplayPct + step)
        setPct(currentDisplayPct)
        raf = requestAnimationFrame(tick)
      } else if (currentDisplayPct >= 100 && isFullyLoadedRef.current) {
        setPct(100)
        setExiting(true)
        setTimeout(() => {
          if (!isMounted) return
          setHidden(true)
          try {
            sessionStorage.setItem("sabta-loaded", "1")
          } catch {
            // Private mode storage fallback
          }
          window.dispatchEvent(new Event("sabta:loaded"))
        }, 600)
      } else {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)

    return () => {
      isMounted = false
      clearInterval(interval)
      clearTimeout(maxTimeout)
      cancelAnimationFrame(raf)
      window.removeEventListener("load", handleLoad)
      document.removeEventListener("readystatechange", handleLoad)
      if (videoEl) {
        videoEl.removeEventListener("canplay", handleLoad)
        videoEl.removeEventListener("loadeddata", handleLoad)
      }
    }
  }, [skip, enabled])

  if (!enabled) return null

  return (
    <div id="sabta-loader" data-hidden={hidden} aria-hidden="true">
      <div className="sabta-loader-bg-top" />
      <div className="sabta-loader-pool-a" />
      <div className="sabta-loader-pool-b" />
      <div className="sabta-loader-bg-overlay" />

      <div className="sabta-loader-stage" data-exit={exiting}>
        <div className="sabta-loader-logo">
          <div className="sabta-loader-logo-wipe">
            <Image
              src="/brand/logo.png"
              alt="Sabta Trading Co. L.L.C."
              width={620}
              height={202}
              priority
              style={{ height: "auto" }}
              className="block w-full"
            />
          </div>
        </div>

        <div className="sabta-loader-progress">
          <div className="sabta-loader-track">
            <div className="sabta-loader-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="sabta-loader-text">
            <span>Loading Experience</span>
            <span className="sabta-loader-divider" />
            <span className="sabta-loader-pct">{pct}%</span>
          </div>
        </div>
      </div>

      <div className="sabta-loader-caption">
        <span>Sabta Trading Co. L.L.C.</span>
      </div>
    </div>
  )
}
