import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { getCategories, getProductById } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductForm } from "@/components/admin/product-form"

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { error } = await searchParams
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ])
  if (!product) notFound()

  const currentCategory = categories.find((c) => c.slug === product.categorySlug)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 md:px-8">
      <Link
        href={`/admin/products?category=${product.categorySlug}#category-${product.categorySlug}`}
        className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to {currentCategory?.name ?? "Products"}
      </Link>

      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">Edit Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      <div className="mt-8">
        <ProductForm categories={categories} product={product} error={error} />
      </div>
    </div>
  )
}
