"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ImageUp } from "lucide-react"
import type { CategoryMeta } from "@/lib/site-data"
import type { Product } from "@/lib/products"

export function ProductForm({
  categories,
  product,
  initialCategorySlug,
  error,
}: {
  categories: CategoryMeta[]
  product?: Product
  initialCategorySlug?: string
  /** Message from a failed save (the save endpoint redirects back with ?error=). */
  error?: string
}) {
  const [saving, setSaving] = useState(false)
  const defaultCategory = product?.categorySlug ?? initialCategorySlug ?? categories[0]?.slug ?? ""
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)
  const [preview, setPreview] = useState<string | null>(product?.image ?? null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <form
      method="post"
      action="/admin/save/product"
      encType="multipart/form-data"
      onSubmit={() => setSaving(true)}
      className="flex flex-col gap-5"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="categorySlug" className="text-xs font-bold uppercase tracking-wider text-foreground">
          Category
        </label>
        <select
          id="categorySlug"
          name="categorySlug"
          required
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-foreground">
          Product Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={product?.name}
          className="mt-1.5 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="grade" className="text-xs font-bold uppercase tracking-wider text-foreground">
            Grade (optional)
          </label>
          <input
            id="grade"
            name="grade"
            type="text"
            defaultValue={product?.grade}
            placeholder="e.g. GI, 304, 316"
            className="mt-1.5 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="standard" className="text-xs font-bold uppercase tracking-wider text-foreground">
            Standard (optional)
          </label>
          <input
            id="standard"
            name="standard"
            type="text"
            defaultValue={product?.standard}
            placeholder="e.g. DIN934"
            className="mt-1.5 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={product?.description}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-input bg-secondary/40 px-4 py-3">
        <input
          id="featured"
          name="featured"
          type="checkbox"
          defaultChecked={product?.featured ?? false}
          className="size-4 rounded border-input accent-accent"
        />
        <span className="text-sm">
          <span className="font-bold text-foreground">Feature on homepage</span>
          <span className="block text-xs text-muted-foreground">Shown in the animated Featured Products showcase on your homepage.</span>
        </span>
      </label>

      <label className="flex items-center gap-3 rounded-lg border border-input bg-secondary/40 px-4 py-3">
        <input
          id="heroCarousel"
          name="heroCarousel"
          type="checkbox"
          defaultChecked={product?.heroCarousel ?? false}
          className="size-4 rounded border-input accent-accent"
        />
        <span className="text-sm">
          <span className="font-bold text-foreground">Show in hero carousel</span>
          <span className="block text-xs text-muted-foreground">Included in the rotating 3D product showcase at the top of your homepage.</span>
        </span>
      </label>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-foreground">
          Photo {product ? "(leave blank to keep current)" : ""}
        </label>
        <input
          ref={fileInputRef}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setPreview(URL.createObjectURL(file))
              setFileName(file.name)
            }
          }}
        />
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-accent bg-accent/5 px-4 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <ImageUp className="size-4" /> {preview ? "Change Image" : "Add Image"}
          </button>
          {fileName && <span className="truncate text-xs text-muted-foreground">{fileName}</span>}
        </div>
        {preview && (
          <div className="relative mt-3 size-32 overflow-hidden rounded-lg border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="size-full object-contain p-2" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="h-12 flex-1 rounded-lg btn-primary text-sm font-bold disabled:opacity-70">
          {saving ? "Saving…" : product ? "Save Changes" : "Add Product"}
        </button>
        <Link
          href={`/admin/products${selectedCategory ? `?category=${selectedCategory}#category-${selectedCategory}` : ""}`}
          className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-secondary/50 px-6 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
