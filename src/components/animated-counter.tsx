"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            const start = performance.now()
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration)
              const eased = 1 - Math.pow(1 - t, 3)
              setValue(Math.round(eased * target))
              if (t < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  // The server-rendered HTML would otherwise read "0+" to crawlers and
  // screen readers; they get the real figure, the animation stays visual-only.
  return (
    <span ref={ref}>
      <span aria-hidden="true">
        {value.toLocaleString()}
        {suffix}
      </span>
      <span className="sr-only">
        {target.toLocaleString("en-US")}
        {suffix}
      </span>
    </span>
  )
}
