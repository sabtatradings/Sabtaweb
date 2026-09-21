import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAdmin } from "@/lib/auth"
import { getCategories } from "@/lib/db"
import { ProductForm } from "@/components/admin/product-form"

export const metadata: Metadata = {
  title: "Add Product",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; error?: string }>
}) {
  await requireAdmin()
  const { category, error } = await searchParams
  const categories = await getCategories()
  const currentCategory = categories.find((c) => c.slug === category)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 md:px-8">
      <Link
        href={`/admin/products${category ? `?category=${category}#category-${category}` : ""}`}
        className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to {currentCategory?.name ?? "Products"}
      </Link>

      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">Add Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {currentCategory ? `Adding to ${currentCategory.name}` : "This will appear on the site immediately."}
      </p>
      <div className="mt-8">
        <ProductForm categories={categories} initialCategorySlug={category} error={error} />
      </div>
    </div>
  )
}
