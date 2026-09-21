import Image from "next/image"
import Link from "next/link"
import type { CategoryMeta } from "@/lib/site-data"
import type { Product } from "@/lib/products"
import { CategoryIcon } from "@/components/category-icon"

export function ProductCard({ item, color, icon }: { item: Product; color: string; icon: CategoryMeta["icon"] }) {
  return (
    <Link href={`/products/${item.categorySlug}/${item.slug}`} className="card-premium group flex flex-col overflow-hidden p-0">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.grade ? `${item.name}, ${item.grade}` : item.name}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: color }}>
            <CategoryIcon icon={icon} className="size-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-border p-4">
        <span className="text-sm font-bold leading-snug text-foreground">{item.name}</span>
        {(item.grade || item.standard) && (
          <span className="text-xs font-semibold text-accent">
            {item.grade && <>{item.grade}</>}
            {item.grade && item.standard && " · "}
            {item.standard && <>{item.standard}</>}
          </span>
        )}
        <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
      </div>
    </Link>
  )
}
