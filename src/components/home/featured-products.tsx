"use client"

import { useRef, useState, useEffect } from "react"
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion"
import { useLenis } from "lenis/react"
import type { Product } from "@/lib/products"
import { StackRevealCard } from "@/components/home/stack-reveal-card"
import { useMediaQuery } from "@/components/home/three-d-photo-carousel"

export function FeaturedProducts({ products }: { products: Product[] }) {
  // Capped at 6, not 8: every card in the deck is a live scroll-linked
  // element (its own useTransform subscription, updated every scroll
  // frame) for as long as this section is pinned, so the count directly
  // sets the section's per-frame cost — and 8 stacked cards was still
  // feeling heavy on scroll even after trimming GPU-layer promotion and
  // the backdrop-blur badge. Fewer cards is less work every frame, and
  // shortens the pinned scroll distance you have to sit through besides.
  const items = products.filter((p) => p.image).slice(0, 6)
  if (items.length === 0) return null
  const cardCount = items.length

  const sectionRef = useRef<HTMLElement>(null)
  const [flyDistance, setFlyDistance] = useState(500)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  // Mobile flicks are short relative to a 45vh-per-card pinned scroll track,
  // so the deck barely advances per gesture and reads as unresponsive/laggy.
  // Shrinking the per-card scroll distance on small screens tightens that
  // input-to-progress ratio without touching the desktop feel.
  const isMobile = useMediaQuery("(max-width: 640px)")

  useEffect(() => {
    const updateDimensions = () => {
      setFlyDistance(Math.min(window.innerWidth * 0.85, 650))
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // scrollYProgress goes 0 → 1 over the pinned section height.
  // advance maps 0 → cardCount - 1
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const advance = useTransform(scrollYProgress, [0, 1], [0, cardCount - 1])

  // activeCardIndex (state) is for the progress dots' render; this ref mirrors
  // it so the touch handlers below always read the latest value without
  // needing to be torn down and re-attached on every scroll tick.
  const activeCardIndexRef = useRef(0)

  useMotionValueEvent(advance, "change", (v) => {
    const clamped = Math.min(cardCount - 1, Math.max(0, Math.round(v)))
    activeCardIndexRef.current = clamped
    setActiveCardIndex(clamped)
  })

  // On mobile this deck is driven by page-scroll position (see `advance`
  // above), and a single flick's scroll distance is never a fixed amount —
  // it depends on swipe speed/momentum — so a fast swipe used to blow past
  // several cards at once (and a slow one barely moved the deck at all),
  // which read as laggy/unpredictable. This takes over the touch gesture
  // while the deck is pinned: a swipe past a small threshold advances
  // exactly one card, animated smoothly to that card's exact scroll
  // position via Lenis, instead of tracking the raw drag distance. Swiping
  // further than the first/last card releases the gesture back to normal
  // page scrolling so the section still scrolls in and out naturally.
  // (StackRevealCard itself is untouched — it just keeps reading `advance`,
  // which this only ever moves by animating real scroll position.)
  const lenis = useLenis()

  useEffect(() => {
    if (!isMobile || cardCount <= 1) return
    const section = sectionRef.current
    if (!section) return

    const ENGAGE_PX = 10
    const TRIGGER_PX = 28

    let startY = 0
    let captured = false
    let decided = false
    let direction: 1 | -1 = 1

    function isPinned() {
      const rect = section!.getBoundingClientRect()
      return rect.top <= 1 && rect.bottom > window.innerHeight
    }

    function scrollToCard(targetIndex: number) {
      const sectionEl = section!
      const scrollRange = sectionEl.offsetHeight - window.innerHeight
      if (scrollRange <= 0) return
      const targetY = sectionEl.offsetTop + (targetIndex / (cardCount - 1)) * scrollRange
      if (lenis) {
        lenis.scrollTo(targetY, { duration: 0.5, easing: (t: number) => 1 - Math.pow(1 - t, 3) })
      } else {
        window.scrollTo({ top: targetY, behavior: "smooth" })
      }
    }

    function handleTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY
      captured = isPinned()
      decided = false
    }

    function handleTouchMove(e: TouchEvent) {
      if (!captured) return
      const deltaY = startY - e.touches[0].clientY

      if (!decided) {
        if (Math.abs(deltaY) < ENGAGE_PX) return
        direction = deltaY > 0 ? 1 : -1

        // Only the forward direction is stepped one card per swipe. That
        // throttle exists so a fast swipe doesn't blow past several product
        // cards too quickly to read — but there's nothing to read on the
        // way back out, so applying the same one-at-a-time throttle to the
        // reverse direction just turns leaving the section (scrolling back
        // up past it) into a slog of repeated swipes. Releasing capture
        // here hands the gesture back to normal scrolling, so a single
        // swipe back up can carry through several cards at once.
        if (direction === -1) {
          captured = false
          return
        }

        if (activeCardIndexRef.current >= cardCount - 1) {
          captured = false
          return
        }
        decided = true
      }

      e.preventDefault()
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!captured || !decided) return
      const deltaY = startY - e.changedTouches[0].clientY
      if (Math.abs(deltaY) < TRIGGER_PX) return
      const targetIndex = Math.min(cardCount - 1, Math.max(0, activeCardIndexRef.current + direction))
      if (targetIndex !== activeCardIndexRef.current) scrollToCard(targetIndex)
    }

    section.addEventListener("touchstart", handleTouchStart, { passive: true })
    section.addEventListener("touchmove", handleTouchMove, { passive: false })
    section.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      section.removeEventListener("touchstart", handleTouchStart)
      section.removeEventListener("touchmove", handleTouchMove)
      section.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isMobile, cardCount, lenis])

  return (
    <section
      ref={sectionRef}
      aria-label="Featured products"
      className="relative w-full bg-background"
      // Lenis (see providers.tsx) smooths scroll with a 0.1 lerp, so a fast
      // flick's momentum takes ~0.5-0.7s to "catch up" to its target. That
      // lag is invisible on normal content, but inside this pinned deck the
      // scroll position IS the only visual feedback, so the catch-up reads
      // as the page going dead/stuck mid-scroll. data-lenis-prevent tells
      // Lenis to let scroll input over this section through natively
      // (unsmoothed) instead, matching finger/wheel movement 1:1.
      data-lenis-prevent
      style={{
        height: `calc(100dvh + ${(cardCount - 1) * (isMobile ? 22 : 45)}vh)`,
      }}
    >
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle,#1b2a80_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden="true"
      />

      {/* Sticky Viewport */}
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-between pt-20 pb-8 px-4 overflow-hidden">
        {/* Header */}
        <div className="relative z-40 flex flex-col items-center gap-2 text-center px-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-wider text-black">
            Featured Products
          </h2>
        </div>

        {/* Stack Reveal Card Stage */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-[340px] min-[380px]:max-w-[370px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[520px]">
          <div className="relative w-full h-[460px] sm:h-[520px] md:h-[550px]">
            {items.map((product, index) => (
              <StackRevealCard
                key={product.id || index}
                index={index}
                product={product}
                advance={advance}
                flyDistance={flyDistance}
                priority={index < 2}
                // Only the cards near the visible one get GPU layer promotion
                // and a rendered shadow — with up to 8 cards stacked and fully
                // overlapping, promoting every one of them is what was making
                // the deck feel heavy/laggy to scroll through on mobile GPUs.
                // Kept tight (prev/current/next only, not +/-2) since each
                // promoted card is its own compositor layer for the whole
                // scroll-linked gesture — fewer live layers is what actually
                // buys back the frame budget on weaker GPUs.
                isNear={Math.abs(index - activeCardIndex) <= 1}
              />
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="relative z-40 pb-2 flex items-center gap-2" aria-hidden="true">
          {items.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeCardIndex
                  ? "h-2 w-6 bg-primary"
                  : i < activeCardIndex
                  ? "h-1.5 w-1.5 bg-primary/40"
                  : "h-1.5 w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
