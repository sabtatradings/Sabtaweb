import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { CategoryWithItems } from "@/lib/products"

export function CategoryCard({
  category,
  onMouseEnter,
  onMouseLeave,
}: {
  category: CategoryWithItems
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const previewImage = category.image || category.items.find((item) => item.image)?.image

  return (
    <Link
      href={`/categories/${category.slug}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="card-premium group flex h-full flex-col overflow-hidden p-0"
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-white">
        {previewImage ? (
          <Image
            src={previewImage}
            alt={`${category.name} stocked in Dubai`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="size-full" style={{ backgroundColor: category.color }} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 border-t border-border p-6 sm:p-7">
        <h3 className="text-lg font-black uppercase leading-tight tracking-tight text-foreground">{category.name}</h3>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category.items.length}+ Product Types</span>
          <ArrowRight className="size-5 text-accent transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}
