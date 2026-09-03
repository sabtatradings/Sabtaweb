"use client"

import { useRef, useState, useEffect } from "react"
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion"
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

  useMotionValueEvent(advance, "change", (v) => {
    setActiveCardIndex(Math.min(cardCount - 1, Math.max(0, Math.round(v))))
  })

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
