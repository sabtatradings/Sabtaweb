import Link from "next/link"
import { ChevronRight, PackageCheck, ShieldCheck } from "lucide-react"
import { getSiteConfig, getHeroCarouselProducts } from "@/lib/db"
import { HeroHeadline } from "@/components/home/hero-headline"
import { ThreeDPhotoCarousel, type CarouselImage } from "@/components/home/three-d-photo-carousel"

// Default spread of real Sabta product photography, used until an admin
// hand-picks products for the hero carousel (Products → edit → "Show in
// hero carousel"). Once at least one product is marked, that selection
// takes over entirely.
const FALLBACK_CAROUSEL_IMAGES: CarouselImage[] = [
  { src: "/products/rigging-hardware/swivel-eye-snap-hook.webp", alt: "Swivel eye snap hook" },
  { src: "/products/hose-clips-clamps/hose-clip.webp", alt: "Stainless steel hose clip" },
  { src: "/products/washers/flat-washer.webp", alt: "Flat washer" },
  { src: "/products/clips-pins/circlip-external-din471.webp", alt: "DIN471 external circlip" },
  { src: "/products/lifting-marine-hardware/bow-shackle-bolt-type.webp", alt: "Bow shackle, bolt type" },
  { src: "/products/nuts/hex-nut-din934.webp", alt: "DIN934 hex nut" },
  { src: "/products/rigging-hardware/eye-bolt.webp", alt: "Eye bolt" },
  { src: "/products/clips-pins/e-clips.webp", alt: "E-clip" },
  { src: "/products/rigging-hardware/swivel-eye-snap-bolt.webp", alt: "Swivel eye snap bolt" },
]

// The 3D ring's geometry (face width, spacing) is tuned around roughly this
// many faces — with too few, a single face balloons to the full cylinder
// width and the "ring" collapses into one oversized flat panel instead of a
// rotating corridor. So a hand-picked selection smaller than this is padded
// out with the curated fallback photos (never duplicating a src already
// picked) rather than rendered on its own.
const MIN_CAROUSEL_IMAGES = 9

// The rotating 3D product ring is superseded by the hero background video
// below (real footage beats a static photo carousel) — hidden, not removed.
// Flip SHOW_RING back on (and drop the video layer) to restore it.
const SHOW_RING = false

export async function Hero() {
  const [siteConfig, heroProducts] = await Promise.all([getSiteConfig(), getHeroCarouselProducts()])
  const heroSelections: CarouselImage[] = heroProducts.map((p) => ({ src: p.image!, alt: p.name }))
  const usedSrcs = new Set(heroSelections.map((img) => img.src))
  const padding = FALLBACK_CAROUSEL_IMAGES.filter((img) => !usedSrcs.has(img.src))
  const carouselImages: CarouselImage[] =
    heroSelections.length === 0
      ? FALLBACK_CAROUSEL_IMAGES
      : [...heroSelections, ...padding].slice(0, Math.max(heroSelections.length, MIN_CAROUSEL_IMAGES))
  return (
    <section className="relative isolate overflow-hidden bg-primary py-16 sm:py-20 md:py-24 lg:py-28">
      {/* Background video layer — muted, autoplaying, looping hero footage.
          Sits above the grid-texture/glow decoration below (those were
          tuned for the old flat-blue background and would otherwise draw
          as a faint pattern over the footage), so the video reads on top
          of them, not underneath. */}
      <div className="absolute inset-0 z-[2] bg-[url('/hero/hero-poster.webp')] bg-cover bg-center" aria-hidden="true">
        <video
          className="size-full object-cover transform-gpu"
          poster="/hero/hero-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/hero/hero-video.mp4" type="video/mp4" />
          <source src="/hero/hero-video.webm" type="video/webm" />
        </video>
        {/* Light legibility gradient only — mostly transparent, so the
            footage reads clearly instead of washing out under a flat tint.
            Just enough blue behind the text column and along the bottom
            edge (buttons) for contrast; the rest of the frame is clean. */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 z-[1] surface-grid opacity-[0.05]" aria-hidden="true" />
      <div className="absolute -top-24 -right-24 z-[1] size-96 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          {/* Below lg the grid is a single implicit column, so these two
              children just stack — order flips that stack (ring, then
              text) without touching the lg two-column layout, where
              order-1/order-2 restores the original left-text/right-ring
              placement. */}
          <div className="order-2 max-w-2xl lg:order-1">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground backdrop-blur-md">
              <span className="relative flex size-2 rounded-full bg-accent" aria-hidden="true">
                <span className="soft-pulse absolute inset-0 rounded-full bg-accent" />
              </span>
              <span>Dubai, UAE &middot; Since {siteConfig.founded}</span>
            </div>

            <HeroHeadline text="Fastener & Marine Rigging Hardware, Ready to Ship" />

            <p data-speakable className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              Dubai-based fastener and marine rigging hardware distributor since 1994. {siteConfig.itemsInStock} items in
              stock for Automotive, Manufacturing, Marine and Oilfield &mdash; anything else, we source it.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-white/90 sm:gap-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <PackageCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{siteConfig.itemsInStock} Items In Stock</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>304 &amp; 316 Marine Grade Stock</span>
              </div>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/products"
                className="group relative inline-flex h-13 items-center overflow-hidden rounded-xl btn-primary px-8 text-sm font-bold uppercase tracking-wider shadow-2xl"
              >
                <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">Browse Products</span>
                <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/contact"
                className="group relative inline-flex h-13 items-center overflow-hidden rounded-xl border border-white/30 bg-white/10 px-8 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-primary"
              >
                <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">Request a Quote</span>
                <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/20 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              </Link>
            </div>
          </div>

          {/* min-w-0: this wrapper (not ThreeDPhotoCarousel's own root) is
              the actual grid item now, so it needs the same min-w-0 the
              carousel's root already carries internally — otherwise this
              div defaults to min-width:auto and gets pulled wide enough to
              fit the cylinder's content-based min width, same as the bug
              min-w-0 fixes inside the carousel component itself. */}
          {SHOW_RING && (
            <div className="order-1 min-w-0 lg:order-2">
              <ThreeDPhotoCarousel images={carouselImages} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
