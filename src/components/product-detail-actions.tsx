"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, MessageCircle, ShoppingBag } from "lucide-react"
import { useQuote } from "@/context/quote-context"
import { useSiteData } from "@/context/site-data-context"

type ProductForActions = {
  id: string
  name: string
  categorySlug: string
  categoryName: string
  grade?: string
  standard?: string
  image?: string
}

export function ProductDetailActions({ product }: { product: ProductForActions }) {
  const { contactInfo } = useSiteData()
  const { addItem } = useQuote()
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productName: product.name,
      categoryName: product.categoryName,
      categorySlug: product.categorySlug,
      grade: product.grade,
      standard: product.standard,
      image: product.image,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          className={`group relative inline-flex h-13 flex-1 items-center overflow-hidden rounded-lg btn-primary text-sm transition-all ${
            added ? "bg-accent-hover" : ""
          }`}
        >
          <span className="mx-auto mr-8 flex items-center gap-2 transition-opacity duration-500 group-hover:opacity-0">
            {added ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />}
            {added ? "Added to Quote Cart" : "Add to Quote Cart"}
          </span>
          <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
            <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
          </span>
        </button>
        <a
          href={contactInfo.primaryWhatsappHref}
          target="_blank"
          rel="noreferrer"
          className="group relative inline-flex h-13 flex-1 items-center overflow-hidden rounded-lg btn-secondary text-sm"
        >
          <span className="mx-auto mr-8 flex items-center gap-2 transition-opacity duration-500 group-hover:opacity-0">
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            WhatsApp Us
          </span>
          <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-primary/10 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
            <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
          </span>
        </a>
      </div>

      <Link
        href={`/contact?category=${encodeURIComponent(product.categoryName)}&product=${encodeURIComponent(product.name)}`}
        rel="nofollow"
        className="text-center text-xs font-semibold text-muted-foreground underline-offset-2 transition-colors hover:text-accent hover:underline"
      >
        Or request a quote for just this item by email
      </Link>
    </div>
  )
}
