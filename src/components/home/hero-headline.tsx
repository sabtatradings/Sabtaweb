"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

/**
 * Waits for the boot loading screen to finish before reporting ready, so the
 * headline reveal is actually seen rather than playing out behind the loader.
 *
 * Three paths get us to ready:
 *  - the visitor has already seen the loader this tab session (it self-skips),
 *  - the loader tells us it has finished via the `sabta:loaded` event,
 *  - a safety timeout, in case the loader is ever removed from the layout.
 */
function useBootReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alreadyBooted = false
    try {
      alreadyBooted = Boolean(sessionStorage.getItem("sabta-loaded"))
    } catch {
      // Private-mode browsers can throw on sessionStorage access; fall through
      // to the event + timeout path rather than breaking the reveal.
    }

    if (alreadyBooted) {
      setReady(true)
      return
    }

    const onLoaded = () => setReady(true)
    window.addEventListener("sabta:loaded", onLoaded)
    const fallback = window.setTimeout(() => setReady(true), 3600)

    return () => {
      window.removeEventListener("sabta:loaded", onLoaded)
      window.clearTimeout(fallback)
    }
  }, [])

  return ready
}

const HEADLINE_CLASS =
  "text-4xl font-black uppercase leading-[1.05] tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl"

export function HeroHeadline({ text }: { text: string }) {
  const ready = useBootReady()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  if (reducedMotion) {
    return <h1 className={`text-balance ${HEADLINE_CLASS}`}>{text}</h1>
  }

  const words = text.split(" ")

  return (
    <h1 className={HEADLINE_CLASS} aria-label={text}>
      {/* The accessible name is the whole line (aria-label), so screen readers
          never announce it word by word, and the heading's text exists exactly
          once in the DOM for crawlers (no visually-hidden duplicate). */}
      <span>
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            // The mask each word slides up out of. The tiny padding keeps any
            // glyph overhang from being clipped by overflow-hidden.
            className="inline-block overflow-hidden pb-[0.08em] align-bottom"
          >
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={ready ? { y: "0%" } : { y: "110%" }}
              transition={{
                duration: 0.7,
                delay: ready ? i * 0.065 : 0,
                ease: [0.16, 0.84, 0.28, 1],
              }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  )
}
