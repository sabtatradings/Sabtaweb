import type { Metadata } from "next"
import { getCategories } from "@/lib/db"
import { CategoryEditor } from "@/components/admin/category-editor"

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <CategoryEditor initialCategories={categories} />
    </div>
  )
}
